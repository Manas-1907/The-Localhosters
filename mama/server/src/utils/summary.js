import { DoseLog } from '../models/DoseLog.js';
import { LogEntry } from '../models/LogEntry.js';
import { Medicine } from '../models/Medicine.js';
import { MoodCheck } from '../models/MoodCheck.js';
import { MotherProfile } from '../models/MotherProfile.js';
import { User } from '../models/User.js';
import { decrypt } from './crypto.js';
import { computeProgress } from './pregnancy.js';
import { istDate, istToUtc } from './time.js';

const DAY = 24 * 3600 * 1000;

// Pure function (easy to test): how regularly were doses marked in the last `days` days?
// Doses not yet due today are ignored. "Not recorded" means the mother did not mark taken or skipped.
export function computeAdherence(meds, doseStatus, days, now = new Date()) {
  const today = istDate(now);
  const dates = Array.from({ length: days }, (_, i) => istDate(new Date(now.getTime() - (days - 1 - i) * DAY)));
  let totalExpected = 0, totalTaken = 0;
  const perMedicine = meds.map((m) => {
    let expected = 0, taken = 0, skipped = 0;
    for (const d of dates) {
      if (d < m.startDate || (m.endDate && d > m.endDate)) continue;
      for (const t of m.times) {
        if (d === today && istToUtc(today, t) > now) continue;
        expected++;
        const st = doseStatus.get(`${m._id}:${d}:${t}`);
        if (st === 'taken') taken++;
        else if (st === 'skipped') skipped++;
      }
    }
    totalExpected += expected; totalTaken += taken;
    return { name: m.name, dosage: m.dosage || '', times: m.times, startDate: m.startDate, endDate: m.endDate || null, expected, taken, skipped, notRecorded: expected - taken - skipped };
  });
  return { days, perMedicine, overallPercent: totalExpected ? Math.round((totalTaken / totalExpected) * 100) : null };
}

export async function buildSummary(userId, include, { days = 30, now = new Date() } = {}) {
  const since = new Date(now.getTime() - days * DAY);
  const [user, profile, logs] = await Promise.all([
    User.findById(userId).select('name'),
    MotherProfile.findOne({ user: userId }),
    LogEntry.find({ user: userId, loggedAt: { $gte: since } }).sort({ loggedAt: 1 }).lean(),
  ]);
  const progress = computeProgress(profile, now);

  const out = {
    generatedAt: now, periodDays: days, include,
    patient: { name: user?.name || '' },
    status: profile ? { ...progress, hospital: profile.hospital || null, doctorName: profile.doctorName || null, edd: profile.edd || null, deliveryDate: profile.deliveryDate || null } : null,
  };

  if (include.vitals) {
    const rows = logs.filter((l) => l.vitals && Object.values(l.vitals).some((v) => v != null))
      .map((l) => ({ at: l.loggedAt, systolic: l.vitals.systolic ?? null, diastolic: l.vitals.diastolic ?? null, weightKg: l.vitals.weightKg ?? null, tempC: l.vitals.tempC ?? null, kicks: l.vitals.kicks ?? null }));
    out.vitals = { rows, highBpReadings: rows.filter((r) => r.systolic >= 140 || r.diastolic >= 90).length };
  }

  if (include.symptoms) {
    const counts = new Map();
    for (const l of logs) for (const s of l.symptoms || []) {
      const c = counts.get(s) || { code: s, count: 0, last: null };
      c.count++; c.last = l.loggedAt; counts.set(s, c);
    }
    out.symptoms = {
      counts: [...counts.values()].sort((a, b) => b.count - a.count),
      alerts: logs.filter((l) => l.flags?.some((f) => f.level !== 'watch')).map((l) => ({ at: l.loggedAt, flags: l.flags.filter((f) => f.level !== 'watch').map((f) => ({ code: f.code, level: f.level })) })),
    };
  }

  if (include.medicines) {
    const adhDays = 14;
    const adhSince = new Date(now.getTime() - adhDays * DAY);
    const meds = await Medicine.find({ user: userId, active: true, verified: true });
    const doses = await DoseLog.find({ user: userId, date: { $gte: istDate(adhSince) } });
    out.medicines = computeAdherence(meds, new Map(doses.map((d) => [`${d.medicine}:${d.date}:${d.time}`, d.status])), adhDays, now);
  }

  if (include.mood) {
    const byDay = new Map();
    for (const l of logs) if (l.mood != null) {
      const d = istDate(l.loggedAt);
      byDay.set(d, [...(byDay.get(d) || []), l.mood]);
    }
    const daily = [...byDay].map(([date, v]) => ({ date, average: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 }));
    const epds = await MoodCheck.find({ user: userId, takenAt: { $gte: new Date(now.getTime() - 90 * DAY) } }).sort({ takenAt: -1 }).limit(5);
    out.mood = {
      daily, lowDays: daily.filter((d) => d.average <= 2).length,
      epds: epds.map((e) => ({ at: e.takenAt, total: e.total, level: e.level })),
      selfHarmItemPositive: epds[0] ? Boolean(epds[0].crisis) : null, // only from the most recent check
    };
  }

  if (include.notes) {
    out.notes = logs.filter((l) => l.noteEnc).slice(-30).map((l) => { try { return { at: l.loggedAt, text: decrypt(l.noteEnc) }; } catch { return null; } }).filter(Boolean);
  }

  return out;
}
