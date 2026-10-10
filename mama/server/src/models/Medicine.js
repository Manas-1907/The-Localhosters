import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    dosage: { type: String, trim: true, maxlength: 80 },
    times: [String], // 'HH:MM' in India time
    startDate: { type: String, required: true }, // 'YYYY-MM-DD'
    endDate: { type: String },
    notes: { type: String, trim: true, maxlength: 300 },
    active: { type: Boolean, default: true },
    source: { type: String, enum: ['manual', 'ocr'], default: 'manual' },
    verified: { type: Boolean, default: true }, // OCR results stay false until the mother confirms them
  },
  { timestamps: true }
);

export const Medicine = mongoose.model('Medicine', schema);
