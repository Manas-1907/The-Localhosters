import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    at: { type: Date, required: true },
    doctorName: { type: String, trim: true, maxlength: 80 },
    location: { type: String, trim: true, maxlength: 120 },
    notes: { type: String, trim: true, maxlength: 300 },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Appointment = mongoose.model('Appointment', schema);
