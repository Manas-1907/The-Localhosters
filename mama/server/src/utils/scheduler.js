import cron from 'node-cron';
import { Medicine } from '../models/Medicine.js';
import { DoseLog } from '../models/DoseLog.js';
import { Appointment } from '../models/Appointment.js';
import { User } from '../models/User.js';
import { LogEntry } from '../models/LogEntry.js';
import { PushSubscription } from '../models/PushSubscription.js';
import { sendToUser, pushEnabled } from './push.js';
import { istDate, istToUtc } from './time.js';
import { claim } from './claim.js';

const CATCH_UP_MS = 10 * 60 * 1000; // if the server was asleep, still send a dose reminder up to 10 minutes late
const APPT_CATCH_UP_MS = 30 * 60 * 1000;
const APPT_OFFSETS_MIN = [1440, 120];
const DAILY_LOG_TIME = '20:00'; // evening nudge to log, only if nothing was logged today // a day before and two hours before

const text = {
  en: {
    daily: { title: 'How are you feeling today?', body: 'Take a minute to log. Tap to open.' },
    dose: (m) => ({ title: `Time for ${m.name}`, body: [m.dosage, 'Tap to mark it as taken.'].filter(Boolean).join(' · ') }),
    appt: (a, min) => ({ title: min >= 1440 ? `Appointment tomorrow: ${a.title}` : `Appointment in 2 hours: ${a.title}`, body: [a.doctorName, a.location].filter(Boolean).join(' · ') || 'Open MAMA for details.' }),
  },
  hi: {
    daily: { title: 'आज आप कैसा महसूस कर रही हैं?', body: 'एक मिनट निकालकर लॉग करें। खोलने के लिए दबाएँ।' },
    dose: (m) => ({ title: `${m.name} लेने का समय`, body: [m.dosage, 'लेने के बाद "ले ली" दबाएँ।'].filter(Boolean).join(' · ') }),
    appt: (a, min) => ({ title: min >= 1440 ? `कल अपॉइंटमेंट: ${a.title}` : `2 घंटे में अपॉइंटमेंट: ${a.title}`, body: [a.doctorName, a.location].filter(Boolean).join(' · ') || 'विवरण के लिए MAMA खोलें।' }),
  },
};

const langCache = new Map();
async function langOf(userId) {
  const k = String(userId);
  if (!langCache.has(k)) langCache.set(k, (await User.findById(userId).select('language'))?.language === 'hi' ? 'hi' : 'en');
  return langCache.get(k);
}

export async function tick(now = new Date()) {
  if (!pushEnabled) return;
  langCache.clear();
  const today = istDate(now);

  const meds = await Medicine.find({
    active: true, verified: true, startDate: { $lte: today },
    $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gte: today } }],
  });
  for (const m of meds) {
    for (const time of m.times) {
      const delta = now - istToUtc(today, time);
      if (delta < 0 || delta > CATCH_UP_MS) continue;
      if (await DoseLog.exists({ medicine: m._id, date: today, time })) continue; // already marked
      if (!(await claim(`med:${m._id}:${today}:${time}`))) continue;
      await sendToUser(m.user, { ...text[await langOf(m.user)].dose(m), url: '/medicines', tag: `med-${m._id}-${time}` });
    }
  }

  // Gentle evening nudge to log (helps with postpartum drop-off). Only for people who turned push on and kept this enabled.
  const dailyDelta = now - istToUtc(today, DAILY_LOG_TIME);
  if (dailyDelta >= 0 && dailyDelta <= CATCH_UP_MS) {
    const subscribed = await PushSubscription.distinct('user');
    const users = await User.find({ _id: { $in: subscribed }, role: 'mother', dailyReminder: { $ne: false } }).select('language');
    const dayStart = istToUtc(today, '00:00');
    for (const u of users) {
      if (await LogEntry.exists({ user: u._id, loggedAt: { $gte: dayStart } })) continue;
      if (!(await claim(`daily:${u._id}:${today}`))) continue;
      await sendToUser(u._id, { ...text[u.language === 'hi' ? 'hi' : 'en'].daily, url: '/log', tag: 'daily-log' });
    }
  }

  const appts = await Appointment.find({ done: false, at: { $gt: now, $lte: new Date(now.getTime() + 25 * 3600 * 1000) } });
  for (const a of appts) {
    for (const min of APPT_OFFSETS_MIN) {
      const delta = now - new Date(a.at.getTime() - min * 60000);
      if (delta < 0 || delta > APPT_CATCH_UP_MS) continue;
      if (!(await claim(`appt:${a._id}:${min}`))) continue;
      await sendToUser(a.user, { ...text[await langOf(a.user)].appt(a, min), url: '/appointments', tag: `appt-${a._id}-${min}` });
    }
  }
}

export function startScheduler() {
  cron.schedule('* * * * *', () => tick().catch((e) => console.error('Scheduler error:', e.message)));
  console.log('Reminder scheduler running');
}
