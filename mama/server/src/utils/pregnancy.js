const DAY = 24 * 60 * 60 * 1000;

export const addDays = (date, n) => new Date(new Date(date).getTime() + n * DAY);
export const daysBetween = (a, b) => Math.floor((new Date(b).getTime() - new Date(a).getTime()) / DAY);

// Standard Naegele estimate: due date is 280 days after the last menstrual period.
export const eddFromLmp = (lmp) => addDays(lmp, 280);

export function computeProgress(profile, now = new Date()) {
  if (!profile) return null;

  if (profile.stage === 'postpartum' && profile.deliveryDate) {
    const day = Math.max(1, daysBetween(profile.deliveryDate, now) + 1);
    return { stage: 'postpartum', postpartumDay: day, postpartumDaysLeft: Math.max(0, 42 - day), totalDays: 42 };
  }

  const edd = profile.edd;
  if (!edd) return { stage: 'pregnant', gestationalWeek: null };
  const lmp = addDays(edd, -280);
  const week = Math.min(42, Math.max(0, Math.floor(daysBetween(lmp, now) / 7)));
  const trimester = week < 14 ? 1 : week < 28 ? 2 : 3;
  return { stage: 'pregnant', gestationalWeek: week, trimester, daysToDue: daysBetween(now, edd), totalWeeks: 40 };
}
