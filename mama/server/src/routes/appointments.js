import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Appointment } from '../models/Appointment.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';

const router = Router();
router.use(requireAuth, requireRole('mother'));

const schema = z.object({
  title: z.string().trim().min(1).max(100),
  at: z.coerce.date(),
  doctorName: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(300).optional(),
});

const standaloneAppointmentsMap = new Map();

router.get('/', wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const items = await Appointment.find({ user: req.user.id }).sort({ at: 1 });
    return res.json({ appointments: items });
  }
  const userAppts = standaloneAppointmentsMap.get(String(req.user.id)) || [];
  return res.json({ appointments: userAppts });
}));

router.post('/', wrap(async (req, res) => {
  const body = schema.parse(req.body);
  if (mongoose.connection.readyState === 1) {
    const appt = await Appointment.create({ ...body, user: req.user.id });
    return res.status(201).json({ appointment: appt });
  }
  const fallbackAppt = {
    _id: 'appt_' + Date.now(),
    title: body.title,
    at: body.at,
    doctorName: body.doctorName || '',
    location: body.location || '',
    notes: body.notes || ''
  };
  const list = standaloneAppointmentsMap.get(String(req.user.id)) || [];
  list.push(fallbackAppt);
  standaloneAppointmentsMap.set(String(req.user.id), list);

  return res.status(201).json({ appointment: fallbackAppt });
}));

router.patch('/:id', wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const appt = await Appointment.findOne({ _id: req.params.id, user: req.user.id });
    if (!appt) throw new HttpError(404, 'Appointment not found');
    Object.assign(appt, schema.partial().extend({ done: z.boolean().optional() }).parse(req.body));
    await appt.save();
    return res.json({ appointment: appt });
  }
  const list = standaloneAppointmentsMap.get(String(req.user.id)) || [];
  const idx = list.findIndex(a => String(a._id) === String(req.params.id));
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...req.body };
    standaloneAppointmentsMap.set(String(req.user.id), list);
  }
  res.json({ ok: true });
}));

router.delete('/:id', wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const r = await Appointment.deleteOne({ _id: req.params.id, user: req.user.id });
    if (!r.deletedCount) throw new HttpError(404, 'Appointment not found');
  } else {
    const list = standaloneAppointmentsMap.get(String(req.user.id)) || [];
    standaloneAppointmentsMap.set(String(req.user.id), list.filter(a => String(a._id) !== String(req.params.id)));
  }
  res.json({ ok: true });
}));

export default router;
