import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    stage: { type: String, enum: ['pregnant', 'postpartum'], required: true },
    // Expected delivery date. Always stored; derived from LMP when the mother gives that instead.
    edd: { type: Date },
    lmp: { type: Date },
    deliveryDate: { type: Date },
    hospital: { type: String, trim: true, maxlength: 120 },
    doctorName: { type: String, trim: true, maxlength: 80 },
  },
  { timestamps: true }
);

export const MotherProfile = mongoose.model('MotherProfile', schema);
