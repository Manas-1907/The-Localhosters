import mongoose from 'mongoose';

// A private, expiring, read-only link to a summary. The mother chooses what it contains and can cancel it at any time.
const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    include: { vitals: Boolean, medicines: Boolean, symptoms: Boolean, mood: Boolean, notes: Boolean },
    openedCount: { type: Number, default: 0 },
    lastOpenedAt: Date,
    purgeAt: { type: Date, index: { expires: 0 } }, // record removed 30 days after expiry
  },
  { timestamps: true }
);

export const HandoffLink = mongoose.model('HandoffLink', schema);
