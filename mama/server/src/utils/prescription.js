// Turns the AI's reading of a dosing schedule into default clock times the mother can still edit.
export function defaultTimes({ schedule, timesPerDay }) {
  if (schedule && (schedule.morning || schedule.afternoon || schedule.night)) {
    const t = [];
    if (schedule.morning) t.push('08:00');
    if (schedule.afternoon) t.push('14:00');
    if (schedule.night) t.push('21:00');
    return t;
  }
  const byCount = { 1: ['08:00'], 2: ['08:00', '20:00'], 3: ['08:00', '14:00', '21:00'], 4: ['06:00', '12:00', '18:00', '22:00'] };
  return byCount[Math.min(Math.max(timesPerDay || 1, 1), 4)];
}
