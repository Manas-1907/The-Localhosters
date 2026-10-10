import 'dotenv/config';

const need = (key) => {
  if (!process.env[key]) throw new Error(`Missing required env var: ${key}`);
  return process.env[key];
};

export const config = {
  port: Number(process.env.PORT) || 4000,
  mongoUri: need('MONGODB_URI'),
  jwtSecret: need('JWT_SECRET'),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4000,http://127.0.0.1:4000',
  dataKey: need('DATA_ENCRYPTION_KEY'),
  geminiKey: process.env.GEMINI_API_KEY || '',
  sttProvider: process.env.STT_PROVIDER || 'gemini', // 'gemini' now; add a 'bhashini' adapter in utils/stt.js if access arrives
  vapidPublic: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivate: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
  appUrl: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0],
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'MAMA <no-reply@example.com>',
  },
  isProd: process.env.NODE_ENV === 'production',
  forceHttps: process.env.FORCE_HTTPS ? process.env.FORCE_HTTPS === 'true' : process.env.NODE_ENV === 'production',
  contactTo: process.env.CONTACT_TO_EMAIL || '',
  turnstileSecret: process.env.TURNSTILE_SECRET_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
};

if (!/^[0-9a-f]{64}$/i.test(config.dataKey)) {
  throw new Error('DATA_ENCRYPTION_KEY must be 64 hex characters. Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}
