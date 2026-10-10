# MAMA build progress

## Done: Checkpoint 1 (Phases 0-1)
- Server: Express app, config, security middleware (helmet, CORS, rate limit on auth), zod validation, error handler
- Auth: register/login/me with bcrypt + JWT (2-day access token), roles: mother | support | doctor
- Models: User, MotherProfile; pregnancy maths (week, trimester, days to due, postpartum day of 42)
- AES-256-GCM helper (`server/src/utils/crypto.js`) ready for sensitive log fields
- Client: PWA shell (vite-plugin-pwa, icons, manifest), i18n English + Hindi with a language toggle,
  login/register, onboarding (due date, last period, or delivery date), home with week/day tick progress,
  offline-safe session restore

## Done: Checkpoint 2 (Phases 2-3)
- Server: LogEntry model (note encrypted), `POST /api/logs/sync` (idempotent batch), `GET /api/logs`,
  Gemini note extraction (`utils/gemini.js`, optional; skips quietly without a key), rule-based red-flag engine
- Client: log screen (mood, symptom chips, BP/weight/temp/kicks, free note), Dexie offline outbox + sync on
  sign-in/reconnect/tab focus, history screen, bottom nav, warning banners on Home, EN/HI strings for all flags
- Red-flag rules run on the device AND server. Single source: edit `server/src/utils/redFlags.js`, then
  `cp server/src/utils/redFlags.js client/src/lib/redFlags.js`
- Logout clears local logs

## Done: Checkpoint 3 (Phases 4-5)
- Voice: record in the browser (MediaRecorder, 60 s max) -> `POST /api/voice/transcribe` -> Gemini -> text appears in the note
  box so the mother can check/edit it. Audio is never stored. Recorded offline? The audio waits on the device and is
  converted at the next sync. STT sits behind `server/src/utils/stt.js` (add a Bhashini case there if access arrives)
- Medicines: add/edit/remove with up to 6 daily times, Taken/Skip buttons, dose log (`DoseLog`, ready for the doctor summary)
- Appointments: add/remove, past/upcoming
- Push reminders: custom service worker (`client/src/sw.js`), web-push + VAPID, per-minute scheduler
  (`server/src/utils/scheduler.js`): dose reminders (skipped if already marked), appointment reminders 1 day and 2 hours before.
  Duplicate-proof via `ReminderLog`; catches up if the server slept up to 10 minutes. "Send a test" button on Home.
- Reminder text follows the language toggle (saved to the user)
- Medicines and appointments need a connection (only logs are offline-first); reminders are pushed by the server

## Setup added in checkpoint 3
- `cd server && npm install` again (new packages: web-push, node-cron); `cd client && npm install` again
- Generate VAPID keys: `npx web-push generate-vapid-keys` -> put in `server/.env`
- Reminders need the server to be AWAKE. On free hosting, ping `/api/health` every 5 minutes (UptimeRobot) or use a paid always-on plan
- Service worker only runs in a production build: test reminders with `npm run build && npm run preview` (HTTPS or localhost)
- iPhone: install to Home Screen first, otherwise push is unavailable

## Done: Checkpoint 4 (Phases 6-7)
- Prescription scan (`/scan`, button on Medicines): photo is shrunk on the phone, sent to `POST /api/prescriptions/scan`, Gemini vision
  returns DRAFT medicines (name, dose, times from patterns like 1-0-1/BD/TDS, duration, food instructions, confidence) + optional follow-up date.
  Nothing is stored. The mother edits and confirms each one; only then is it created (`source: 'ocr'`), so no reminder exists before confirmation
- Mood check (`/mood`): the 10-item EPDS, one question per screen, EN/HI. Server scores it (`level`: low <10, possible 10-12, high 13+)
- Crisis path: EPDS item 10 above 0, or a note that mentions self-harm, shows `CrisisCard` (Tele-MANAS 14416, 112, optional call to a support person)
- Support Circle (`/circle`): add up to 5 people with explicit consent; invite by email (if SMTP set) or by copy/WhatsApp link; the invited person
  opens `/join/:token` (no account) and must accept; they can stop any time from the same link; the mother can remove anyone instantly
- Nudge rule (`utils/support.js`): low mood (<=2) on 3+ different days in 7 days, or a recent EPDS >= 10 -> neutral email to ACTIVE members only
  (no health details), once per 72 h; self-harm signals use a separate 12 h window. The mother gets a push saying who was contacted, and sees the
  full history on the Circle page. Home shows a support prompt with Tele-MANAS during these periods

## Setup added in checkpoint 4
- `cd server && npm install` again (nodemailer)
- Email is optional: set SMTP_* in `server/.env` (Gmail + app password works). Without it, invites are shared via the copy/WhatsApp link,
  but automatic nudge emails are NOT sent (the Circle page will show them as "Not delivered"). For the demo, set up SMTP.
- Demo tip: to trigger a nudge fast, take the mood check and pick the most negative answers (needs an accepted Support Circle member)

## Done: Checkpoint 5 (Phases 8-9)
- Doctor handoff (`/share`): the mother ticks what to include (vitals, medicines + adherence, symptoms + alerts, mood incl. the EPDS self-harm
  answer, her own notes; mood and notes are OFF by default), picks 1/3/7 days, can PREVIEW exactly what the doctor will see, then creates a link
- Doctor page (`/handoff/:token`): public, read-only, English only, no account; warning alerts, BP chart with 140/90 lines + table, symptom counts,
  14-day adherence per medicine ("not marked" is shown separately from "skipped"), mood, notes. "Print or save as PDF" uses the browser's print dialog
- Link safety: 192-bit random token, expires, can be cancelled, rate-limited, `Cache-Control: no-store`, noindex; the mother sees how many times and
  when it was opened. Data is live until expiry (not a snapshot). Records purge 30 days after expiry
- Weekly insights (`client/src/insights.js`): 9 pregnancy bands + 5 postpartum bands (baby, you, food, good to know) + a "get help if" line, EN/HI,
  shown on Home. Static content, so it works offline
- Adherence maths is tested (`computeAdherence` in `server/src/utils/summary.js`)

## Done: Checkpoint 6 (Phase 10)
- Static checks run on ALL code: 39 client files parse as valid JSX with no undefined names; server has no undefined names; the checker was
  verified to catch a deliberately broken file. This is NOT a substitute for running the app
- Review fixes: server refuses to start without a valid DATA_ENCRYPTION_KEY (clear error instead of failing mid-sync); logs are returned as plain
  objects; summary query uses lean(); Home recent-alert query no longer depends on `reverse().sortBy()` behaviour; html lang set at startup
- Evening log reminder (20:00 IST, only if push is on and nothing logged today, with an opt-out checkbox) - matches slide 4 "gentle reminders"
- Seed script (`cd server && npm run seed`): demo mother "Priya", week 30, 21 days of logs with rising BP and low mood, medicines + dose history,
  appointments, a mood check, an ACTIVE Support Circle member. Login: demo@mama.test / Demo@1234
- `AUDIT.md` (deck claims vs reality + statistics check), `DEMO.md` (deploy steps, pre-demo test list, 6-minute story, backup plans, Q&A)
- `client/vercel.json` and `client/public/_redirects` so deep links (/handoff/..., /join/...) work when deployed

## Still not done / honest limits
- The app has never been run end to end by the author. First launch: follow README, send any error text
- Medicines/appointments/circle/share need a connection (only logs are offline-first)
- Bhashini not integrated; Gemini model name may need changing (GEMINI_MODEL)
- No automated tests beyond the pure functions checked by hand (pregnancy maths, red flags, adherence)
- Clinician review of red-flag thresholds, EPDS cut-offs, insights text, and Hindi wording is still required

## Must review before real use
- All insights text (EN + HI) is general guidance I wrote; have a clinician and a Hindi speaker review it (`client/src/insights.js`)
- Handoff links are bearer links: anyone holding one can read it until it expires. For real use add a PIN or doctor login
- EPDS Hindi text is an informal translation, NOT the validated Hindi EPDS. Swap in the validated version (`client/src/epds.js`)
- EPDS cut-offs (10 / 13) and the low-mood rule are screening defaults that a clinician should confirm
- Invite tokens are stored as plain random strings (fine for a demo; hash them later)

## Needs a clinician's eye
Thresholds in `redFlags.js` and all Hindi/English medical wording are screening prompts, not reviewed clinical
content. Have a doctor or nurse review before the demo, or present them as "configurable rules".

## Not tested yet
Nothing has been run against a live database or browser (no network in the build environment).
First job: follow README, report any error text, fix before continuing.

## Next
All planned checkpoints are built. Remaining work = your first real run: install, launch, send errors, fix, then follow DEMO.md

## Later
- (Phases 4-5 now listed under Next; voice uses a provider interface so Bhashini can be added)
- Phase 10 extras if time: refresh tokens / httpOnly cookies, audit log

## Known shortcuts
- JWT is kept in localStorage (fine for a hackathon, move to httpOnly cookies after)
- Support/doctor accounts are not creatable yet (invite flow comes in Phase 7/8)
