import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  takenAt: { type: Date, default: Date.now },
  answers: [Number], // EPDS item scores, 0-3 each
  total: Number,
  level: { type: String, enum: ['low', 'possible', 'high'] },
  crisis: Boolean, // item 10 (self-harm thoughts) scored above 0
});
schema.index({ user: 1, takenAt: -1 });

export const MoodCheck = mongoose.model('MoodCheck', schema);
