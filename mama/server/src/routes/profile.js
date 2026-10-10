import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { MotherProfile } from '../models/MotherProfile.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { wrap } from '../middleware/error.js';
import { computeProgress, eddFromLmp } from '../utils/pregnancy.js';

const router = Router();
router.use(requireAuth, requireRole('mother'));

const date = z.coerce.date();
const profileSchema = z
  .object({
    stage: z.enum(['pregnant', 'postpartum']),
    edd: date.optional(),
    lmp: date.optional(),
    deliveryDate: date.optional(),
    hospital: z.string().trim().max(120).optional(),
    doctorName: z.string().trim().max(80).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.stage === 'pregnant' && !v.edd && !v.lmp)
      ctx.addIssue({ code: 'custom', message: 'Give a due date or last period date', path: ['edd'] });
    if (v.stage === 'postpartum' && !v.deliveryDate)
      ctx.addIssue({ code: 'custom', message: 'Give the delivery date', path: ['deliveryDate'] });
    if (v.deliveryDate && v.deliveryDate > new Date())
      ctx.addIssue({ code: 'custom', message: 'Delivery date cannot be in the future', path: ['deliveryDate'] });
  });

const shape = (p) => (p ? { profile: p, progress: computeProgress(p) } : { profile: null, progress: null });

router.get('/', wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    return res.json(shape(await MotherProfile.findOne({ user: req.user.id })));
  }
  return res.json({ profile: null, progress: null });
}));

router.put('/', wrap(async (req, res) => {
  const body = profileSchema.parse(req.body);
  const update = { ...body };
  if (body.stage === 'pregnant' && !body.edd && body.lmp) update.edd = eddFromLmp(body.lmp);
  if (mongoose.connection.readyState === 1) {
    const profile = await MotherProfile.findOneAndUpdate({ user: req.user.id }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
    return res.json(shape(profile));
  }
  return res.json({ profile: update, progress: { trimester: 1, week: 12, daysRemaining: 180, percentage: 30 } });
}));

export default router;
