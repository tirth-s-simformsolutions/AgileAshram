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
  └─ Admin:   department login → complaint queue (severity-sorted) → status update
        │  REST + JWT
        ▼
NestJS API (Render)
  ├─ AuthModule        — mock DigiLocker OAuth + JWT; real API Setu behind flag
  ├─ ComplaintModule   — intake, lifecycle, routing, queue, status history
  ├─ AiModule          — Gemini Flash: image+text classify, severity, conversational bot
  ├─ ModerationModule  — ModerateContent.com NSFW gate
  ├─ GeoModule         — Nominatim reverse-geocode + location cross-check
  └─ NotifyModule      — Twilio SMS, Nodemailer → AMC CCRS
        │
        ▼
MongoDB Atlas (Mongoose)  +  Cloudinary (image storage)
```

**Complaint lifecycle:** `SUBMITTED → ROUTED → IN_PROGRESS → RESOLVED` (admin can also set `REJECTED`). Each transition appends to a status-history array and fires an SMS.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17 + Tailwind CSS |
| Backend | Node.js + NestJS |
| Database | MongoDB Atlas (Mongoose) |
| AI | Google Gemini Flash (Google AI Studio) |
| Image Moderation | ModerateContent.com |
| Auth | DigiLocker via API Setu sandbox |
| Location | Browser Geolocation + Nominatim (OpenStreetMap) |
| SMS | Twilio |
| Email | Nodemailer → AMC CCRS (`ccrs@ahmedabadcity.gov.in`) |
| Deploy | Netlify (FE) + Render (BE) |

---

## Key API Endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/auth/digilocker/start` | Begin DigiLocker flow |
| `POST` | `/auth/digilocker/callback` | Exchange code → JWT + citizen profile |
| `POST` | `/complaints/intake/message` | Conversational turn → bot reply + extracted fields |
| `POST` | `/complaints` | Submit complaint → moderation + AI + geo → ticketId |
| `GET` | `/complaints/:ticketId` | Citizen ticket tracker |
| `GET` | `/admin/complaints?dept=&sort=severity` | Admin complaint queue |
| `PATCH` | `/admin/complaints/:id/status` | Update status → history + SMS |

---

## Data Models

**User**
```
{ _id, digilockerId, name, phone, email?, role: 'citizen'|'official', department?, createdAt }
```

**Complaint**
```
{
  _id, ticketId,          // e.g. NV-2026-000123
  citizenId, description, imageUrl?,
  category: 'Infrastructure'|'Sanitation',
  severity: 'Low'|'Medium'|'High'|'Critical',
  status, gps: { lat, lng }, reportedAddress, geoVerified,
  aiMeta: { model, confidence, rawLabel },
  amcSubmitted,
  statusHistory: [{ status, note, at, byUserId }],
  createdAt, updatedAt
}
```

**Department** (seed data)
```
{ _id, name, category, officials: [userId] }
```

---

## Scope

### P0 — Must demo
- Citizen auth via mock DigiLocker (real API Setu sandbox behind a flag)
- Conversational complaint intake: text + image upload + GPS capture
- AI classification + severity scoring (Gemini Flash)
- NSFW image moderation (ModerateContent.com) before image enters pipeline
- GPS verification (Nominatim cross-check)
- SMS alerts (Twilio) on submission and on status change
- Admin dashboard: department login, complaint queue sorted by severity, status update

### P1 — Strongly desired
- Real AMC CCRS submission via Nodemailer → `ccrs@ahmedabadcity.gov.in`
- Citizen ticket tracker (status timeline by ticket ID)

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB Atlas cluster
- Accounts/keys: Google AI Studio, Twilio, ModerateContent.com, Cloudinary, API Setu (sandbox)

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

```env
# App
NODE_ENV=local
PORT=3000

# MongoDB
MONGODB_URI=

# JWT
JWT_ACCESS_SECRET_KEY=
JWT_REFRESH_SECRET_KEY=
JWT_ACCESS_TOKEN_EXPIRE=15m
JWT_REFRESH_TOKEN_EXPIRE=7d

# DigiLocker / API Setu
DIGILOCKER_MODE=mock          # mock | sandbox
APISETU_CLIENT_ID=
APISETU_CLIENT_SECRET=
APISETU_REDIRECT_URI=

# AI
GEMINI_API_KEY=

# Moderation
MODERATECONTENT_API_KEY=

# Notifications
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Email (AMC CCRS)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
AMC_CCRS_EMAIL=ccrs@ahmedabadcity.gov.in

# Image storage
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Monitoring
SENTRY_DSN=
```

---

## Demo Script

1. Citizen logs in via DigiLocker (mock) → verified identity shown
2. Opens chat: *"There's a pothole on my street"*, uploads a photo, grants GPS
3. Backend moderates image → Gemini classifies → **Infrastructure / High**, Nominatim confirms location → **geoVerified ✓**. Citizen receives **SMS with ticket ID** live
4. Switch to admin dashboard → complaint appears at top (severity-sorted) with image, AI labels, geo badge. Official sets status → **In Progress** → citizen receives second SMS
5. *(P1)* Show the AMC CCRS email generated for `ccrs@ahmedabadcity.gov.in`

---

## Pre-Hackathon Checklist

- [ ] Register API Setu developer account
- [ ] Create Google AI Studio key (Gemini Flash)
- [ ] Create Twilio trial account + verify demo phone number
- [ ] Sign up for ModerateContent.com API key
- [ ] Create MongoDB Atlas free cluster
- [ ] Create Cloudinary free account
- [ ] Set up Netlify + Render accounts
- [ ] Share `.env` template across team
