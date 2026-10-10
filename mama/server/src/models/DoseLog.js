import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.Mixed, required: true },
    medicine: { type: mongoose.Schema.Types.Mixed, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, enum: ['taken', 'skipped'], required: true },
  },
  { timestamps: true }
);
schema.index({ medicine: 1, date: 1, time: 1 }, { unique: true });
schema.index({ user: 1, date: 1 });

export const DoseLog = mongoose.model('DoseLog', schema);
