import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { LogEntry } from '../models/LogEntry.js';
import { MotherProfile } from '../models/MotherProfile.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { wrap } from '../middleware/error.js';
import { computeProgress } from '../utils/pregnancy.js';
import { SYMPTOMS, evaluate } from '../utils/redFlags.js';
import { extractFromNote } from '../utils/gemini.js';
import { decrypt, encrypt } from '../utils/crypto.js';
import { checkAndNudge } from '../utils/support.js';

const router = Router();
router.use(requireAuth, requireRole('mother'));

const range = (min, max) => z.number().min(min).max(max).nullish();
const entrySchema = z
  .object({
    clientId: z.string().min(8).max(64),
    loggedAt: z.coerce.date(),
    source: z.enum(['text', 'voice']).default('text'),
    symptoms: z.array(z.enum(SYMPTOMS)).max(30).default([]),
    mood: z.number().int().min(1).max(5).nullish(),
    vitals: z
      .object({ systolic: range(50, 260), diastolic: range(30, 160), weightKg: range(25, 250), tempC: range(34, 42), kicks: range(0, 200) })
      .default({}),
    note: z.string().trim().max(2000).nullish(),
  })
  .refine((e) => (e.vitals.systolic == null) === (e.vitals.diastolic == null), { message: 'Give both BP numbers', path: ['vitals'] });

const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));

const present = (raw) => {
  const doc = raw.toObject ? raw.toObject() : raw;
  return {
    clientId: doc.clientId,
    loggedAt: doc.loggedAt,
    source: doc.source,
    symptoms: doc.symptoms,
    mood: doc.mood ?? null,
    vitals: doc.vitals || {},
    note: doc.noteEnc ? safeDecrypt(doc.noteEnc) : undefined,
    flags: doc.flags || [],
    summary: doc.extracted?.summary || undefined,
  };
};

function safeDecrypt(v) {
  try { return decrypt(v); } catch { return undefined; }
}

async function processEntry(userId, e, progress) {
  if (mongoose.connection.readyState === 1) {
    const existing = await LogEntry.findOne({ user: userId, clientId: e.clientId });
    if (existing) return present(existing);
  }

  const extracted = e.note ? await extractFromNote(e.note) : null;
  const symptoms = [...new Set([...e.symptoms, ...(extracted?.symptoms || [])])];
  const vitals = clean(e.vitals);
  const flags = evaluate({ stage: progress?.stage, week: progress?.gestationalWeek, vitals, symptoms, mood: e.mood ?? extracted?.mood ?? null });

  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await LogEntry.create({
        user: userId, clientId: e.clientId, loggedAt: e.loggedAt, source: e.source, symptoms,
        mood: e.mood ?? undefined, vitals, noteEnc: e.note ? encrypt(e.note) : undefined,
        extracted: extracted ? clean(extracted) : undefined, flags,
      });
      return present(doc);
    } catch (err) {
      if (err.code === 11000) return present(await LogEntry.findOne({ user: userId, clientId: e.clientId }));
      throw err;
    }
  }

  return {
    clientId: e.clientId,
    loggedAt: e.loggedAt,
    source: e.source,
    symptoms,
    mood: e.mood ?? null,
    vitals,
    flags,
  };
}

// Idempotent batch sync from the offline outbox.
router.post('/sync', wrap(async (req, res) => {
  const entries = z.array(z.unknown()).max(25).parse(req.body?.entries ?? []);
  let profile = null;
  if (mongoose.connection.readyState === 1) {
    profile = await MotherProfile.findOne({ user: req.user.id });
  }
  const progress = computeProgress(profile);
  const results = [];
  for (const raw of entries) {
    const parsed = entrySchema.safeParse(raw);
    if (!parsed.success) {
      results.push({ ok: false, clientId: raw?.clientId, error: parsed.error.issues[0]?.message });
      continue;
    }
    results.push({ ok: true, ...(await processEntry(req.user.id, parsed.data, progress)) });
  }
  if (mongoose.connection.readyState === 1 && results.some((r) => r.ok)) {
    const urgent = results.some((r) => r.flags?.some((f) => f.code === 'self_harm_thoughts'));
    checkAndNudge(req.user.id, { urgent }).catch((e) => console.warn('Nudge check failed:', e.message));
  }
  res.json({ results });
}));

router.get('/', wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const docs = await LogEntry.find({ user: req.user.id }).sort({ loggedAt: -1 }).limit(200);
    return res.json({ logs: docs.map(present) });
  }
  return res.json({ logs: [] });
}));

export default router;
