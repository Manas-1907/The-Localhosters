import mongoose from 'mongoose';

// Someone the mother chose for her Support Circle. Nudges only go to 'active' members, who must accept themselves.
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    relation: { type: String, trim: true, maxlength: 40 },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true, maxlength: 20 },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    token: { type: String, required: true, unique: true },
    status: { type: String, enum: ['invited', 'active', 'declined'], default: 'invited' },
    acceptedAt: Date,
  },
  { timestamps: true }
);

export const SupportMember = mongoose.model('SupportMember', schema);
