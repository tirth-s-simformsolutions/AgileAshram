# NagarVaani — Scope & Task List

**Team:** Agile Ashram · **Hackathon:** Governance · **Duration:** 12 hours

---

## Locked Decisions

- **Database:** MongoDB Atlas (Mongoose)
- **Auth:** Mock DigiLocker flow by default; real API Setu sandbox behind `DIGILOCKER_MODE=sandbox` flag
- **Frontend:** Single Angular app (citizen + admin, role-based routing) — one dev, critical path
- **Image storage:** Cloudinary free tier
- **Deployment:** Netlify (FE) + Render (BE)

---

## Scope

### P0 — Must demo
- Citizen auth via DigiLocker (mock default; real API Setu sandbox behind a flag)
- Conversational complaint intake: text description + image upload + GPS capture
- Gemini validates complaint legitimacy + image quality (public property, context visible)
- Gemini responsibility-driven routing: matches complaint against each department's `responsibilities` → sets `departmentId`
- GPS verification: browser Geolocation + Nominatim reverse-geocode cross-check → `geoVerified`
- SMS alerts (Twilio trial) on submission and on every status change
- Admin dashboard: department/admin login, complaint queue sorted by `severityRank`, status update

### P1 — Strongly desired, must not block P0
- Real AMC CCRS submission via Nodemailer → `ccrs@ahmedabadcity.gov.in` (send to team-owned test inbox during demo; flag-switch to real address)
- Citizen ticket tracker: status timeline by ticket ID

---

## Architecture

```
Angular + Tailwind (Netlify)
  ├─ Citizen: DigiLocker login → chat intake → image upload → GPS → ticket tracker
  └─ Admin:   department/admin login → complaint queue (severityRank-sorted) → status update
        │  REST + JWT
        ▼
NestJS API (Render)
  ├─ AuthModule        — DigiLocker OAuth + JWT; citizen / department / admin roles
  ├─ AiModule          — Gemini Flash: validate-complaint + suggest-industries (live ✓)
  ├─ DepartmentModule  — department CRUD + seed (live ✓)
  ├─ ComplaintModule   — intake, lifecycle, queue, status history
  ├─ GeoModule         — Nominatim reverse-geocode + location cross-check
  └─ NotifyModule      — Twilio SMS, Nodemailer → AMC CCRS (P1)
        │
        ▼
MongoDB Atlas (Mongoose)  +  Cloudinary (image storage)
```

**Complaint lifecycle:** `SUBMITTED → ROUTED → IN_PROGRESS → RESOLVED` (admin can also set `REJECTED`).
Each transition appends to `statusHistory` and fires an SMS.

---

## Data Models

**User**
```
{
  _id, digilockerId, name, phone, email?,
  role: 'citizen' | 'official',
  department?,
  createdAt
}
```

**Complaint**
```
{
  _id,
  ticketId,           // e.g. NV-2026-000123
  citizenId,
  description,
  imageUrl?,
  category: 'Infrastructure' | 'Sanitation',
  severity: 'Low' | 'Medium' | 'High' | 'Critical',
  status: 'SUBMITTED' | 'ROUTED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED',
  gps: { lat, lng },
  reportedAddress,
  geoVerified: boolean,
  aiMeta: { model, confidence, rawLabel },
  amcSubmitted: boolean,
  statusHistory: [{ status, note, at, byUserId }],
  createdAt,
  updatedAt
}
```

**Department** (seed data)
```
{ _id, name, category, officials: [userId] }
```

---

## API Contracts

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/auth/digilocker/start` | Begin (mock) DigiLocker flow → redirect/consent stub |
| `POST` | `/auth/digilocker/callback` | Exchange code → JWT + verified citizen profile |
| `POST` | `/complaints/intake/message` | Conversational turn: text → bot reply + extracted fields |
| `POST` | `/complaints` | Finalize submission (desc, image, gps) → moderation + AI + geo → ticketId |
| `GET` | `/complaints/:ticketId` | Citizen ticket tracker (status + history) |
| `GET` | `/admin/complaints?dept=&sort=severity` | Admin queue (official role required) |
| `PATCH` | `/admin/complaints/:id/status` | Update status → appends history + fires SMS |

**Submission pipeline** (inside `POST /complaints`):
1. Moderate image (NSFW check)
2. Classify + severity score (Gemini Flash)
3. Reverse-geocode + cross-check GPS (Nominatim)
4. Persist to MongoDB
5. Send SMS confirmation to citizen
6. *(P1)* Email AMC CCRS

---

## Task List

### Setup & Infrastructure
- [ ] Initialise NestJS backend repo, connect MongoDB Atlas
- [ ] Initialise Angular frontend repo, configure Tailwind + component library (Angular Material)
- [ ] Set up shared `.env` template; provision all API keys (Gemini, Twilio, ModerateContent, Cloudinary)
- [ ] Define and freeze Mongoose schemas: User, Complaint, Department
- [ ] Write seed script: 2 departments, 1 citizen user, 1 official user
- [ ] Set up Swagger (`/docs`) on the backend
- [ ] Deploy hello-world FE → Netlify and BE → Render (done by hour 2 to prove pipeline)
- [ ] Stand up mock/stubbed API server matching the contract (unblocks frontend from hour 1)

### Auth Module (Backend)
- [ ] `POST /auth/digilocker/start` — return mock consent stub; wire real API Setu behind `DIGILOCKER_MODE=sandbox`
- [ ] `POST /auth/digilocker/callback` — exchange code → issue JWT (access + refresh) with citizen profile
- [ ] JWT auth guard + `@CurrentUser()` decorator
- [ ] Role guard: `citizen` vs `official`; admin routes reject citizen tokens
- [ ] Seed one citizen and one official with department reference

### Complaint Module (Backend)
- [ ] `POST /complaints` orchestrator: validate → moderate → classify → geo-verify → persist → notify
- [ ] ticketId generation (format: `NV-YYYY-XXXXXX`, human-readable, unique)
- [ ] Routing rule: `Infrastructure` → Infrastructure Dept, `Sanitation` → Sanitation Dept
- [ ] Status lifecycle: `SUBMITTED → ROUTED → IN_PROGRESS → RESOLVED / REJECTED`
- [ ] `statusHistory` append on every transition
- [ ] `GET /complaints/:ticketId` — return status + full history (citizen-accessible, no auth required)
- [ ] `GET /admin/complaints?dept=&sort=severity` — severity-sorted queue, official role required
- [ ] `PATCH /admin/complaints/:id/status` — update status, append history, trigger SMS

### AI Module — Gemini Flash (Backend)
- [ ] Gemini Flash client setup (Google AI Studio key)
- [ ] Image analysis: send image → detect issue type (structured JSON output)
- [ ] Text analysis: complaint description → category + severity (strict JSON schema, handle low-confidence)
- [ ] `POST /complaints/intake/message` — conversational bot turn: receive user message → reply + extract fields (description, category hint)
- [ ] Fallback: if Gemini fails or confidence is low, default to `Sanitation / Low` and flag for manual review

### Moderation Module (Backend)
- [ ] ModerateContent.com client setup
- [ ] NSFW check on every uploaded image before it reaches the AI pipeline
- [ ] Reject complaint with `400` if image fails moderation; return clear error message

### Geo Module (Backend)
- [ ] Nominatim reverse-geocode: `{lat, lng}` → human-readable address
- [ ] Cross-check: compare geocoded address against user-reported address; set `geoVerified: true/false`
- [ ] Flag complaints where GPS location and reported address diverge significantly

### Notification Module (Backend)
- [ ] Twilio SMS on complaint submission (citizen receives ticketId + status)
- [ ] Twilio SMS on every status change (triggered by `PATCH /admin/complaints/:id/status`)
- [ ] SMS templates: submission confirmation, status update (include ticketId in every message)
- [ ] *(P1)* Nodemailer: send structured complaint email to AMC CCRS on submission; set `amcSubmitted: true`

### Frontend — Citizen App (Angular)
- [ ] Angular project scaffold: routing, Tailwind, HTTP interceptor (attach JWT), auth service
- [ ] DigiLocker login screen → call `/auth/digilocker/start` → handle callback → store JWT
- [ ] Conversational chat UI: message bubbles, bot typing indicator, sequential turns
- [ ] Image upload: file picker + drag-drop, preview thumbnail, send to backend
- [ ] GPS capture: `navigator.geolocation` → display detected address to user for confirmation
- [ ] Submission flow: guided chat → review screen → submit → success screen with ticketId
- [ ] Ticket tracker page: enter ticketId → display current status + status history timeline

### Frontend — Admin App (Angular)
- [ ] Official login screen (role: `official`)
- [ ] Complaint queue table: sorted by severity (Critical → High → Medium → Low), filter by department and status
- [ ] Complaint detail view: image, AI labels (category + severity), geoVerified badge, GPS coordinates
- [ ] Status update action: dropdown (IN_PROGRESS / RESOLVED / REJECTED) + optional note → `PATCH /admin/complaints/:id/status`
- [ ] Auto-poll queue every 10s so new complaints appear during demo without refresh

### Frontend — de-scoping levers (pull if behind)
- Drop the map pin — show lat/lng as plain text
- Replace conversational chat with a styled 3-step guided form
- Replace animated status timeline with a simple status badge + list
- Admin = single table + inline status dropdown, no detail view

---

## Hour-by-Hour Timeline

| Hours | Milestone |
|---|---|
| **0–1** | Repos up, all keys provisioned, `.env` shared, API contract frozen, Angular + NestJS scaffolds pushed, mock API live |
| **1–4** | Parallel build: schemas + complaint skeleton; auth + JWT; Gemini classify working standalone; moderation + geo callable standalone; SMS working; frontend chat + admin table shells coded against mock API |
| **4–7** | Integration pass 1: mock DigiLocker login → chat → `POST /complaints` → AI labels persisted → SMS fires. Admin queue reads real data |
| **7–9** | Geo verification wired, severity sort in admin, status update → SMS, ticket tracker. P1: AMC email |
| **9–10.5** | Deploy FE → Netlify, BE → Render; smoke-test full happy path on deployed URLs |
| **10.5–12** | Bug-bash, demo rehearsal, seed clean demo data, record fallback video, UI polish |

**Integration checkpoints:**
- End of hour 4 — auth works end-to-end
- End of hour 7 — full happy path working locally
- End of hour 10 — full happy path working on deployed URLs

If any P1 or polish item is not done by hour 9, it is cut.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| API Setu registration slow / unavailable | Mock DigiLocker is the default; sandbox is a flag — fully de-risked |
| Gemini rate limits / latency | Cache demo responses; rules-based severity fallback if API fails |
| Twilio trial prefix / unverified numbers | Pre-verify demo phone in Twilio console before hackathon day |
| AMC email delivery uncertainty | Send to team-owned test inbox during demo; flag-switch shown but not fired live |
| Render cold start kills demo | Ping backend before demo starts; keep local fallback running |
| Deploy pipeline eats time | Deploy hello-world FE + BE by hour 2 to prove pipeline early |
| Single frontend dev is the bottleneck | Mock API from hour 1; backend devs pivot to help with API wiring after hour 7 |

---

## Demo Script

1. Citizen logs in via DigiLocker (mock) → verified identity shown
2. Opens chat: *"There's a pothole on my street"*, uploads a photo, grants GPS
3. Backend moderates image → Gemini classifies → **Infrastructure / High**, Nominatim confirms location → **geoVerified ✓**. Citizen receives **live SMS with ticket ID**
4. Switch to admin dashboard → complaint appears at top of queue (severity-sorted) with image, AI labels, geo badge. Official sets status → **In Progress** → citizen receives second SMS
5. *(P1)* Show the AMC CCRS email generated for `ccrs@ahmedabadcity.gov.in`

---

## Acceptance Criteria

- **Auth:** mock DigiLocker login issues a JWT; admin routes reject citizen tokens
- **Intake:** `POST /complaints` with a pothole image + text returns a ticketId; persisted Complaint has non-null `category`, `severity`, `aiMeta`, and `geoVerified`
- **Moderation:** an NSFW test image is rejected before reaching Gemini
- **SMS:** a real SMS lands on the pre-verified demo phone at submission and at status change
- **Admin queue:** returns complaints sorted by severity desc; status PATCH appends to `statusHistory` and triggers SMS
- **Tracker:** `GET /complaints/:ticketId` returns current status + full history
- **Deployed:** full happy path runs on Netlify + Render URLs, not just localhost
- *(P1)* **AMC email:** correctly formatted complaint email delivered to team test inbox

---

## Pre-Hackathon Checklist

- [ ] Register API Setu developer account (sandbox fallback)
- [ ] Create Google AI Studio key (Gemini Flash, free tier)
- [ ] Create Twilio trial account + verify demo phone number
- [ ] Sign up for ModerateContent.com API key
- [ ] Create MongoDB Atlas free cluster
- [ ] Create Cloudinary free account
- [ ] Set up Netlify + Render accounts
- [ ] Share single `.env` template across team
