import { ReminderLog } from '../models/ReminderLog.js';

// Returns true only for the first caller with this key, so an action (reminder, nudge) happens once.
export async function claim(key) {
  try { await ReminderLog.create({ key }); return true; } catch (e) { if (e.code === 11000) return false; throw e; }
}
