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
All feature code lives under `src/modules/`. Currently: `auth` and `user`. Each module follows the pattern:
```
module.ts → controller.ts → service.ts → repository.ts
```
The repository layer is the only place Mongoose queries are written. Services call repositories; controllers call services.

### Global Providers (registered in AppModule)
These apply to every request automatically:
- **`ResponseInterceptor`** — wraps all responses in `{ message, data, error }` shape
- **`HttpExceptionsFilter`** — catches all errors, integrates Sentry, maps DB constraint errors to readable messages
- **`AuthGuard`** — validates JWT from cookies on all routes; use `@Public()` decorator to exempt a route
- **`CustomThrottlerGuard`** — rate limiting (10 req/sec default)
- **`TraceMiddleware`** — adds a unique `traceId` to every request via `AsyncLocalStorage`

### Key Utilities & Decorators
- `@Public()` — `src/core/decorators/public.decorator.ts` — marks a route as authentication-exempt
- `@CurrentUser()` — `src/core/decorators/currentUser.decorator.ts` — extracts `userId` and `name` from the JWT payload
- `handleError()` — `src/common/utils/common.util.ts` — standard error throwing pattern used throughout services
- `LoggerService` — `src/common/services/logger.service.ts` — structured logging; use instead of `console.log`

### Configuration
Configs use `registerAs` pattern from `@nestjs/config`. Inject via `ConfigService`:
- `app` → `src/config/app.config.ts` (env, port, sentryDsn)
- `database` → `src/config/database.config.ts` (url)
- `jwt` → `src/config/jwt.config.ts` (access/refresh token secrets & expiry)

Environment variables are validated at startup via `EnvVariablesDto` (`src/common/dtos/envVariables.dto.ts`). See `.env.example` for required variables.

### API Conventions
- All routes are versioned under `/api/v1/` (except `/api/health-check`)
- Swagger docs available at `/docs` (disabled in production)
- Responses always use the `ResponseResult` class (`src/core/class/response.class.ts`)
- i18n messages are in `src/i18n/en/` JSON files; use `nestjs-i18n` `I18nService` for translations
- Commit messages must follow commitlint: `type(scope): message` — valid types: `feat, fix, docs, style, refactor, test, chore, perf, revert, ci`
