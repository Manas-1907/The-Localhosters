// Builds a realistic demo mother so the demo is never empty. Safe to re-run: it replaces the previous demo data.
// Usage: cd server && npm run seed        (refuses to run when NODE_ENV=production)
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { config } from '../src/config.js';
import { User } from '../src/models/User.js';
import { MotherProfile } from '../src/models/MotherProfile.js';
import { LogEntry } from '../src/models/LogEntry.js';
import { Medicine } from '../src/models/Medicine.js';
import { DoseLog } from '../src/models/DoseLog.js';
import { Appointment } from '../src/models/Appointment.js';
import { MoodCheck } from '../src/models/MoodCheck.js';
import { SupportMember } from '../src/models/SupportMember.js';
import { SupportNudge } from '../src/models/SupportNudge.js';
import { HandoffLink } from '../src/models/HandoffLink.js';
import { PushSubscription } from '../src/models/PushSubscription.js';
import { encrypt } from '../src/utils/crypto.js';
import { eddFromLmp } from '../src/utils/pregnancy.js';
import { evaluate } from '../src/utils/redFlags.js';
import { inviteLink } from '../src/utils/support.js';
import { istDate, istToUtc } from '../src/utils/time.js';

if (process.env.NODE_ENV === 'production') { console.error('Refusing to seed in production.'); process.exit(1); }

const EMAIL = 'demo@mama.test';
const PASSWORD = 'Demo@1234';
const DAY = 24 * 3600 * 1000;
const now = new Date();
const at = (daysAgo, hhmm) => { const t = istToUtc(istDate(new Date(now - daysAgo * DAY)), hhmm); return t > now ? new Date(now - 5 * 60000) : t; };

await mongoose.connect(config.mongoUri);

const old = await User.findOne({ email: EMAIL });
if (old) {
  const models = [LogEntry, Medicine, DoseLog, Appointment, MoodCheck, SupportMember, SupportNudge, HandoffLink, PushSubscription, MotherProfile];
  await Promise.all(models.map((M) => M.deleteMany({ user: old._id })));
  await User.deleteOne({ _id: old._id });
}

const user = await User.create({ name: 'Priya Sharma', email: EMAIL, passwordHash: await bcrypt.hash(PASSWORD, 12), role: 'mother', language: 'en' });
const lmp = new Date(now - 30 * 7 * DAY); // week 30 today
await MotherProfile.create({ user: user._id, stage: 'pregnant', lmp, edd: eddFromLmp(lmp), hospital: 'City Maternity Hospital', doctorName: 'Dr. Meera Rao' });

// 21 days of logs: BP drifting up, mood dropping over the last 5 days, two worrying days at the end.
const notes = {
  12: 'Felt tired today, slept badly.',
  3: 'मन उदास है और नींद नहीं आ रही।',
  0: 'Headache since morning, lights look blurry.',
};
const symptomsByDay = { 12: ['fatigue'], 7: ['swelling'], 2: ['headache_severe', 'swelling'], 0: ['headache_severe', 'vision_changes'] };
for (let i = 20; i >= 0; i--) {
  const t = (20 - i) / 20;
  const wiggle = (k) => Math.round(Math.sin(i * k) * 2);
  const week = 30 - Math.floor(i / 7);
  const vitals = {
    systolic: Math.round(112 + 36 * t * t) + wiggle(1.3),
    diastolic: Math.round(72 + 22 * t * t) + wiggle(2.1),
    weightKg: Math.round((62 + 2.5 * t) * 10) / 10,
    kicks: week >= 28 ? 12 + (i % 3) : undefined,
  };
  if (i % 4 === 0) vitals.tempC = 36.7;
  const mood = i <= 4 ? 2 : i % 2 ? 4 : 3;
  const symptoms = symptomsByDay[i] || [];
  const flags = evaluate({ stage: 'pregnant', week, vitals, symptoms, mood });
  await LogEntry.create({
    user: user._id, clientId: crypto.randomUUID(), loggedAt: at(i, '09:00'), source: i === 3 ? 'voice' : 'text',
    symptoms, mood, vitals, noteEnc: notes[i] ? encrypt(notes[i]) : undefined, flags,
  });
}

const start = istDate(new Date(now - 21 * DAY));
const iron = await Medicine.create({ user: user._id, name: 'Iron + folic acid', dosage: '1 tablet', times: ['08:00'], startDate: start });
const calcium = await Medicine.create({ user: user._id, name: 'Calcium', dosage: '500 mg', times: ['14:00'], startDate: start });
for (let i = 14; i >= 0; i--) {
  const date = istDate(new Date(now - i * DAY));
  for (const [med, time] of [[iron, '08:00'], [calcium, '14:00']]) {
    if (istToUtc(date, time) > now) continue; // not due yet today
    if (med === calcium && i % 5 === 0) continue; // left unmarked
    await DoseLog.create({ user: user._id, medicine: med._id, date, time, status: med === iron && i % 7 === 3 ? 'skipped' : 'taken' });
  }
}

await Appointment.create({ user: user._id, title: 'Antenatal check-up', at: new Date(now - 14 * DAY), doctorName: 'Dr. Meera Rao', location: 'City Maternity Hospital' });
await Appointment.create({ user: user._id, title: 'Antenatal check-up', at: istToUtc(istDate(new Date(now.getTime() + 4 * DAY)), '11:00'), doctorName: 'Dr. Meera Rao', location: 'City Maternity Hospital' });

await MoodCheck.create({ user: user._id, takenAt: new Date(now - 3 * DAY), answers: [1, 1, 2, 1, 1, 2, 1, 1, 1, 0], total: 11, level: 'possible', crisis: false });

const member = await SupportMember.create({
  user: user._id, name: 'Rohan', relation: 'Husband', email: process.env.SEED_SUPPORT_EMAIL || 'support@example.com', phone: '9000000000',
  language: 'en', token: crypto.randomBytes(24).toString('hex'), status: 'active', acceptedAt: now,
});

console.log(`
Demo data ready.
  Sign in:   ${EMAIL}  /  ${PASSWORD}
  Story:     Priya, week 30. BP has crept up to about 148/94, she has had a headache and blurry vision,
             and her mood has been low for 5 days. Iron adherence is high, calcium is patchy.
  Support:   ${member.name} is already an ACTIVE Support Circle member (${member.email}).
             Set SEED_SUPPORT_EMAIL=<your email> before seeding to receive the real check-in email.
  To trigger a check-in live: sign in, open Log, pick any mood, Save. On sync, MAMA emails Rohan once (72 h cooldown).
  Doctor link: open Share with my doctor, tick everything, Preview, then Create link.
  (Rohan's own page, if you want to show it: ${inviteLink(member.token)})
`);
await mongoose.disconnect();
