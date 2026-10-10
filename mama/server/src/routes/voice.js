import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';
import { transcribe } from '../utils/stt.js';

const router = Router();
router.use(requireAuth, requireRole('mother'), rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }));

// The raw audio body is transcribed and discarded. Nothing is written to disk or the database.
router.post('/transcribe', express.raw({ type: 'audio/*', limit: '5mb' }), wrap(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw new HttpError(400, 'No audio received');
  const mime = (req.headers['content-type'] || 'audio/webm').split(';')[0];
  try {
    res.json({ text: await transcribe(req.body, mime) });
  } catch (err) {
    if (err.message === 'not_configured') throw new HttpError(503, 'Voice is not configured on the server');
    console.warn('Transcription failed:', err.message);
    throw new HttpError(502, 'Could not convert the voice note to text');
  }
}));

export default router;
