# Demo and deployment guide

## Deploy (do this the day before)
**Database:** MongoDB Atlas M0. Network Access: allow 0.0.0.0/0 for the demo (Render IPs change).
**Backend (Render, or Railway):** root directory `server`, build `npm install`, start `npm start`. Environment variables:
`MONGODB_URI, JWT_SECRET, DATA_ENCRYPTION_KEY (64 hex), CLIENT_ORIGIN (your frontend URL, no trailing slash), GEMINI_API_KEY,
VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM`.
Keep it awake: create a free UptimeRobot monitor on `https://<backend>/api/health` every 5 minutes (reminders need a running server).
**Frontend (Vercel or Netlify):** root `client`, build `npm run build`, output `dist`, variable `VITE_API_URL=https://<backend>/api`.
`vercel.json` and `public/_redirects` are included so links like `/handoff/...` and `/join/...` work.
**Seed:** from your laptop with the production `.env`: `cd server && SEED_SUPPORT_EMAIL=<an inbox you can open on stage> npm run seed`
(the script refuses to run if `NODE_ENV=production`, so run it locally against the same database).

## Test everything once, on the phone you will demo with (T-24h)
1. Open the site, sign in as demo@mama.test / Demo@1234. Add to Home Screen (iPhone needs this for push).
2. Home: week 30, support prompt, recent alert, weekly card.
3. Log: pick mood + a symptom, enter BP 150/95, Save. Warnings appear. Check History shows it as synced.
4. Voice: record a sentence in Hindi, check the text appears. (If it fails: GEMINI_API_KEY / model name.)
5. Airplane mode: save a log (warning still appears, "Waiting to sync"), switch back on, it syncs.
6. Medicines: Scan a printed prescription, edit, confirm. Mark a dose taken.
7. Home: Turn on reminders, Send a test. A notification must arrive.
8. Mood check: answer, see the result. (Answer "Sometimes" or worse on the last question to see the crisis card.)
9. Support Circle: nudge history; Share with my doctor: Preview, Create link, open it on a second device, Print.
10. Language toggle to Hindi on every screen you will show.

## 6-minute story (Priya, week 30)
1. **Problem (30 s):** discharge ends the monitoring; 42-day postpartum period is the gap; language and form barriers.
2. **Home (30 s):** week 30 progress, weekly guidance, an alert from her last log.
3. **Log by voice in Hindi (60 s):** speak, text appears, she edits and saves. Red flags fire (BP + headache + blurry vision). Say: "assist, don't diagnose".
4. **Offline (30 s):** airplane mode, log still saves and warns, reconnect, it syncs.
5. **Prescription scan (60 s):** photo, drafts, she checks each medicine, confirm, reminders exist only now. Send the test push.
6. **Mood + Support Circle (75 s):** EPDS, consent model, show Rohan's page and the nudge history. If SMTP works, save a log and show the email arriving. Mention Tele-MANAS on the crisis screen.
7. **Doctor link (60 s):** Preview what the doctor sees, create link, open on a second device: BP chart, adherence, alerts, print to PDF. Cancel the link.
8. **Close (15 s):** closed loop: every log leads to a reminder, a nudge or a handoff.

## If something breaks on stage
| Problem | Do this |
|---|---|
| No internet | Offline logging still works; show the saved warning. Skip scan, voice and sharing, narrate them with screenshots |
| Voice fails | Type the note instead; say transcription is a swappable service (Gemini now, Bhashini-ready) |
| Scan fails | Use "Add" on Medicines to enter one by hand; show a screenshot of the review screen |
| Push does not arrive | Open Medicines and show the schedule; show the test button result text |
| Email nudge not sent | Open the Circle page: it lists the check-in as "Not delivered"; show Rohan's invite link page instead |
| Server asleep | Open `/api/health` first thing (30 s cold start) |
| Data looks wrong | Re-run the seed (30 s), refresh |

## Questions to prepare for
- **Is it safe?** It never diagnoses; warnings are fixed rules with a "contact your doctor / go to hospital" instruction; thresholds and wording need clinician sign-off before real use.
- **What if OCR misreads a drug?** Nothing is scheduled until the mother confirms each medicine; low-confidence items are flagged.
- **Privacy?** Consent for every share, expiring links, notes encrypted, audio and photos not stored, support person sees no health data.
- **Why not Bhashini?** Access timing; the speech service is behind a switch so Bhashini is a small adapter.
- **How would you validate it?** Pilot with a hospital and ASHA workers; measure 42-day follow-up completion and alert-to-review time.
