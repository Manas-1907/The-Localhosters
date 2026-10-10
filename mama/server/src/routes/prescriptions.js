import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';
import { extractPrescription } from '../utils/gemini.js';
import { defaultTimes } from '../utils/prescription.js';
import { istDate, istToUtc } from '../utils/time.js';

const router = Router();
router.use(requireAuth, requireRole('mother'), rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false }));

// The photo is read and discarded (never stored). The result is only a DRAFT: the client shows an edit screen and the
// mother confirms each medicine, which then goes through POST /api/medicines. No reminder exists before that.
router.post('/scan', express.raw({ type: 'image/*', limit: '6mb' }), wrap(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw new HttpError(400, 'No image received');
  const mime = (req.headers['content-type'] || 'image/jpeg').split(';')[0];
  const today = istDate();
  try {
    const out = await extractPrescription(req.body, mime, today);
    const drafts = out.medicines.map((m) => ({
      name: m.name,
      dosage: m.dosage || '',
      times: defaultTimes(m),
      startDate: today,
      endDate: m.durationDays ? istDate(new Date(istToUtc(today, '00:00').getTime() + (m.durationDays - 1) * 86400000)) : '',
      notes: m.instructions || '',
      confidence: m.confidence,
    }));
    res.json({ medicines: drafts, followUpDate: out.followUpDate || null, doctorName: out.doctorName || null });
  } catch (err) {
    if (err.message === 'not_configured') throw new HttpError(503, 'Prescription reading is not configured on the server');
    console.warn('Prescription scan failed:', err.message);
    throw new HttpError(502, 'Could not read this image');
  }
}));

export default router;
