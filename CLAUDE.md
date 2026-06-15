# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NagarVaani** — AI-Powered Civic Grievance Platform. Built for a Governance Hackathon by Team Agile Ashram.

DigiLocker-verified citizens report civic issues (text + photo + GPS). Gemini validates and routes each complaint to the right municipal department, generates a ticket ID, and notifies the citizen via SMS. Department officials manage the queue through a separate admin dashboard.

**Deployment:** Frontend → Netlify | Backend → Render | DB → MongoDB Atlas

### Scope

**P0 — Must demo:**
- Citizen auth via DigiLocker (mock default; real API Setu sandbox behind a flag)
- Conversational complaint intake: text + image upload + GPS capture
- Gemini validates complaint legitimacy + image quality, then routes to best-fit department
- GPS verification (Nominatim reverse-geocode cross-check)
- SMS alerts (Twilio) on submission and on status change
- Admin dashboard: department/admin login, complaint queue sorted by `severityRank`, status update

**P1 — Strongly desired:**
- Real AMC CCRS submission via email to `ccrs@ahmedabadcity.gov.in`
- Citizen ticket tracker (status timeline by ticket ID)

---

## Commands

### Development
```bash
# Backend (run from Backend/)
npm run dev          # Start with hot reload — API at http://localhost:3000/api/v1
npm run build        # Compile TypeScript to dist/
npm run start:prod   # Run production build

# Frontend (run from Frontend/)
ng serve             # App at http://localhost:4200

# Full stack with Docker (run from Backend/)
docker-compose up
```

### Testing
```bash
npm test                  # Run all unit tests (*.spec.ts)
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report (80% threshold enforced)
npm run test:debug        # Debug with Node inspector
npm run test:e2e          # End-to-end tests (test/jest-e2e.json)
```

To run a single test file:
```bash
npm run test:debug -- --testPathPattern=auth.service
```

### Database
```bash
npm run seed          # Seed database with initial data (ts-node src/seeds/seed.ts)
```

### MongoDB MCP
A `.mcp.json` at the project root connects Claude Code to the Atlas cluster (`agile_ashram` database) via `mongodb-mcp-server`. This lets Claude query collections directly without running the app.

Collections: `users`, `complaints`, `counters`, `departments`, `wards`

`.mcp.json` is gitignored (contains credentials). Create it locally:
```json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": ["-y", "mongodb-mcp-server"],
      "env": {
        "MDB_MCP_CONNECTION_STRING": "<your DATABASE_URL from Backend/.env>"
      }
    }
  }
}
```
On first load, Claude Code will prompt to approve the `mongodb` MCP server — select **Yes**.

### Code Quality
```bash
npm run lint              # ESLint with auto-fix
npm run lint:check        # ESLint check only
npm run prettier          # Format with Prettier
npm run prettier:check    # Check formatting only
```

---

## Architecture

### Stack
- **Backend:** NestJS 10 + TypeScript 5 on Node.js 22, Mongoose + MongoDB Atlas
- **Frontend:** Angular 17 + Tailwind CSS (separate `Frontend/` directory)
- **AI:** Google Gemini Flash (`gemini-2.5-flash`) via `@google/genai`
- **Auth:** JWT in httpOnly cookies (access + refresh); PBKDF2 password hashing (`src/common/utils/crypto.util.ts`)
- **Image storage:** Cloudflare R2 (presigned URL, client-side upload)
- **SMS:** Twilio

### Module Structure
All feature code lives under `src/modules/`. Modules: `auth`, `user`, `ai`, `department`, `complaint`, `counter`, `upload`, `sms`, `ward`. Each follows the pattern:
```
module.ts → controller.ts → service.ts → repository.ts
```
The repository layer is the only place Mongoose queries are written. Services call repositories; controllers call services.

**Inter-module dependencies in `ComplaintModule`:** imports `AiModule` (validate + suggest + duplicate check), `CounterModule` (ticket IDs), `DepartmentModule` (fallback routing), `SmsModule` (citizen notifications), `UserModule` (role-scoped listing), `WardModule` (GPS-to-ward resolution).

### Global Providers (registered in AppModule)
- **`ResponseInterceptor`** — wraps all responses in `{ message, data, error }` shape
- **`HttpExceptionsFilter`** — catches all errors, integrates Sentry, maps DB constraint errors to readable messages
- **`AuthGuard`** — validates JWT from cookies on all routes; use `@Public()` decorator to exempt a route
- **`RolesGuard`** — enforces `@Roles()` decorator; looks up user from DB by `userId` set by `AuthGuard`
- **`CustomThrottlerGuard`** — rate limiting (10 req/sec default)
- **`TraceMiddleware`** — adds a unique `traceId` to every request via `AsyncLocalStorage`

### Key Utilities & Decorators
- `@Public()` — `src/core/decorators/public.decorator.ts` — marks a route as authentication-exempt
- `@Roles(...roles)` — `src/core/decorators/roles.decorator.ts` — restricts endpoint to specified `UserRole` values
- `@CurrentUser()` — `src/core/decorators/currentUser.decorator.ts` — extracts `{ userId, name }` from JWT payload
- `handleError()` — `src/common/utils/common.util.ts` — standard error throwing pattern used throughout services
- `haversineMeters()` — `src/common/utils/common.util.ts` — great-circle distance for duplicate detection (200m radius)
- `LoggerService` — `src/common/services/logger.service.ts` — structured logging; use instead of `console.log`

### Configuration
Configs use `registerAs` pattern from `@nestjs/config`. Inject via `ConfigService`:
- `app` → `src/config/app.config.ts` (env, port, sentryDsn)
- `database` → `src/config/database.config.ts` (url)
- `jwt` → `src/config/jwt.config.ts` (access/refresh token secrets & expiry)
- `ai` → `src/config/ai.config.ts` (googleGenAiApiKey, googleGenAiModel)
- `cloudflare` → `src/config/cloudflare.config.ts` (R2 credentials)
- `twilio` → `src/config/twilio.config.ts` (SMS credentials)
- `setu` → `src/config/setu.config.ts` (DigiLocker OAuth credentials)

Environment variables are validated at startup via `EnvVariablesDto` (`src/common/dtos/envVariables.dto.ts`). See `Backend/.env.example` for required variables.

---

## NagarVaani Domain Patterns

### User Roles & Auth
- **`citizen`** — DigiLocker login (`digilockerId` + `phone`), files complaints
- **`department`** — email/password + `departmentId`, resolves complaints
- **`admin`** — email/password, oversees everything

All three share the `User` collection; the schema is permissive and auth fields differ per role.

**Auth strategies:** Citizens authenticate via Setu's DigiLocker OAuth (`/auth/digilocker/initiate` → redirect → `/auth/digilocker/complete`). Admin/department staff use email+password (`/auth/admin/login`). Both issue httpOnly cookie pairs (access + refresh). All auth endpoints are `@Public()`.

### Complaint Lifecycle
Statuses: `SUBMITTED → ROUTED → IN_PROGRESS → RESOLVED` (admin can also set `REJECTED`). Each transition appends to `statusHistory` and fires an SMS to the citizen.

**Full intake pipeline (in order):**
1. `validateComplaint()` — Gemini legitimacy gate (rejects spam/irrelevant; checks image quality: public property, context visible, not extreme close-up)
2. `getSuggestedIndustry()` — Gemini routes to department via `responsibilities` array; if confidence is low, `industryId` is `null` → fallback to first department in DB, sets `aiMeta.fallbackUsed = true`
3. `checkDuplicate()` — Gemini checks for nearby complaints within 200m radius in same department (pre-filtered by `haversineMeters`)
4. `WardService.findByPoint()` — resolves GPS coordinates to ward via geospatial point-in-polygon
5. `CounterService.nextTicketId()` — atomic `$inc` on `Counter` collection, formatted as `NV-2026-XXXXXX`
6. Persist — pre-save hook syncs `severityRank` and appends to `statusHistory`; `dueDate` set from `SEVERITY_SLA_DAYS`
7. SMS notification — fire-and-forget, never blocks response

### Complaint Schema — Key Fields
- `ticketId` — human-readable ID (e.g. `NV-2026-000123`), shown to citizens
- `dueDate` (required) — SLA target, calculated from severity: `CRITICAL=1d`, `HIGH=3d`, `MEDIUM=7d`, `LOW=14d`
- `slaStatus` (virtual, read-only) — `ON_TRACK | DUE_SOON | OVERDUE | CLOSED`, computed on read
- `severityRank` (1–4) — numeric mirror of `severity` string for sorting; kept in sync by pre-save hook — **never set manually**
- `gps` — `{ lat, lng }` captured from browser Geolocation API
- `geoVerified` / `geoDistanceMeters` — result of Nominatim reverse-geocode cross-check
- `aiMeta` — `{ model, confidence, rawLabel?, fallbackUsed }`
- `feedback` — `ComplaintFeedback` subdocument: `{ rating (1–5), comment?, submittedAt }`
- `resolutionNote` — `ResolutionNote` subdocument: `{ comment (required), imageUrl? }`
- `resolvedBy` / `resolvedAt` — populated when status changes to `RESOLVED`
- `statusHistory` — array of `StatusHistoryEntry`; each entry includes `departmentName`, `fromDepartmentName`, `toDepartmentName` for reassignment context
- `amcSubmitted` — P1 flag for AMC CCRS email submission

### Complaint List & Sorting
- `GET /complaints` filters by role automatically — citizen sees own, department sees theirs, admin sees all
- Sorting: `dueDate` asc → `severityRank` desc → `createdAt` desc
- Work queue index: `{ status, severityRank: -1, createdAt: -1 }` on `complaints` collection

### Department-Scoped Mutations
`PATCH /complaints/:id/status` and `PATCH /complaints/:id/department` require `DEPARTMENT`/`ADMIN` roles. Department staff can only act on complaints assigned to their own department — enforced in the service layer, not just the guard. Resolving (status=`RESOLVED`) requires a `resolutionNote.comment`.

### Citizen Feedback
- `POST /complaints/:id/feedback` — citizen only, complaint must be `RESOLVED`, one submission per complaint
- `SubmitFeedbackDto`: `rating` (1–5, required), `comment` (optional)

### Ward Module
- Stores GeoJSON polygon boundaries for each ward in `src/modules/ward/data/`
- `WardService.findByPoint(lat, lng)` runs `$geoIntersects` to resolve GPS to a ward
- `wards` collection has a `2dsphere` index on the boundary field

### AI Module
All AI endpoints (`/api/v1/ai/*`) are `@Public()`. Three operations via Gemini Flash:
- `validateComplaint()` — legitimacy + image quality check
- `getSuggestedIndustry()` — department routing from complaint text + department `responsibilities`
- `checkDuplicate()` — near-duplicate detection (called after haversine pre-filter)

### Upload Flow
Frontend calls `POST /upload/presigned-url` → receives a 15-minute Cloudflare R2 presigned URL → uploads directly from browser → passes `imageUrl` in complaint payload. Filename is sanitized + UUID-prefixed before signing.

### Ticket IDs
`Counter` collection: `findOneAndUpdate({ key: 'complaint-2026' }, { $inc: { seq: 1 } }, { upsert: true, new: true })`, formatted as `NV-2026-XXXXXX` (6-digit zero-padded). Prevents duplicate IDs under concurrent load.

---

## API Conventions
- All routes versioned under `/api/v1/` (except `/api/health-check`)
- Swagger docs at `/docs` (disabled in production)
- All responses use `ResponseResult` class (`src/core/class/response.class.ts`) — shape: `{ message, data, error }`
- i18n messages in `src/i18n/en/` JSON files; use `nestjs-i18n` `I18nService` for translations
- Commit messages must follow commitlint: `type(scope): message` — valid types: `feat, fix, docs, style, refactor, test, chore, perf, revert, ci`
