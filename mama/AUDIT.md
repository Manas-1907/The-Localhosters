# Claims audit: what the deck says vs what is built

Use this to fix the slides (or your talking points) before judging. "Built" means code exists; nothing has been run
in a real browser by the author yet, so test each item once yourself.

| Deck says | Reality | Suggested wording |
|---|---|---|
| Bhashini Speech-to-Text (slides 3, 4) | NOT built. Voice uses Gemini behind a provider switch (`server/src/utils/stt.js`) | "Multilingual speech-to-text (Gemini now, Bhashini-ready adapter)". Only say Bhashini if you add the adapter |
| Google Cloud Vision OCR (slide 3) | NOT built as such. Gemini vision reads and structures the prescription in one step | "Google AI vision OCR (Gemini) with human verification" |
| Voice in regional languages | Depends on Gemini; UI is English + Hindi only; untested in other languages | "Voice input in Indian languages; app UI in English and Hindi" |
| IndexedDB / Dexie offline storage and sync | Built, for LOGS (and queued voice notes). Medicines and appointments need a connection | "Offline logging with automatic sync" |
| Human verification before reminders | Built and enforced on the server: scanned medicines are drafts until confirmed; the scheduler only fires verified medicines | keep |
| LLM structured extraction to JSON | Built for notes, validated with a schema, optional (works without a key) | keep |
| Rule-based red-flag detection, non-diagnostic | Built, runs on device and server, EN/HI. Thresholds are NOT clinician-reviewed | "Rule-based warning signs (clinician-configurable)" |
| Role-based access control | Partly: APIs are role-gated (mother / support / doctor), but support people and doctors use secret links, not accounts | "Role-gated APIs; support person and doctor access through consent-based expiring links" |
| Encrypted data | Free-text notes: AES-256-GCM on the server. Everything else: Atlas encryption at rest + HTTPS in transit. Vitals are not field-encrypted | "Notes encrypted at field level; database encrypted at rest; HTTPS in transit" |
| Consent-first sharing | Built: two-sided consent for the Support Circle, per-category consent and expiry for doctor links, instant removal/cancel | keep |
| Support Circle (SOS nudge) with option to seek professional help | Built. Nudge channel is email only; professional help = Tele-MANAS 14416 call button | keep; do not say SMS or WhatsApp automation |
| One-tap clinical handoff | A few taps: choose what to share, create link, send | "One-link clinical handoff" |
| Zero-friction daily logs and gentle reminders | Symptom chips are one tap; evening reminder added in checkpoint 6 (opt-out, needs push on) | keep |
| Weekly insights, nutrition guidance | Built as static EN/HI content (14 bands). Not personalised beyond week/day. Not clinician-reviewed | "Week-by-week guidance" |
| Appointments | Built, with reminders 1 day and 2 hours before | keep |
| Impact metrics: follow-up completion in 42 days, alert-to-clinician review time, distress flags escalated | NOT instrumented. Available today: how many times/when a doctor link was opened, check-ins sent | Present these as "metrics we will track in a pilot" |
| Healthcare providers: summaries may reduce triage time | Hedged in the deck; no evidence collected | keep the hedge |
| Kaggle postpartum dataset (slide 6) | Not used anywhere in the code | Remove it, or say "not used in the prototype" |
| EPDS (Cox, Holden & Sagovsky 1987) | Built. The Hindi text is an informal translation, not the validated Hindi EPDS | Say "EPDS (Hindi translation pending validation)" |

## Statistics on slide 6 (checked by web search on 8 Oct 2026)
- **MMR 87 per 100,000 (SRS 2022-24)**: supported by a secondary source reporting 88 in 2021-23 and 87 in 2022-24. Confirm against the Registrar General's bulletin itself before presenting.
- **22% postpartum depression (Upadhyay et al. 2017, WHO Bulletin)**: matches the paper as far as the author recalls; not re-checked in this session. Open the paper and confirm the pooled figure.
- **49.8% complete quality postnatal care (Chakrabarty 2026, Int J Qual Health Care)**: NOT FOUND in a search. Locate the paper and check the figure, or replace it with a number you can cite (for example NFHS-5 postnatal check within 2 days of delivery: 78.0% nationally, per a 2025 Indian Journal of Community Health article citing NFHS-5).
- The line "All statistics are traceable to cited peer-reviewed studies" should only stay if every number passes the checks above.

## Things to say out loud if asked
- MAMA never diagnoses. It prompts people to get care, and every warning has a plain-language "what to do" line.
- Nothing is stored that is not needed: photos and voice audio are discarded after reading; notes are encrypted.
- Prototype limits: not clinically validated, not a medical device, Hindi/English review pending.
