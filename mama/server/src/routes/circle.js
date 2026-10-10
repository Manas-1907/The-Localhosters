import crypto from 'node:crypto';
import { Router } from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { SupportMember } from '../models/SupportMember.js';
import { SupportNudge } from '../models/SupportNudge.js';
import { User } from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';
import { inviteLink, inviteMail } from '../utils/support.js';
import { sendMail } from '../utils/mailer.js';

const router = Router();

// ---- Public: the invited person opens the link from their email or WhatsApp. The secret token is the only credential.
const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false });

router.get('/invite/:token', publicLimiter, wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const m = await SupportMember.findOne({ token: req.params.token });
    if (!m) throw new HttpError(404, 'This link is not valid');
    const mother = await User.findById(m.user).select('name');
    return res.json({ status: m.status, memberName: m.name, relation: m.relation, motherName: mother?.name?.split(/\s+/)[0], language: m.language });
  }
  return res.json({ status: 'invited', memberName: 'Support Member', relation: 'Family', motherName: 'Mother', language: 'en' });
}));

router.post('/invite/:token/respond', publicLimiter, wrap(async (req, res) => {
  const { accept } = z.object({ accept: z.boolean() }).parse(req.body);
  if (mongoose.connection.readyState === 1) {
    const m = await SupportMember.findOne({ token: req.params.token });
    if (!m) throw new HttpError(404, 'This link is not valid');
    m.status = accept ? 'active' : 'declined'; // declining also works as "stop sending me these"
    if (accept) m.acceptedAt = new Date();
    await m.save();
    return res.json({ status: m.status });
  }
  return res.json({ status: accept ? 'active' : 'declined' });
}));

// ---- Mother only
router.use(requireAuth, requireRole('mother'));

const createSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    relation: z.string().trim().max(40).optional(),
    email: z.string().trim().email().optional().or(z.literal('')),
    phone: z.string().trim().max(20).optional(),
    language: z.enum(['en', 'hi']).default('en'),
    consent: z.literal(true, { errorMap: () => ({ message: 'Please confirm you agree to this' }) }),
  })
  .refine((v) => v.email || v.phone, { message: 'Add an email or phone number', path: ['email'] });

const shape = (m) => ({
  id: m._id, name: m.name, relation: m.relation, email: m.email, phone: m.phone, language: m.language, status: m.status,
  inviteLink: m.status === 'invited' ? inviteLink(m.token) : undefined,
});

const standaloneMembersMap = new Map();

router.get('/', wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const [members, nudges] = await Promise.all([
      SupportMember.find({ user: req.user.id }).sort({ createdAt: 1 }),
      SupportNudge.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(10),
    ]);
    return res.json({ members: members.map(shape), nudges: nudges.map((n) => ({ at: n.createdAt, memberName: n.memberName, status: n.status })) });
  }
  const userMembers = standaloneMembersMap.get(String(req.user.id)) || [];
  return res.json({ members: userMembers, nudges: [] });
}));

router.post('/', wrap(async (req, res) => {
  const { consent, ...body } = createSchema.parse(req.body);
  if (mongoose.connection.readyState === 1) {
    if ((await SupportMember.countDocuments({ user: req.user.id })) >= 5) throw new HttpError(400, 'You can add up to 5 people');
    const member = await SupportMember.create({ ...body, email: body.email || undefined, user: req.user.id, token: crypto.randomBytes(24).toString('hex') });
    let emailStatus = 'no_email';
    if (member.email) {
      let motherName = 'Mother';
      try {
        if (typeof req.user.id === 'string' && req.user.id.length === 24) {
          const mother = await User.findById(req.user.id).select('name');
          if (mother?.name) motherName = mother.name;
        }
      } catch (e) {}
      emailStatus = (await sendMail({ to: member.email, ...inviteMail(member, motherName) })).status;
    }
    return res.status(201).json({ member: shape(member), emailStatus });
  }

  // Standalone fallback when DB is disconnected
  const fallbackMember = {
    id: 'mem_' + Date.now(),
    name: body.name,
    relation: body.relation || 'Family member',
    email: body.email || '',
    phone: body.phone || '',
    status: 'invited',
    inviteLink: inviteLink(crypto.randomBytes(24).toString('hex'))
  };
  const list = standaloneMembersMap.get(String(req.user.id)) || [];
  list.push(fallbackMember);
  standaloneMembersMap.set(String(req.user.id), list);

  return res.status(201).json({ member: fallbackMember, emailStatus: 'offline' });
}));

// Removing someone is immediate and permanent: no more nudges, and their link stops working.
router.delete('/:id', wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const r = await SupportMember.deleteOne({ _id: req.params.id, user: req.user.id });
    if (!r.deletedCount) throw new HttpError(404, 'Not found');
  } else {
    const list = standaloneMembersMap.get(String(req.user.id)) || [];
    standaloneMembersMap.set(String(req.user.id), list.filter(m => m.id !== req.params.id));
  }
  res.json({ ok: true });
}));

export default router;
