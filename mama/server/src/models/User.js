import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    // mother registers directly; support/doctor accounts are created through invites (later phases)
    role: { type: String, enum: ['mother', 'support', 'doctor'], default: 'mother' },
    language: { type: String, default: 'en' },
    dailyReminder: { type: Boolean, default: true }, // evening nudge to log, only sent if push is on
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
