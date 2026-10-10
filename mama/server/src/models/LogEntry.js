import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.Mixed, required: true },
    clientId: { type: String, required: true }, // generated on the device so offline sync is idempotent
    loggedAt: { type: Date, required: true },
    source: { type: String, enum: ['text', 'voice'], default: 'text' },
    symptoms: [String],
    mood: Number,
    vitals: { systolic: Number, diastolic: Number, weightKg: Number, tempC: Number, kicks: Number },
    noteEnc: String, // AES-256-GCM encrypted free text
    extracted: { symptoms: [String], mood: Number, severity: String, medications: [String], summary: String },
    flags: [{ _id: false, code: String, level: String }],
  },
  { timestamps: true }
);
schema.index({ user: 1, clientId: 1 }, { unique: true });
schema.index({ user: 1, loggedAt: -1 });

export const LogEntry = mongoose.model('LogEntry', schema);
