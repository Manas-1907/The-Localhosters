import { Router } from 'express';
import { z } from 'zod';
import { MoodCheck } from '../models/MoodCheck.js';
import { SupportMember } from '../models/SupportMember.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { wrap } from '../middleware/error.js';
import { EPDS_HIGH, EPDS_POSSIBLE, checkAndNudge, persistentLowMood } from '../utils/support.js';

const router = Router();
router.use(requireAuth, requireRole('mother'));

// EPDS: 10 items, each already scored 0-3 by the client (items 3 and 5-10 are reverse-scored in the option order).
const epdsSchema = z.object({ answers: z.array(z.number().int().min(0).max(3)).length(10) });

router.post('/epds', wrap(async (req, res) => {
  const { answers } = epdsSchema.parse(req.body);
  const total = answers.reduce((a, b) => a + b, 0);
  const level = total >= EPDS_HIGH ? 'high' : total >= EPDS_POSSIBLE ? 'possible' : 'low';
  const crisis = answers[9] >= 1;
  await MoodCheck.create({ user: req.user.id, answers, total, level, crisis });

  let nudge = { sent: 0 };
  if (crisis || level !== 'low') nudge = await checkAndNudge(req.user.id, { urgent: crisis }).catch((e) => { console.warn('Nudge failed:', e.message); return { sent: 0 }; });
  res.json({ total, level, crisis, nudgeSent: nudge.sent > 0 });
}));

router.get('/status', wrap(async (req, res) => {
  const [latest, persistentLow, circleCount] = await Promise.all([
    MoodCheck.findOne({ user: req.user.id }).sort({ takenAt: -1 }),
    persistentLowMood(req.user.id),
    SupportMember.countDocuments({ user: req.user.id, status: 'active' }),
  ]);
  res.json({ persistentLow, circleCount, latest: latest && { total: latest.total, level: latest.level, takenAt: latest.takenAt } });
}));

export default router;
