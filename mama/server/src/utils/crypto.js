import crypto from 'node:crypto';
import { config } from '../config.js';

// AES-256-GCM helpers for sensitive free-text fields (symptoms, mood notes). Used from Phase 2.
const key = () => {
  if (!/^[0-9a-f]{64}$/i.test(config.dataKey)) throw new Error('DATA_ENCRYPTION_KEY must be 64 hex characters');
  return Buffer.from(config.dataKey, 'hex');
};

export function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

export function decrypt(payload) {
  const [iv, tag, enc] = payload.split('.').map((p) => Buffer.from(p, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
