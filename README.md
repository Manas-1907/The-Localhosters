🌿 MAMA — Maternal Assistance & Monitoring Application
> "Assist, don't diagnose."
> An end-to-end digital companion providing supportive, continuous care from early pregnancy through delivery and the critical 42-day postpartum period.


📌 Problem Statement
Pregnancy and the postpartum recovery phase involve frequent clinical check-ins, evolving medication regimens, critical vital tracking, and significant shifts in physical and emotional wellbeing.
In many healthcare settings—especially across underserved communities—monitoring drops off steeply after hospital discharge. Critical records remain scattered across physical slips, language and digital literacy barriers impede timely logging, and early warning signs of complications or postpartum distress often go unnoticed until an emergency arises.
💡 Our Solution
MAMA bridges the post-discharge care gap by providing an accessible, continuous, and non-diagnostic tracking platform. Designed with low-bandwidth, voice-first, and multilingual capabilities, MAMA enables mothers and families to log symptoms, digitize paper prescriptions, track medication adherence, and generate structured clinical handoffs for healthcare professionals


✨ Key Features & Core Modules

🏠 1. Home Dashboard


 * Milestone Tracking: Gestational week counter and postpartum day-by-day recovery milestones.
 * Daily Wellbeing Logging: Frictionless, one-tap check-ins for hydration, sleep, mood, pain, and symptoms.
 * Quick Actions: Instant access to upcoming doctor appointments and daily medication checklists.

   
🩺 2. My Health & Vitals
 * Symptom Logging: Structured entries for pain, bleeding, mood shifts, and vitals.
 * Dual-Layer Records: Clear delineation between user-reported wellness logs and verified clinical observations.
 * Non-Diagnostic Red-Flag Detection: Rule-based detection that highlights warning signs and suggests seeking timely medical care without issuing automated diagnoses.

  
💊 3. Prescription OCR & Medicines
 * Prescription Digitisation: Powered by Optical Character Recognition (OCR) to parse medicine names, dosages, and frequencies from physical prescription slips.
 * Human-in-the-Loop Verification: Extracted prescription details require mandatory user confirmation before reminders are scheduled.
 * Adherence Engine: Real-time tracking of pending, taken, and skipped doses with adherence summaries.

   
📅 4. Appointments & Care Continuity
 * Visit Management: Centralized tracking of antenatal visits and postnatal follow-ups.
 * Consultation Prep: Space to record personal questions, concerns, and symptom notes prior to clinic appointments.

  
📋 5. Doctor Brief (Clinical Handoff)
 * One-Tap Summary: Compiles recent vitals, symptom severity trends, and medication adherence into a clean, structured summary.
 * Print & Export Ready: Reduces clinical triage time during doctor consultations by replacing scattered paper slips with a cohesive health thread.

  
🤝 6. Support Circle & Gentle SOS Nudge
 * Consent-Driven Sharing: Opt-in sharing permissions for partners, family members, or designated caregivers.
 * Gentle Check-In Nudge: If persistent low mood or acute distress is logged over consecutive days, the app triggers a gentle notification to a trusted support person alongside hotlines for professional mental health support.

  
📊 7. Insights
 * Trend Analysis: Visual summaries of sleep, hydration, and adherence patterns over weekly and monthly intervals.
 * Recovery Milestones: Contextual insights guiding mothers through physical healing during the 42-day postpartum window.

  



### 🏗️ Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────┐
│                   MAMA Frontend (PWA)                  │
│       Vite • React / Modern DOM • Tailwind CSS         │
│     IndexedDB / Local Caching (Offline-First Sync)     │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────▼────────────────────────────┐
│                    Backend Services                    │
│             Node.js • Express • JWT Auth               │
└──────┬────────────────────┬────────────────────┬───────┘
       │                    │                    │
┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼───────┐
│  Database   │      │ Indic Speech│      │  Vision OCR  │
│  MongoDB /  │      │  Bhashini   │      │ Google Cloud │
│ Cloud Store │      │   STT API   │      │  Vision API  │
└─────────────┘      └─────────────┘      └──────────────┘
```

| Domain | Technology / Tool | Purpose |
|---|---|---|
| Frontend | HTML5 / JavaScript / React, Tailwind CSS | Responsive, accessible, and lightweight client interface |
| Build & Tooling | Vite | Fast module bundling and local development server |
| Styling & Assets | Tailwind CSS, Lucide Icons | Accessible, high-contrast, nature-inspired visual design |
| Backend | Node.js, Express.js | Secure RESTful API endpoints and business logic |
| Authentication | JWT (JSON Web Tokens) | Secure user access and session management |
| Storage & Sync | IndexedDB / LocalStorage, MongoDB | Offline-first client logging with cloud database sync |
| AI / Machine Learning | Google Cloud Vision API, Bhashini STT | Prescription OCR extraction and Indic voice-to-text processing |
🎨 Design Philosophy & Color Palette
MAMA's interface is built on a calming, nature-inspired palette engineered to reduce visual stress, maintain WCAG AA accessibility, and present healthcare data clearly:
 * Forest Green (#164E41) — Primary brand identity, stability, and structure.
 * Warm Ivory (#FAF9F5) — Soft, non-glare background surface.
 * Mint (#B8E9DC) — Interactive highlights, badges, and progress indicators.
 * Soft Sage (#E7F2EB) — Card backgrounds, secondary containers, and borders.
 * Dark Slate Text (#20352F) — High-contrast, readable typography.

  
📁 Repository Structure

```
mama/
├── client/
│   ├── assets/
│   │   ├── api.js             # API integration, fetch wrappers, and endpoints
│   │   ├── app.js             # Client-side router and view event bindings
│   │   ├── contact.js         # Support Circle and emergency contact handling
│   │   ├── nav.js             # Navigation drawers and bottom-bar responsive menus
│   │   ├── site.js            # Global theme utilities and shared helper functions
│   │   ├── logo.png           # Visual branding assets
│   │   └── logo-256.png
│   ├── index.html             # Landing page and onboarding introduction
│   ├── home.html              # Main dashboard (daily tracking & quick actions)
│   ├── my-health.html         # Vitals, symptom logging, and historical records
│   ├── medicines.html         # Medicine schedule, prescription OCR, & reminder logs
│   ├── appointments.html      # Visit planner and care calendar
│   ├── insights.html          # Health trends, sleep/hydration, and adherence analytics
│   ├── doctor-brief.html      # Printable clinical summary for doctor visits
│   ├── contact.html           # Support network, hotlines, and consent management
│   ├── login.html             # User authentication and registration
│   └── 404.html               # Fallback route
├── package.json               # Project metadata and dependencies
└── README.md                  # Project documentation

```
🚀 Getting Started
Prerequisites
 * Node.js (v18.x or later recommended)
 * npm (v9.x or later) or yarn
 * Git
Installation & Setup
 * Clone the repository:
   git clone https://github.com/KamnaJ5/The-Localhosters.git
cd The-Localhosters

 * Navigate to the client application:
   cd mama/client

 * Install dependencies:
   npm install

 * Launch the development server:
   npm run dev

 * Open in browser:
   Open the local URL output by Vite in your terminal (typically http://localhost:5173).
 * Build for production:
   npm run build

🔒 Healthcare & Clinical Disclaimer

> Important: MAMA is designed strictly as a supportive maternal wellness, habit tracking, and care coordination platform. It is not a diagnostic medical device and does not provide clinical diagnoses, medical prescriptions, or emergency intervention. It is not a substitute for professional clinical advice, examination, or hospital care. If you experience severe symptoms (such as heavy bleeding, severe abdominal pain, chest pain, or visual disturbances), seek emergency medical attention immediately.

👥 The Localhosters
Built with care by The Localhosters:
 * Kamna Jolhe
 * Kunal Devdas
 * Manas Gupta
 * Sanskriti Patkar
  
💚 Our Vision
To support mothers and families through an empathetic, accessible digital companion that simplifies daily tracking, bridges communication with doctors, and ensures no mother navigates the postpartum period unsupported. 🌿
