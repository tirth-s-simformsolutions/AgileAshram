# Project Definition — Governance Hackathon

## Project basics

| Field | Your entry |
|---|---|
| **Project title** | NagarVaani — AI-Powered Civic Grievance Platform |
| **Team name** | Agile Ashram |
| **Team members** | Meena Kachhot (Tech Lead), Tirth Shah (SSE — Auth & DigiLocker), Manthan Panchal (SSE — AI Pipeline), Darshan Chaudhary (SE — Notifications & Deploy), Aum Mehta (Intern — Moderation & Geo), Harsh Barot (Frontend) |
| **Focus area** | Urban Governance / Municipal Service Delivery |
| **One-line pitch** | NagarVaani lets DigiLocker-verified citizens report civic issues in seconds — AI classifies, prioritises, and routes each complaint to the right municipal department automatically, with real-time SMS updates on every status change. |

---

## 1. Problem statement

India's municipal grievance systems are fragmented, manual, and opaque. Citizens filing a complaint — a pothole, a broken streetlight, illegal dumping — must first figure out which of dozens of departments to contact, then submit through a portal that offers no intelligent triage and no feedback loop. Misrouted complaints sit unacknowledged for weeks, and officials have no structured way to prioritise urgent cases over low-severity ones. Ahmedabad's CPGRAMS and similar state portals suffer from the same gap: they are digital post-boxes, not intelligent routing engines. The result is eroded public trust and avoidable urban decay.

---

## 2. Proposed solution

NagarVaani is a web platform where verified citizens report civic problems through a guided chat interface — they type a description, optionally upload a photo, and share their GPS location. Google Gemini validates the complaint (is it a genuine civic issue? is the photo relevant?), classifies it, assigns a severity level, and routes it to the correct municipal department — all without a human dispatcher. The citizen immediately receives a unique ticket ID and an SMS confirmation. Department officials log into a separate dashboard and see a severity-sorted work queue; every status update they make triggers another SMS back to the citizen. Identity is anchored to DigiLocker so complaints are accountable and cannot be filed anonymously or repeatedly for the same issue.

---

## 3. Objectives

1. **Eliminate manual triage** — 100% of submitted complaints are automatically classified and routed to the correct department without human dispatcher intervention.
2. **Reduce misrouting** — AI responsibility-driven routing (no hardcoded category map) adapts to department mandates; fallback logic ensures no complaint goes unassigned.
3. **Close the feedback loop** — every citizen receives an SMS on submission and on each status change, so no complaint is silently ignored.
4. **Enable priority-based resolution** — department dashboards surface complaints by SLA deadline and severity rank, so critical issues are actioned first.

---

## 4. How AI is used

Google Gemini Flash (`gemini-2.5-flash`) performs three distinct jobs in the complaint pipeline:

1. **Validation** — Gemini reads the complaint text and image together and decides whether it is a legitimate civic grievance (rejecting spam, political content, or private property issues) and whether the photo meets quality rules (must show public property in context, not an extreme close-up or unrelated scene).
2. **Responsibility-driven routing** — Gemini is given the complaint description alongside each department's `responsibilities` array from the database and picks the best-fit department. There is no hardcoded category map; if a new department is added with new responsibilities, routing adapts automatically.
3. **Duplicate detection** — before persisting, Gemini checks whether a semantically similar complaint already exists within 200 metres (pre-filtered by Haversine distance) and in the same department, preventing duplicate work orders.

AI is the right choice here because the variety of civic issue language — misspellings, regional phrasing, mixed-language descriptions — makes rule-based classification brittle. Privacy considerations: complaint text and images are sent to Google's API; no personally identifiable information beyond the complaint description is included in AI prompts.

---

## 5. Approach / methodology

**Tech stack:**
- Frontend: Angular 17 + Tailwind CSS (Netlify)
- Backend: NestJS 10 + TypeScript on Node.js 22 (Render)
- Database: MongoDB Atlas (Mongoose)
- AI: Google Gemini Flash via `@google/genai`
- Auth: DigiLocker OAuth via API Setu sandbox
- Location: Browser Geolocation API + Nominatim (OpenStreetMap) reverse-geocode cross-check
- SMS: Twilio
- Image storage: Cloudflare R2 (presigned URL, client-side upload)

**Key pipeline steps:**
1. Citizen logs in via DigiLocker → verified identity stored as `digilockerId + phone`
2. Complaint intake: text description + optional image upload (R2 presigned URL) + GPS coordinates
3. AI pipeline: validate → route → duplicate-check → resolve GPS to ward (geospatial point-in-polygon)
4. Atomic ticket ID generated (`NV-2026-XXXXXX`) via MongoDB counter; complaint persisted with SLA due date
5. SMS sent to citizen; complaint appears in department work queue sorted by `severityRank` and `dueDate`
6. Department official updates status → `statusHistory` appended → second SMS sent to citizen

---

## 6. What makes it different

Existing portals like CPGRAMS are digital forms that dump complaints into a generic inbox — a human must read, classify, and forward each one. NagarVaani eliminates that dispatcher entirely: routing is driven by each department's actual stated responsibilities, not a fixed taxonomy that goes stale. The duplicate-detection step prevents the same broken manhole from generating twenty separate work orders after heavy rain. And because identity is anchored to DigiLocker, complaints are accountable — officials can see a verified citizen behind every ticket, which discourages frivolous submissions without requiring a phone OTP loop.

---

## 7. Scope & feasibility

**We will build and demo:**
- DigiLocker login (API Setu sandbox, mock mode enabled by default)
- Complaint intake: text + image + GPS, full AI pipeline (validate → route → deduplicate)
- Ticket ID generation and SMS confirmation to citizen
- Department admin dashboard: severity-sorted complaint queue, status update, SMS notification on change
- Citizen ticket tracker: look up complaint status by ticket ID

**Out of scope (future work):**
- Real AMC CCRS email submission to `ccrs@ahmedabadcity.gov.in`
- Multi-language (regional language) complaint input
- Analytics dashboard for city-level complaint trends
- Mobile app (currently a responsive web app)

**Risks / dependencies:**
- DigiLocker API Setu sandbox availability — mitigated by built-in mock mode flag
- Google Gemini API rate limits under concurrent demo load — mitigated by Gemini Flash's high throughput tier
- Twilio trial account restricts SMS to verified numbers — demo phones must be pre-registered

---

## 8. Expected outcomes & impact

A working demo will show a complaint go from citizen submission to department work queue in under 10 seconds with zero manual steps. If adopted at city scale, a single instance could handle all incoming civic complaints for a municipal corporation — replacing a dispatcher team, cutting misrouting to near zero, and giving every citizen a timestamped, trackable record of their issue. The SLA-aware priority queue means officials spend their time on the most urgent problems first rather than the most recently filed. At Ahmedabad's scale (~8 million residents), even a 20% increase in complaint resolution rate translates to thousands of civic issues resolved per month that would previously have stalled.

---

## 9. Extras

- GitHub repository: https://github.com/tirth-s-simformsolutions/AgileAshram
- Swagger API docs: available at `/docs` when backend is running
- Deployment: Backend on Render, Frontend on Netlify (links available on request)
