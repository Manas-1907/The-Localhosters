import webpush from 'web-push';
import { config } from '../config.js';
import { PushSubscription } from '../models/PushSubscription.js';

export const pushEnabled = Boolean(config.vapidPublic && config.vapidPrivate);
if (pushEnabled) webpush.setVapidDetails(config.vapidSubject, config.vapidPublic, config.vapidPrivate);
else console.warn('VAPID keys missing: push reminders are disabled');

// Sends to every device the user subscribed. Returns how many deliveries succeeded.
export async function sendToUser(userId, payload) {
  if (!pushEnabled) return 0;
  const subs = await PushSubscription.find({ user: userId });
  let ok = 0;
  await Promise.all(subs.map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload), { TTL: 3600 });
      ok++;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) await s.deleteOne(); // device unsubscribed
      else console.warn('Push failed:', err.statusCode || err.message);
    }
  }));
  return ok;
}
