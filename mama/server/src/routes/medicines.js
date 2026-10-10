import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Medicine } from '../models/Medicine.js';
import { DoseLog } from '../models/DoseLog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';
import { istDate } from '../utils/time.js';

const router = Router();
router.use(requireAuth, requireRole('mother'));

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const todayYmd = () => new Date().toISOString().split('T')[0];
const base = z.object({
  name: z.string().trim().min(1).max(80),
  dosage: z.string().trim().max(80).optional().default('As prescribed'),
  times: z.array(hhmm).min(1).max(6).optional().default(['09:00']),
  startDate: ymd.optional().default(todayYmd),
  endDate: ymd.nullish(),
  notes: z.string().trim().max(300).optional().default(''),
});
const createSchema = base.extend({ source: z.enum(['manual', 'ocr']).optional() }).refine((v) => !v.endDate || v.endDate >= v.startDate, { message: 'End date is before start date', path: ['endDate'] });
const patchSchema = base.partial().extend({ active: z.boolean().optional() });
const doseSchema = z.object({ time: hhmm, status: z.enum(['taken', 'skipped']) });

const own = async (req) => {
  const m = await Medicine.findOne({ _id: req.params.id, user: req.user.id });
  if (!m) throw new HttpError(404, 'Medicine not found');
  return m;
};

const standaloneMedicinesMap = new Map();

router.get('/', wrap(async (req, res) => {
  const today = istDate();
  if (mongoose.connection.readyState === 1) {
    const [medicines, doses] = await Promise.all([
      Medicine.find({ user: req.user.id }).sort({ active: -1, createdAt: -1 }),
      DoseLog.find({ user: req.user.id, date: today }),
    ]);
    return res.json({ today, medicines, doses: doses.map((d) => ({ medicine: String(d.medicine), time: d.time, status: d.status })) });
  }
  const userMeds = standaloneMedicinesMap.get(String(req.user.id)) || [];
  return res.json({ today, medicines: userMeds, doses: [] });
}));

router.post('/', wrap(async (req, res) => {
  const body = createSchema.parse(req.body);
  if (mongoose.connection.readyState === 1) {
    const med = await Medicine.create({ ...body, times: [...new Set(body.times)].sort(), user: req.user.id });
    return res.status(201).json({ medicine: med });
  }

  // Standalone fallback when DB is disconnected
  const fallbackMed = {
    _id: 'med_' + Date.now(),
    name: body.name,
    dosage: body.dosage || 'As prescribed',
    times: body.times || ['09:00'],
    startDate: body.startDate || new Date().toISOString().split('T')[0],
    notes: body.notes || '',
    active: true
  };
  const list = standaloneMedicinesMap.get(String(req.user.id)) || [];
  list.push(fallbackMed);
  standaloneMedicinesMap.set(String(req.user.id), list);

  return res.status(201).json({ medicine: fallbackMed });
}));

router.patch('/:id', wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const med = await own(req);
    const body = patchSchema.parse(req.body);
    if (body.times) body.times = [...new Set(body.times)].sort();
    Object.assign(med, body);
    if (med.verified === false && body.name) med.verified = true;
    await med.save();
    return res.json({ medicine: med });
  }
  const list = standaloneMedicinesMap.get(String(req.user.id)) || [];
  const idx = list.findIndex(m => String(m._id) === String(req.params.id));
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...req.body };
    standaloneMedicinesMap.set(String(req.user.id), list);
  }
  res.json({ ok: true });
}));

router.delete('/:id', wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const med = await own(req);
    await Promise.all([med.deleteOne(), DoseLog.deleteMany({ medicine: med._id })]);
  } else {
    const list = standaloneMedicinesMap.get(String(req.user.id)) || [];
    standaloneMedicinesMap.set(String(req.user.id), list.filter(m => String(m._id) !== String(req.params.id)));
  }
  res.json({ ok: true });
}));

router.post('/:id/doses', wrap(async (req, res) => {
  const { time, status } = doseSchema.parse(req.body);
  if (mongoose.connection.readyState === 1) {
    const med = await own(req);
    if (!med.times.includes(time)) throw new HttpError(400, 'That time is not in this medicine\'s schedule');
    const dose = await DoseLog.findOneAndUpdate(
      { medicine: med._id, date: istDate(), time },
      { user: req.user.id, status },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ dose });
  }
  return res.json({ dose: { medicine: req.params.id, time, status } });
}));

export default router;
