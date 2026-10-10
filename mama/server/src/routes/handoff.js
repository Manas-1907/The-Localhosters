import crypto from 'node:crypto';
import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { HandoffLink } from '../models/HandoffLink.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';
import { config } from '../config.js';
import { buildSummary } from '../utils/summary.js';

const router = Router();

// ---- Public: the doctor opens the link. The secret token is the only credential, so keep it unguessable and short-lived.
router.get('/view/:token', rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false }), wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const link = await HandoffLink.findOne({ token: req.params.token });
    if (!link || link.revokedAt || link.expiresAt < new Date()) throw new HttpError(404, 'This link has expired or is not valid');
    link.openedCount += 1;
    link.lastOpenedAt = new Date();
    await link.save();
    res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
    return res.json({ summary: await buildSummary(link.user, link.include), expiresAt: link.expiresAt });
  }
  return res.json({ summary: { vitals: [], medicines: [], symptoms: [] }, expiresAt: new Date(Date.now() + 86400000) });
}));

// ---- Mother only
router.use(requireAuth, requireRole('mother'));

const includeSchema = z.object({
  vitals: z.boolean().default(false), medicines: z.boolean().default(false), symptoms: z.boolean().default(false),
  mood: z.boolean().default(false), notes: z.boolean().default(false),
});
const createSchema = z.object({ include: includeSchema, days: z.union([z.literal(1), z.literal(3), z.literal(7)]).default(3) })
  .refine((v) => Object.values(v.include).some(Boolean), { message: 'Choose at least one thing to share', path: ['include'] });

// Lets her see exactly what the doctor would see before she creates a link.
router.post('/preview', wrap(async (req, res) => {
  const { include } = z.object({ include: includeSchema }).parse(req.body);
  if (mongoose.connection.readyState === 1) {
    return res.json({ summary: await buildSummary(req.user.id, include) });
  }
  return res.json({ summary: { vitals: [], medicines: [], symptoms: [] } });
}));

router.post('/', wrap(async (req, res) => {
  const { include, days } = createSchema.parse(req.body);
  const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000);
  if (mongoose.connection.readyState === 1) {
    const link = await HandoffLink.create({ user: req.user.id, token: crypto.randomBytes(24).toString('hex'), expiresAt, include, purgeAt: new Date(expiresAt.getTime() + 30 * 24 * 3600 * 1000) });
    return res.status(201).json({ link: shape(link) });
  }
  return res.status(201).json({ link: { id: 'link_' + Date.now(), token: crypto.randomBytes(24).toString('hex'), url: config.appBaseUrl + '/d/preview', expiresAt, openedCount: 0 } });
}));

router.get('/', wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const links = await HandoffLink.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10);
    return res.json({ links: links.map(shape) });
  }
  return res.json({ links: [] });
}));

router.delete('/:id', wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const link = await HandoffLink.findOne({ _id: req.params.id, user: req.user.id });
    if (!link) throw new HttpError(404, 'Not found');
    link.revokedAt = new Date();
    await link.save();
  }
  res.json({ ok: true });
}));

const shape = (l) => ({
  id: l._id, url: `${config.appUrl}/handoff/${l.token}`, expiresAt: l.expiresAt, createdAt: l.createdAt, include: l.include,
  openedCount: l.openedCount, lastOpenedAt: l.lastOpenedAt || null, active: !l.revokedAt && l.expiresAt > new Date(),
  revoked: Boolean(l.revokedAt),
});

export default router;
