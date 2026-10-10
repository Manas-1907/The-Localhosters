import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import logRoutes from './routes/logs.js';
import medicineRoutes from './routes/medicines.js';
import appointmentRoutes from './routes/appointments.js';
import pushRoutes from './routes/push.js';
import voiceRoutes from './routes/voice.js';
import prescriptionRoutes from './routes/prescriptions.js';
import moodRoutes from './routes/mood.js';
import circleRoutes from './routes/circle.js';
import handoffRoutes from './routes/handoff.js';
import contactRoutes from './routes/contact.js';
import translateRoutes from './routes/translate.js';
import { errorHandler, notFound } from './middleware/error.js';

export const app = express();

app.set('trust proxy', 1);

// HTTPS: in production, send plain-HTTP requests to HTTPS (works behind Render/Railway/Heroku-style proxies).
if (config.forceHttps) {
  app.use((req, res, next) => {
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
    if (req.path === '/api/health') return next(); // keep platform health checks working
    res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

// Security headers. The CSP lists every outside host the pages use (Tailwind CDN, Google Fonts, Google Analytics, Turnstile).
app.use(
  helmet({
    hsts: { maxAge: 31536000, includeSubDomains: true },
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://www.googletagmanager.com', 'https://challenges.cloudflare.com'],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https://lh3.googleusercontent.com', 'https://www.google-analytics.com', 'https://www.googletagmanager.com'],
        mediaSrc: ["'self'", 'blob:', 'data:'],
        connectSrc: ["'self'", 'https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://www.googletagmanager.com'],
        frameSrc: ['https://challenges.cloudflare.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: config.forceHttps ? [] : null,
      },
    },
  })
);
app.use(cors({ origin: config.clientOrigin.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false });
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/circle', circleRoutes);
app.use('/api/handoff', handoffRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/translate', translateRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, '../../client');
app.use(express.static(clientDir));
// robots.txt, sitemap.xml, favicons and the social preview image live in client/public
app.use(express.static(path.join(clientDir, 'public')));

// Friendly 404 page for browser requests (API and non-HTML requests still get JSON 404s below)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/') || !req.accepts(['html', 'json', 'text']) || req.accepts(['html', 'json']) !== 'html') return next();
  res.status(404).sendFile(path.join(clientDir, '404.html'));
});

app.use(notFound);
app.use(errorHandler);
