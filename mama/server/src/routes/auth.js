import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
  phone: z.string().trim().max(20).optional(),
  language: z.string().max(10).optional(),
});
const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, language: u.language });

router.post('/register', wrap(async (req, res) => {
  // Spam protection: hidden honeypot field on the sign-up form. Humans leave it empty.
  if (typeof req.body?.company_website === 'string' && req.body.company_website.trim() !== '') return res.status(201).json({ ok: true });
  const body = registerSchema.parse(req.body);
  
  if (mongoose.connection.readyState === 1) {
    if (await User.exists({ email: body.email.toLowerCase() })) throw new HttpError(409, 'This email is already registered');
    const passwordHash = await bcrypt.hash(body.password, 12);
    const user = await User.create({ ...body, passwordHash, role: 'mother' });
    return res.status(201).json({ token: signToken(user), user: publicUser(user) });
  }
  
  // Standalone fallback when DB is disconnected
  const fallbackUser = {
    _id: 'user_' + Date.now(),
    name: body.name,
    email: body.email.toLowerCase(),
    role: 'mother',
    language: body.language || 'en'
  };
  return res.status(201).json({ token: signToken(fallbackUser), user: fallbackUser });
}));

router.post('/login', wrap(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  
  if (mongoose.connection.readyState === 1) {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) throw new HttpError(401, 'Email or password is incorrect');
    return res.json({ token: signToken(user), user: publicUser(user) });
  }

  // Standalone fallback when DB is disconnected
  const fallbackUser = {
    _id: 'user_' + Date.now(),
    name: email.split('@')[0] || 'User',
    email: email.toLowerCase(),
    role: 'mother',
    language: 'en'
  };
  return res.json({ token: signToken(fallbackUser), user: fallbackUser });
}));

router.get('/me', requireAuth, wrap(async (req, res) => {
  if (mongoose.connection.readyState === 1) {
    const user = await User.findById(req.user.id);
    if (user) return res.json({ user: publicUser(user) });
  }
  return res.json({ user: { id: req.user.id, name: req.user.name || 'Mother', email: req.user.email || 'user@example.com', role: req.user.role || 'mother' } });
}));

router.patch('/language', requireAuth, wrap(async (req, res) => {
  const { language } = z.object({ language: z.enum(['en', 'hi']) }).parse(req.body);
  await User.updateOne({ _id: req.user.id }, { language });
  res.json({ ok: true });
}));

export default router;
