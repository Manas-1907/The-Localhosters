// MAMA targets India, which has one timezone and no daylight saving, so a fixed +05:30 offset is exact.
const IST_MS = 330 * 60 * 1000;

export const istDate = (d = new Date()) => new Date(d.getTime() + IST_MS).toISOString().slice(0, 10); // YYYY-MM-DD
export const istToUtc = (ymd, hhmm) => new Date(`${ymd}T${hhmm}:00+05:30`);
