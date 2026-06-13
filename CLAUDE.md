# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start with hot reload
npm run build        # Compile TypeScript to dist/
npm run start:prod   # Run production build
```

### Testing
```bash
npm test                  # Run all unit tests (*.spec.ts)
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report (80% threshold enforced)
npm run test:debug        # Debug with Node inspector (use to run a single test file)
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

Collections: `users`, `complaints`, `counters`, `departments`

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

## Architecture

### Framework & Stack
- **NestJS 10** + **TypeScript 5** on Node.js 22
- **Mongoose** + **MongoDB** (schemas defined via `@Schema()` decorators in `src/modules/*/schemas/`)
- **JWT authentication** stored in httpOnly cookies (access + refresh token pattern)
- **Password hashing**: PBKDF2 (100,000 iterations, SHA-512) via `src/common/utils/crypto.util.ts`

### Module Structure
All feature code lives under `src/modules/`. Modules: `auth`, `user`, `ai`, `department`, `complaint`, `counter`, `upload`, `sms`. Each module follows the pattern:
```
module.ts → controller.ts → service.ts → repository.ts
```
The repository layer is the only place Mongoose queries are written. Services call repositories; controllers call services.

**Inter-module dependencies in `ComplaintModule`:** imports `AiModule` (validate + suggest), `CounterModule` (ticket IDs), `DepartmentModule` (fallback routing), `SmsModule` (citizen notifications), `UserModule` (role-scoped listing).

### Global Providers (registered in AppModule)
These apply to every request automatically:
- **`ResponseInterceptor`** — wraps all responses in `{ message, data, error }` shape
- **`HttpExceptionsFilter`** — catches all errors, integrates Sentry, maps DB constraint errors to readable messages
- **`AuthGuard`** — validates JWT from cookies on all routes; use `@Public()` decorator to exempt a route
- **`RolesGuard`** — enforces `@Roles()` decorator; looks up user from DB by `userId` set by `AuthGuard`
- **`CustomThrottlerGuard`** — rate limiting (10 req/sec default)
- **`TraceMiddleware`** — adds a unique `traceId` to every request via `AsyncLocalStorage`

### Key Utilities & Decorators
- `@Public()` — `src/core/decorators/public.decorator.ts` — marks a route as authentication-exempt
- `@Roles(...roles)` — `src/core/decorators/roles.decorator.ts` — restricts endpoint to specified `UserRole` values; enforced by `RolesGuard`
- `@CurrentUser()` — `src/core/decorators/currentUser.decorator.ts` — extracts `{ userId, name }` from the JWT payload
- `handleError()` — `src/common/utils/common.util.ts` — standard error throwing pattern used throughout services
- `LoggerService` — `src/common/services/logger.service.ts` — structured logging; use instead of `console.log`

### Configuration
Configs use `registerAs` pattern from `@nestjs/config`. Inject via `ConfigService`:
- `app` → `src/config/app.config.ts` (env, port, sentryDsn)
- `database` → `src/config/database.config.ts` (url)
- `jwt` → `src/config/jwt.config.ts` (access/refresh token secrets & expiry)
- `ai` → `src/config/ai.config.ts` (googleGenAiApiKey, googleGenAiModel)
- `cloudflare` → `src/config/cloudflare.config.ts` (R2 credentials for upload)
- `twilio` → `src/config/twilio.config.ts` (SMS credentials)
- `setu` → `src/config/setu.config.ts` (DigiLocker OAuth credentials)

Environment variables are validated at startup via `EnvVariablesDto` (`src/common/dtos/envVariables.dto.ts`). See `.env.example` for required variables.

### NagarVaani Domain Patterns

- **User roles**: `citizen` (DigiLocker login — `digilockerId` + `phone`), `department` (email/password + `departmentId`), `admin` (email/password). All share the `User` collection; the schema is permissive and auth fields differ per role.
- **Auth strategies**: Citizens authenticate via Setu's DigiLocker OAuth (`/auth/digilocker/initiate` → redirect → `/auth/digilocker/complete`). Admin/department staff use email+password (`/auth/admin/login`). Both issue httpOnly cookie pairs (access + refresh). All auth endpoints are `@Public()`.
- **Complaint routing**: AI (`AiService.getSuggestedIndustry`) reads each department's `responsibilities` array and picks the best-fit department. There is no hardcoded category map. If confidence is low, `industryId` is `null` — fall back to the first department in the DB and set `aiMeta.fallbackUsed = true`.
- **Complaint creation flow**: `validateComplaint()` (legitimacy gate) → `getSuggestedIndustry()` (AI routing) → `CounterService.nextTicketId()` (atomic ticket) → persist → SMS notification (fire-and-forget, never blocks response).
- **Complaint list scoping**: The same `GET /complaints` endpoint filters by role — citizen sees only their own, department sees only their department's, admin sees all. Sorting: `dueDate` asc, `severityRank` desc, `createdAt` desc.
- **Department-scoped mutations**: `PATCH /complaints/:id/status` and `PATCH /complaints/:id/department` are restricted to `DEPARTMENT`/`ADMIN` roles; department staff can only act on complaints assigned to their own department (enforced in the service, not just the guard).
- **Severity sorting**: The work queue sorts on `severityRank` (1–4), not the `severity` string (which sorts alphabetically). A pre-save hook on `ComplaintSchema` keeps `severityRank` in sync with `severity` automatically — never set one without the other.
- **Ticket IDs**: Generated via `Counter` collection with atomic `$inc` (`findOneAndUpdate({ key: 'complaint-2026' }, { $inc: { seq: 1 } }, { upsert: true, new: true })`), then formatted as `NV-2026-XXXXXX` (6-digit zero-padded). This prevents duplicate IDs under concurrent load.
- **AI endpoints** (`/api/v1/ai/*`) are `@Public()` — no JWT required. They are called by the frontend before submission and also internally by the complaint pipeline.
- **Upload flow**: Frontend calls `UploadService` to get a Cloudflare R2 presigned URL, uploads directly from the browser, then passes the resulting `imageUrl` to the complaint payload.
- **Work queue index**: Composite index `{ status, severityRank: -1, createdAt: -1 }` on the `complaints` collection enables efficient department dashboard queries.

### API Conventions
- All routes are versioned under `/api/v1/` (except `/api/health-check`)
- Swagger docs available at `/docs` (disabled in production)
- Responses always use the `ResponseResult` class (`src/core/class/response.class.ts`)
- i18n messages are in `src/i18n/en/` JSON files; use `nestjs-i18n` `I18nService` for translations
- Commit messages must follow commitlint: `type(scope): message` — valid types: `feat, fix, docs, style, refactor, test, chore, perf, revert, ci`
