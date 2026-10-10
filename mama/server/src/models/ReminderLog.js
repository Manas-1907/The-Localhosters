import mongoose from 'mongoose';

// One row per reminder already sent. The unique key stops duplicates; rows expire after 8 days.
const schema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: 8 * 24 * 3600 },
});

export const ReminderLog = mongoose.model('ReminderLog', schema);
