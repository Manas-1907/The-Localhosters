import { Router } from 'express';
import { z } from 'zod';
import { PushSubscription } from '../models/PushSubscription.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, wrap } from '../middleware/error.js';
import { config } from '../config.js';
import { pushEnabled, sendToUser } from '../utils/push.js';

const router = Router();
router.use(requireAuth);

const subSchema = z.object({ endpoint: z.string().url(), keys: z.object({ p256dh: z.string(), auth: z.string() }) });

router.get('/key', (_req, res) => {
  if (!pushEnabled) throw new HttpError(503, 'Reminders are not configured on the server');
  res.json({ key: config.vapidPublic });
});

router.post('/subscribe', wrap(async (req, res) => {
  const sub = subSchema.parse(req.body);
  await PushSubscription.findOneAndUpdate({ endpoint: sub.endpoint }, { ...sub, user: req.user.id }, { upsert: true, setDefaultsOnInsert: true });
  res.status(201).json({ ok: true });
}));

router.post('/unsubscribe', wrap(async (req, res) => {
  const { endpoint } = z.object({ endpoint: z.string().url() }).parse(req.body);
  await PushSubscription.deleteOne({ endpoint, user: req.user.id });
  res.json({ ok: true });
}));

router.get('/prefs', wrap(async (req, res) => {
  const u = await User.findById(req.user.id).select('dailyReminder');
  res.json({ dailyReminder: u?.dailyReminder !== false });
}));

router.patch('/prefs', wrap(async (req, res) => {
  const { dailyReminder } = z.object({ dailyReminder: z.boolean() }).parse(req.body);
  await User.updateOne({ _id: req.user.id }, { dailyReminder });
  res.json({ dailyReminder });
}));

// Handy for the demo: confirms the whole push pipeline works on this device.
router.post('/test', wrap(async (req, res) => {
  const sent = await sendToUser(req.user.id, { title: 'MAMA', body: 'Reminders are working.', url: '/', tag: 'test' });
  res.json({ sent });
}));

export default router;
