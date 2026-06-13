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
  _id, role: 'citizen' | 'department' | 'admin',
  name?, status: 'active' | 'inactive' | 'blocked',
  // department + admin login:
  email?, password?, departmentId?,
  // citizen (DigiLocker) login:
  digilockerId?, phone?,
  createdAt, updatedAt
}
```

**Complaint**
```
{
  _id,
  ticketId,              // e.g. NV-2026-000123 (atomic Counter sequence)
  citizenId,
  description,
  imageUrl?,
  departmentId,          // routing target — set by AI (responsibility-driven), NOT a fixed category map
  severity: 'Low' | 'Medium' | 'High' | 'Critical',
  severityRank: 1|2|3|4, // numeric mirror; the work queue sorts on this field
  status: 'SUBMITTED' | 'ROUTED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED',
  gps: { lat, lng },
  reportedAddress,
  geoVerified: boolean,
  geoDistanceMeters?,
  aiMeta: { model, confidence, rawLabel?, fallbackUsed },
  moderation: { passed, provider, score? },
  amcSubmitted: boolean,
  statusHistory: [{ status, note?, at, byUserId? }],
  resolvedBy?, resolvedAt?,
  createdAt, updatedAt
}
```

**Department** (seeded — responsibilities drive AI routing)
```
{ _id, name, responsibilities: string[], contactEmail?, isActive, createdAt, updatedAt }
```
Default seed: `Garbage / Waste Management Department`, `Industry Department`.

**Counter** (internal — atomic ticket ID generation)
```
{ key: 'complaint-2026', seq: number }
// findOneAndUpdate $inc → format NV-2026-000123
```

---

## API Contracts

All routes prefixed `/api/v1/`. Swagger at `/docs`.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `POST` | `/auth/digilocker/start` | Public | Begin DigiLocker flow |
| `POST` | `/auth/digilocker/callback` | Public | Exchange code → JWT + citizen profile |
| `POST` | `/ai/validate-complaint` | Public ✓ | Gemini: is complaint legit + is image valid? |
| `POST` | `/ai/suggest-industries` | Public ✓ | Gemini: match complaint to best-fit department |
| `POST` | `/complaints` | Citizen | Submit → AI route → geo → ticketId |
| `GET` | `/complaints/:ticketId` | Public | Citizen ticket tracker (status + history) |
| `GET` | `/admin/complaints?dept=&sort=severityRank` | Department/Admin | Severity-sorted queue |
| `PATCH` | `/admin/complaints/:id/status` | Department/Admin | Update status → history + SMS |

**Submission pipeline** (inside `POST /complaints`):
1. `POST /ai/validate-complaint` — Gemini checks complaint text + image
2. `POST /ai/suggest-industries` — Gemini returns `departmentId`
3. Reverse-geocode + cross-check GPS (Nominatim) → `geoVerified`
4. Persist to MongoDB (Counter `$inc` → ticketId)
5. SMS confirmation to citizen (Twilio)
6. *(P1)* Email AMC CCRS (Nodemailer)

---

## Task List

### Setup & Infrastructure
- [x] NestJS backend scaffolded (auth, user, JWT, guards, interceptors, Swagger)
- [x] Mongoose schemas defined: User, Complaint, Department, Counter
- [x] Shared `.env.example` with all required keys
- [ ] MongoDB Atlas cluster connected (update `DATABASE_URL`)
- [ ] Angular frontend repo initialised, Tailwind + component library configured
- [ ] Write seed script: default departments + 1 citizen + 1 department user
- [ ] Deploy hello-world FE → Netlify and BE → Render (prove pipeline early)
- [ ] Stand up mock/stubbed API (unblocks frontend from hour 1)

### Auth Module (Backend)
- [x] JWT auth guard + `@CurrentUser()` decorator (boilerplate)
- [ ] `POST /auth/digilocker/start` — mock consent stub; real DigiLocker behind flag
- [ ] `POST /auth/digilocker/callback` — exchange code → issue JWT with citizen profile
- [ ] Role guard: `citizen` vs `department` vs `admin`; admin routes reject citizen tokens
- [ ] Seed one citizen user and one department user

### Complaint Module (Backend)
- [ ] `POST /complaints` orchestrator: validate-complaint → suggest-industries → geo-verify → persist → SMS
- [ ] ticketId via atomic Counter `$inc` (format: `NV-YYYY-XXXXXX`)
- [ ] Routing: AI returns `departmentId` (responsibility-driven, no hardcoded category map)
- [ ] `severityRank` auto-synced from `severity` via pre-save hook (queue sorts on rank, not string)
- [ ] Status lifecycle: `SUBMITTED → ROUTED → IN_PROGRESS → RESOLVED / REJECTED`
- [ ] `statusHistory` append on every transition
- [ ] `GET /complaints/:ticketId` — status + full history (public, no auth required)
- [ ] `GET /admin/complaints?dept=&sort=severityRank` — severity-sorted queue, department/admin role required
- [ ] `PATCH /admin/complaints/:id/status` — update status, append history, trigger SMS

### AI Module — Gemini Flash (Backend)
- [x] `POST /ai/validate-complaint` — Gemini checks complaint legitimacy + image quality (public property, context visible, not extreme close-up). Returns `{ isLegit, reason?, imageAnalysis: { isValid, reason? } }`
- [x] `POST /ai/suggest-industries` — Gemini matches complaint against all department `responsibilities` arrays. Returns `{ industryId, summary }`. Falls back to `null` industryId on low confidence
- [ ] Wire fallback: if `industryId` is null, assign to a default "General" department and flag `aiMeta.fallbackUsed = true`

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
- [ ] Department/admin login screen (role: `department` or `admin`)
- [ ] Complaint queue table: sorted by `severityRank` desc (Critical → High → Medium → Low), filter by department and status
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
3. Gemini validates the complaint + image → routes to **Garbage / Waste Management** (responsibility-driven). Nominatim confirms location → **geoVerified ✓**. Citizen receives **live SMS with ticket ID**
4. Switch to admin dashboard → complaint appears at top of queue (severityRank-sorted) with image, AI labels, geo badge. Department user sets status → **In Progress** → citizen receives second SMS
5. *(P1)* Show the AMC CCRS email generated for `ccrs@ahmedabadcity.gov.in`

---

## Acceptance Criteria

- **Auth:** mock DigiLocker login issues a JWT; admin routes reject citizen tokens
- **Intake:** `POST /complaints` with a pothole image + text returns a ticketId; persisted Complaint has non-null `departmentId`, `severity`, `severityRank`, `aiMeta`, and `geoVerified`
- **Validation:** an illegitimate complaint or invalid image is rejected by `POST /ai/validate-complaint` before the submission pipeline runs
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
- [ ] Create Google AI Studio key (`GOOGLE_GENAI_API_KEY`, model: `gemini-2.5-flash`)
- [ ] Create MongoDB Atlas free cluster
- [ ] Create Cloudinary free account
- [ ] Set up Netlify + Render accounts
- [ ] Share single `.env` template across team
