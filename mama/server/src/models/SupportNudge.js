import mongoose from 'mongoose';

// Transparency record: the mother can see every check-in MAMA sent on her behalf.
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
    memberName: String,
    reason: { type: String, enum: ['persistent_low_mood', 'urgent'] },
    channel: { type: String, default: 'email' },
    status: { type: String, enum: ['sent', 'failed', 'not_configured', 'no_contact'] },
  },
  { timestamps: true }
);

export const SupportNudge = mongoose.model('SupportNudge', schema);
