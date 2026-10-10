import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { config } from '../config.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { sendMail } from '../utils/mailer.js';
import { HttpError, wrap } from '../middleware/error.js';

const router = Router();

// Spam protection layer 1: rate limits (per IP). Tight burst limit plus a daily cap.
const burstLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, limit: 3, skipFailedRequests: true, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many messages. Please wait a few minutes and try again.' },
});
const dailyLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'You have reached today\'s message limit. Please try again tomorrow.' },
});

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(120),
  topic: z.enum(['question', 'support', 'feedback', 'data', 'other']).default('question'),
  message: z.string().trim().min(10).max(2000),
  company_website: z.string().max(200).optional(),   // honeypot
  elapsedMs: z.number().optional(),                  // time since the form was shown
  turnstileToken: z.string().max(4096).optional(),
});

const countLinks = (s) => (s.match(/https?:\/\/|www\./gi) || []).length;

async function turnstileOk(token, ip) {
  if (!config.turnstileSecret) return true; // not enabled
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: config.turnstileSecret, response: token, remoteip: ip || '' }),
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

router.post('/', burstLimiter, dailyLimiter, wrap(async (req, res) => {
  const body = schema.parse(req.body);

  // Layer 2: honeypot + time-trap. Bots get a normal-looking success so they don't learn what tripped them.
  const looksLikeBot =
    (body.company_website && body.company_website.trim() !== '') ||
    (typeof body.elapsedMs === 'number' && body.elapsedMs < 3000);
  if (looksLikeBot) return res.status(201).json({ ok: true });

  // Layer 3: content checks
  if (countLinks(body.message) > 2) throw new HttpError(400, 'Please remove some links from your message and try again.');

  // Layer 4 (optional): Cloudflare Turnstile
  if (!(await turnstileOk(body.turnstileToken, req.ip))) throw new HttpError(400, 'Spam check failed. Please try again.');

  const doc = await ContactMessage.create({
    name: body.name, email: body.email.toLowerCase(), topic: body.topic, message: body.message,
    ip: req.ip, userAgent: (req.get('user-agent') || '').slice(0, 300),
  });

  if (config.contactTo) {
    const mail = await sendMail({
      to: config.contactTo,
      subject: `[MAMA contact] ${body.topic}: ${body.name}`,
      text: `From: ${body.name} <${body.email}>\nTopic: ${body.topic}\n\n${body.message}`,
    });
    await ContactMessage.updateOne({ _id: doc._id }, { emailStatus: mail.status });
  }

  res.status(201).json({ ok: true });
}));

export default router;
