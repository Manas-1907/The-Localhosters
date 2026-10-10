# MAMA - Maternal Assistance & Monitoring Application

Monorepo: `server/` (Node + Express + MongoDB) and `client/` (React + Vite + Tailwind PWA).

## Run it

1. Create a free MongoDB Atlas cluster (M0) and copy its connection string.
2. Server:
   ```
   cd server
   cp .env.example .env     # fill MONGODB_URI, JWT_SECRET, DATA_ENCRYPTION_KEY
   npm install
   npm run dev
   ```
   Generate the encryption key with:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Client (new terminal):
   ```
   cd client
   cp .env.example .env
   npm install
   npm run dev
   ```
4. Open http://localhost:5173, create an account, complete onboarding.

## Demo data
`cd server && npm run seed` creates a demo mother (demo@mama.test / Demo@1234). See DEMO.md for the demo script and AUDIT.md for deck-vs-reality notes.

## API
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/profile`, `PUT /api/profile` (mother role only)
- `POST /api/logs/sync`, `GET /api/logs`
- `GET/POST/PATCH/DELETE /api/medicines`, `POST /api/medicines/:id/doses`
- `GET/POST/PATCH/DELETE /api/appointments`
- `GET /api/push/key`, `POST /api/push/subscribe|unsubscribe|test`
- `POST /api/voice/transcribe` (raw audio body)
- `POST /api/prescriptions/scan` (raw image body)
- `POST /api/mood/epds`, `GET /api/mood/status`
- `POST /api/handoff/preview`, `POST/GET/DELETE /api/handoff`, public: `GET /api/handoff/view/:token`
- `GET/PATCH /api/push/prefs`
- `GET/POST/DELETE /api/circle`, public: `GET /api/circle/invite/:token`, `POST /api/circle/invite/:token/respond`
- `POST /api/contact` (public contact form, rate-limited, spam-trapped)
- `GET /api/health`

Generate push keys with `npx web-push generate-vapid-keys` and put them in `server/.env`. Test reminders with `npm run build && npm run preview` in `client/` (the service worker does not run in `npm run dev`).

Set `GEMINI_API_KEY` in `server/.env` to enable note extraction (logging works without it).

## Deploying
Frontend on Vercel/Netlify (set `VITE_API_URL` to `https://<backend>/api`), backend on Render/Railway
(set `CLIENT_ORIGIN` to the frontend URL). Keep the backend awake before the demo (free tiers sleep).

## Public site, SEO and safety features
Pages (in `client/`): `index.html` (landing with Features, Testimonials and FAQ), `contact.html`, `thank-you.html`, `privacy.html`, `404.html`.

Set your real domain and Google Analytics ID once (updates canonical/OG tags, sitemap, robots.txt, support email):
```
cd client
npm run configure -- --url=https://your-domain.com --ga=G-XXXXXXXXXX
# if the API lives on another domain, also add:  --api=https://api.your-domain.com/api
```
- **Meta / SEO:** every page has a unique `<title>` and meta description; public pages have canonical + Open Graph/Twitter preview (`public/og-image.png`); signed-in pages are `noindex`. `public/robots.txt` and `public/sitemap.xml` are copied to the site root on build.
- **404:** `client/404.html` (Vercel/Netlify serve it automatically; Express serves it for unknown browser URLs).
- **HTTPS:** with `NODE_ENV=production` the server redirects HTTP to HTTPS and sends HSTS + a Content-Security-Policy. `vercel.json` and `public/_headers` add the same headers on static hosts.
- **Spam protection:** hidden honeypot field (contact + sign-up), minimum-fill-time check, link-count check, per-IP rate limits, and optional Cloudflare Turnstile (`turnstileSiteKey` in `client/assets/site.js`, `TURNSTILE_SECRET_KEY` in `server/.env`).
- **Contact messages** are saved in MongoDB (auto-deleted after 12 months) and emailed to `CONTACT_TO_EMAIL` when SMTP is configured.
- **Analytics:** Google Analytics 4 loads only when a real ID is set and the visitor has not enabled Do Not Track.
- Replace the sample testimonials in `index.html` with real ones, and have the Privacy Policy reviewed by a lawyer before launch.
