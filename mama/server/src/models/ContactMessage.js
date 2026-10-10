import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, required: true, maxlength: 120 },
    topic: { type: String, enum: ['question', 'support', 'feedback', 'data', 'other'], default: 'question' },
    message: { type: String, required: true, maxlength: 2000 },
    ip: String,
    userAgent: { type: String, maxlength: 300 },
    emailStatus: String,
    createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 60 * 60 * 24 * 365 } }, // auto-delete after 12 months (see Privacy Policy)
  },
  { versionKey: false }
);

export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
