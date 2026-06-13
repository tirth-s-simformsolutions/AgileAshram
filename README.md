# NagarVaani — AI-Powered Civic Grievance Platform

> Governance Hackathon · Team Agile Ashram

An AI platform where DigiLocker-verified citizens report civic issues via text or photo, and the system classifies, prioritises, and routes them directly to the right municipal department — with real AMC submission and SMS updates.

---

## Team

| Name | Role |
|---|---|
| Meena Kachhot | Tech Lead |
| Tirth Shah | SSE — Auth & DigiLocker |
| Manthan Panchal | SSE — AI Pipeline |
| Darshan Chaudhary | SE — Notifications & Deploy |
| Aum Mehta | Intern — Moderation & Geo |
| Harsh Barot | Frontend (Angular) |

---

## Problem

India's municipal grievance systems are fragmented and manual. Citizens don't know which department to contact, complaints are misrouted or lost, and officials have no structured way to prioritise them. Existing portals like CPGRAMS lack intelligent triage and real-time feedback.

---

## Solution

Citizens log in via DigiLocker, then report an issue through a guided conversational chat — typing a description or uploading a photo. The AI classifies the complaint, assigns a severity, and routes it to the correct department. The complaint is forwarded to AMC's official CCRS system, and the citizen receives an SMS confirmation with a ticket ID. Department officials manage incoming complaints through a separate admin dashboard.

---

## Architecture

```
Angular + Tailwind (Netlify)
  ├─ Citizen: DigiLocker login → chat intake → image upload → GPS → ticket tracker
  └─ Admin:   department / admin login → complaint queue (severityRank-sorted) → status update
        │  REST + JWT
        ▼
NestJS API (Render)
  ├─ AuthModule        — DigiLocker OAuth + JWT; citizen, department, admin roles
  ├─ AiModule          — Gemini Flash: validate complaint + image, responsibility-driven routing
  ├─ DepartmentModule  — department CRUD + seeding (responsibilities drive AI routing)
  ├─ ComplaintModule   — intake, lifecycle, queue, status history
  ├─ GeoModule         — Nominatim reverse-geocode + location cross-check
  └─ NotifyModule      — Twilio SMS, Nodemailer → AMC CCRS (P1)
        │
        ▼
MongoDB Atlas (Mongoose)  +  Cloudinary (image storage)
```

**Complaint lifecycle:** `SUBMITTED → ROUTED → IN_PROGRESS → RESOLVED` (admin can also set `REJECTED`). Each transition appends to `statusHistory` and fires an SMS.

**AI routing:** Gemini reads the complaint text + image and matches it against each department's `responsibilities` array to pick the best-fit department — no hardcoded category map. The same call also validates whether the complaint is a legitimate civic issue and whether the image meets quality rules (public property, context visible, not extreme close-up).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 + Tailwind CSS |
| Backend | Node.js + NestJS |
| Database | MongoDB Atlas (Mongoose) |
| AI | Google Gemini Flash (`gemini-2.5-flash`) via `@google/genai` |
| Image Moderation | Gemini Flash (complaint validity + image quality check) |
| Auth | DigiLocker via API Setu sandbox |
| Location | Browser Geolocation + Nominatim (OpenStreetMap) |
| SMS | Twilio |
| Email | Nodemailer → AMC CCRS (`ccrs@ahmedabadcity.gov.in`) |
| Deploy | Netlify (FE) + Render (BE) |

---

## Key API Endpoints

All routes are prefixed `/api/v1/`. Swagger docs at `/docs`.

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `POST` | `/auth/digilocker/start` | Public | Begin DigiLocker flow |
| `POST` | `/auth/digilocker/callback` | Public | Exchange code → JWT + citizen profile |
| `POST` | `/ai/validate-complaint` | Public | Gemini validates complaint text + image legitimacy |
| `POST` | `/ai/suggest-industries` | Public | Gemini matches complaint to best-fit department |
| `POST` | `/complaints` | Citizen | Submit complaint → AI route → geo → ticketId |
| `GET` | `/complaints/:ticketId` | Public | Citizen ticket tracker (status + history) |
| `GET` | `/admin/complaints?dept=&sort=severityRank` | Department/Admin | Severity-sorted complaint queue |
| `PATCH` | `/admin/complaints/:id/status` | Department/Admin | Update status → history + SMS |

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
  _id, ticketId,              // e.g. NV-2026-000123 (atomic Counter sequence)
  citizenId, description, imageUrl?,
  departmentId,               // routing target — set by AI, not a fixed category map
  severity: 'Low'|'Medium'|'High'|'Critical',
  severityRank: 1|2|3|4,      // numeric mirror; the queue sorts on this field
  status: 'SUBMITTED'|'ROUTED'|'IN_PROGRESS'|'RESOLVED'|'REJECTED',
  gps: { lat, lng }, reportedAddress,
  geoVerified: boolean, geoDistanceMeters?,
  aiMeta: { model, confidence, rawLabel?, fallbackUsed },
  moderation: { passed, provider, score? },
  amcSubmitted: boolean,
  statusHistory: [{ status, note?, at, byUserId? }],
  resolvedBy?, resolvedAt?,
  createdAt, updatedAt
}
```

**Department** (seeded — drives AI routing)
```
{ _id, name, responsibilities: string[], contactEmail?, isActive, createdAt, updatedAt }
```
Default seed: `Garbage / Waste Management Department`, `Industry Department`.

**Counter** (internal — atomic ticket sequence)
```
{ key: 'complaint-2026', seq: number }  // $inc on each complaint → NV-2026-000123
```

---

## Scope

### P0 — Must demo
- Citizen auth via DigiLocker (mock default; real API Setu sandbox behind a flag)
- Conversational complaint intake: text + image upload + GPS capture
- Gemini validates complaint legitimacy + image quality, then routes to the best-fit department
- GPS verification (Nominatim cross-check)
- SMS alerts (Twilio) on submission and on status change
- Admin dashboard: department/admin login, complaint queue sorted by `severityRank`, status update

### P1 — Strongly desired
- Real AMC CCRS submission via Nodemailer → `ccrs@ahmedabadcity.gov.in`
- Citizen ticket tracker (status timeline by ticket ID)

---

## Getting Started

### Prerequisites
- Node.js 22+
- MongoDB Atlas cluster
- Accounts/keys: Google AI Studio (`GOOGLE_GENAI_API_KEY`), Twilio, Cloudinary, DigiLocker client credentials

### Backend

```bash
cd Backend
cp .env.example .env   # fill in all keys
npm install
npm run start:dev
# API available at http://localhost:3000/api/v1
# Swagger docs at http://localhost:3000/docs
```

### Frontend

```bash
cd Frontend
npm install
ng serve
# App available at http://localhost:4200
```

### Docker (Backend)

```bash
cd Backend
docker-compose up
```

---

## Environment Variables

See `Backend/.env.example` for the canonical list. Key variables:

```env
DATABASE_URL=mongodb://localhost:27017/nagarvaani
NODE_ENV=development
PORT=3000

JWT_ACCESS_SECRET_KEY=
JWT_REFRESH_SECRET_KEY=
JWT_ACCESS_TOKEN_EXPIRE=15m
JWT_REFRESH_TOKEN_EXPIRE=7d

# DigiLocker
DIGILOCKER_CLIENT_ID=
DIGILOCKER_CLIENT_SECRET=

# Google Gemini
GOOGLE_GENAI_API_KEY=
GOOGLE_GENAI_MODEL=gemini-2.5-flash

# Content moderation (supplementary)
MODERATE_CONTENT_API_KEY=

# Twilio (SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Email (AMC CCRS — P1)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SENTRY_DSN=
```

---

## Demo Script

1. Citizen logs in via DigiLocker (mock) → verified identity shown
2. Opens chat: *"There's a pothole on my street"*, uploads a photo, grants GPS
3. Gemini validates the complaint + image → routes to **Garbage / Waste Management** (responsibility-driven, no hardcoded map). Nominatim confirms location → **geoVerified ✓**. Citizen receives **SMS with ticket ID** live
4. Switch to admin dashboard → complaint appears at top (severity-sorted) with image, AI labels, geo badge. Official sets status → **In Progress** → citizen receives second SMS
5. *(P1)* Show the AMC CCRS email generated for `ccrs@ahmedabadcity.gov.in`

---

## Pre-Hackathon Checklist

- [ ] Register DigiLocker developer credentials (`DIGILOCKER_CLIENT_ID` / `DIGILOCKER_CLIENT_SECRET`)
- [ ] Create Google AI Studio key (`GOOGLE_GENAI_API_KEY`, model: `gemini-2.5-flash`)
- [ ] Create Twilio trial account + verify demo phone number
- [ ] Create MongoDB Atlas free cluster
- [ ] Create Cloudinary free account
- [ ] Set up Netlify + Render accounts
- [ ] Share `Backend/.env.example` → `.env` across team
