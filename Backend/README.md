# NestJS Boilerplate 🚀

[![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Swagger](https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white)](https://swagger.io/)

A **production-ready**, **enterprise-grade** NestJS boilerplate with PostgreSQL, Prisma ORM, JWT authentication, and comprehensive API documentation. This project provides a **solid foundation** for building modern, scalable backend applications with TypeScript.

## Table of Contents

- [Quick Start](#quick-start)
- [Requirements](#requirements)
- [Features](#features)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Development](#development)
- [Testing](#testing)
- [Docker Setup](#docker-setup)
- [License](#license)

## Quick Start

> **Perfect for developers who want to get up and running fast!**

### Prerequisites Check ✅

Ensure you have these installed:

| Tool           | Minimum Version | Download Link                                               |
| -------------- | --------------- | ----------------------------------------------------------- |
| **Node.js**    | `v22+`          | [Download Node.js](https://nodejs.org/)                     |
| **PostgreSQL** | `v15+`          | [Download PostgreSQL](https://www.postgresql.org/download/) |
| **npm**        | `v10.9.2+`      | Comes with Node.js                                          |

> **💡 Pro Tip**: Use [Volta](https://volta.sh/) for Node.js version management to automatically switch between Node versions in different projects.

### 1. Clone & Install 📦

```bash
git clone <repository-url>
cd nestjs-boilerplate
npm install
```

### 2. Setup Environment 🔧

```bash
# Copy the example environment file
cp .env.example .env
```

Update `.env` with your database credentials and JWT secrets.

### 3. Database Setup 🗄️

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Optional: Seed with test data
npm run db:seed
```

### 4. Start Development 🚀

```bash
npm run dev
```

### 🎉 You're Ready!

Your application is now running! Here are the key endpoints:

| Service             | URL                                 | Description            |
| ------------------- | ----------------------------------- | ---------------------- |
| **API Server**      | http://localhost:3000               | Main application       |
| **API Docs**        | http://localhost:3000/docs          | Interactive Swagger UI |
| **Health Check**    | http://localhost:3000/api/v1/health | System status          |
| **Database Studio** | `npm run prisma:studio`             | Visual DB explorer     |

---

## Requirements

**Essential Requirements:**

| Tool                                          | Version   | Purpose            | Installation                                     |
| --------------------------------------------- | --------- | ------------------ | ------------------------------------------------ |
| **[Node.js](https://nodejs.org/)**            | v22.15.0+ | JavaScript runtime | [Download](https://nodejs.org/en/download)       |
| **[PostgreSQL](https://www.postgresql.org/)** | v15+      | Database           | [Download](https://www.postgresql.org/download/) |
| **[npm](https://www.npmjs.com/)**             | v10.9.2+  | Package manager    | Comes with Node.js                               |

**Recommended Tools:**

| Tool                                  | Purpose                    | Why We Recommend                             |
| ------------------------------------- | -------------------------- | -------------------------------------------- |
| **[Volta](https://volta.sh/)**        | Node.js version management | Automatically uses correct Node/npm versions |
| **[Docker](https://www.docker.com/)** | Containerization           | Easy deployment and consistent environments  |

## Features

### 🏗️ **Core Framework**

- **NestJS** - Progressive Node.js framework with TypeScript
- **Express.js** - Fast, unopinionated web framework
- **TypeScript** - Type-safe development experience
- **Internationalization** - Multi-language support with i18n

### 🗄️ **Database & ORM**

- **PostgreSQL** - Robust relational database
- **Prisma ORM** - Type-safe database client with migrations
- **Database Seeding** - Pre-populated test data for development

### 🔐 **Authentication & Security**

- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Cookie-based Auth** - HttpOnly, secure cookie storage
- **Password Hashing** - PBKDF2 with salt for secure password storage
- **Rate Limiting** - Built-in request throttling
- **CORS & Helmet** - Security headers and cross-origin protection

### 📚 **API Documentation**

- **Swagger/OpenAPI** - Interactive API documentation
- **Auto-generated Docs** - Documentation from decorators
- **API Versioning** - Built-in API version management

### 🧪 **Testing & Quality**

- **Jest Testing** - Unit tests with comprehensive coverage
- **Test Coverage** - Coverage reports and thresholds
- **ESLint & Prettier** - Code formatting and linting
- **Husky & lint-staged** - Pre-commit hooks

### 📊 **Monitoring & Logging**

- **Health Checks** - Application and database health monitoring
- **Request Tracing** - Unique trace IDs for each request
- **Structured Logging** - Consistent log formatting
- **Sentry Integration** - Error tracking and monitoring

### 🛠️ **Developer Experience**

- **Hot Reload** - Instant development feedback
- **Environment Configuration** - Flexible env management with validation
- **Database Studio** - Visual database explorer
- **Docker Support** - Containerized development and deployment

## Project Structure

```
nestjs-boilerplate/
├── 📄 README.md                          # You are here!
├── 📄 package.json                       # Dependencies and scripts
├── 📄 .env.example                       # Environment variables template
├── 📄 docker-compose.yml                 # Docker setup for local development
│
├── 📂 src/                               # 🎯 Main application source code
│   ├── 📂 app/                           # Application module (entry point)
│   │   ├── app.controller.ts             # Health check endpoints
│   │   ├── app.module.ts                 # Root application module
│   │   └── app.controller.spec.ts        # Controller tests
│   │
│   ├── 📂 common/                        # 🔧 Shared utilities and components
│   │   ├── 📂 constants/                 # Application constants
│   │   ├── 📂 dtos/                      # Data Transfer Objects
│   │   ├── 📂 interfaces/                # TypeScript interfaces
│   │   ├── 📂 messages/                  # Error/success messages
│   │   ├── 📂 services/                  # Shared services (health, logger)
│   │   └── 📂 utils/                     # Utility functions (crypto, common)
│   │
│   ├── 📂 config/                        # ⚙️ Configuration modules
│   │   ├── app.config.ts                 # App-level configuration
│   │   ├── database.config.ts            # Database configuration
│   │   └── jwt.config.ts                 # JWT configuration
│   │
│   ├── 📂 core/                          # 🎛️ Core application features
│   │   ├── 📂 class/                     # Base classes (ResponseResult)
│   │   ├── 📂 decorators/                # Custom decorators (@CurrentUser, @Public)
│   │   ├── 📂 guards/                    # Route guards (AuthGuard, ThrottlerGuard)
│   │   ├── 📂 interceptors/              # Request/response interceptors
│   │   ├── 📂 interfaces/                # Core interfaces
│   │   └── 📂 middleware/                # Custom middleware (TraceMiddleware)
│   │
│   ├── 📂 database/                      # 🗄️ Database configuration
│   │   ├── 📂 migrations/                # Prisma migration files
│   │   ├── schema.prisma                 # Database schema definition
│   │   ├── prisma.service.ts             # Prisma service provider
│   │   └── seed.ts                       # Database seeding script
│   │
│   ├── 📂 i18n/                          # 🌐 Internationalization
│   │   └── 📂 en/                        # English translations
│   │       ├── error.json                # error messages
│   │
│   ├── 📂 modules/                             # 🧩 Feature modules
│   │   └── 📂 feature/                         # Feature module
│   │       ├── 📂 dtos/                        # Feature-specific DTOs
│   │       ├── 📂 interfaces/                  # Feature interfaces
│   │       ├── 📂 messages/                    # Feature messages
│   │       ├── feature.controller.ts           # Feature endpoints
│   │       ├── feature.controller.spec.ts      # Feature endpoints tests
│   │       ├── feature.service.ts              # Feature business logic
│   │       ├── feature.service.spec.ts         # Feature business logic tests
│   │       ├── feature.repository.ts           # Feature specifice repository
│   │       ├── feature.repository.spec.ts      # Feature specifice repository tests
│   │       ├── feature.module.ts               # Feature module
│   │       └── feature.constant.ts             # Feature-specific constants
│   │
│   └── main.ts                           # 🚀 Application entry point
│
├── 📂 test/                              # 🧪 Test configuration and utilities
│   ├── app.e2e-spec.ts                   # End-to-end tests
│   ├── helpers.ts                        # Test helper functions
│   ├── jest-e2e.json                     # E2E test configuration
│   └── setup.ts                          # Test setup and global mocks
│
├── 📄 .eslintrc.js                       # ESLint configuration
├── 📄 .prettierrc                        # Prettier configuration
├── 📄 commitlint.config.js               # Commit message linting
├── 📄 jest.config.js                     # Jest testing configuration
├── 📄 tsconfig.json                      # TypeScript configuration
├── 📄 tsconfig.build.json                # Build-specific TypeScript config
├── 📄 nest-cli.json                      # NestJS CLI configuration
├── 📄 Dockerfile                         # Production Docker image
├── 📄 Dockerfile.dev                     # Development Docker image
└── 📄 LICENSE                            # License information
```

## Database Setup

### Prisma Commands 🔧

```bash
# Generate Prisma client from schema
npm run prisma:generate

# Run database migrations (creates tables)
npm run prisma:migrate

# Optional: Seed database with test data
npm run db:seed

# Open Prisma Studio (visual database browser)
npm run prisma:studio
```

### Verify Setup ✅

Check if the application is running correctly by visiting the health endpoint at `/api/v1/health`.

### Available Database Commands 📊

| Command                   | Description                          | Use Case              |
| ------------------------- | ------------------------------------ | --------------------- |
| `npm run prisma:generate` | Generate Prisma client               | After schema changes  |
| `npm run prisma:migrate`  | Create and apply migration           | Schema updates        |
| `npm run prisma:deploy`   | Deploy migrations (production)       | Production deployment |
| `npm run prisma:studio`   | Open database GUI                    | Data exploration      |
| `npm run db:reset`        | ⚠️ Reset database (deletes all data) | Development reset     |
| `npm run db:seed`         | Seed with test data                  | Development setup     |

### Working with Migrations 🔄

<details>
<summary><strong>Creating New Migrations</strong></summary>

1. **Update schema**: Edit `src/database/schema.prisma`
2. **Generate migration**:
   ```bash
   npm run prisma:migrate
   # Follow the prompts to name your migration
   ```
3. **Review migration**: Check the generated SQL in `src/database/migrations/`

</details>

### Production Database 🚀

For production deployments:

```bash
# Deploy migrations without prompts
npm run prisma:deploy

# Generate client for production
npm run prisma:generate
```

## Development

### Start Development Server 🚀

```bash
# Start with hot reload
npm run dev
```

The application will start on `http://localhost:3000` (or your configured PORT).

### Available Scripts 📜

| Script                   | Description                        | Use Case          |
| ------------------------ | ---------------------------------- | ----------------- |
| `npm run dev`            | 🔥 **Development** with hot reload | Daily development |
| `npm run build`          | 🏗️ **Build** for production        | Pre-deployment    |
| `npm run start`          | 🚀 **Start** production server     | Production        |
| `npm run lint`           | 🧹 **Fix** ESLint issues           | Code cleanup      |
| `npm run lint:check`     | 👀 **Check** lint issues           | CI/CD             |
| `npm run prettier`       | 💅 **Format** code with Prettier   | Code formatting   |
| `npm run prettier:check` | 👀 **Check** code formatting       | CI/CD             |

> **Tip**: For database commands, see the [Database Setup](#database-setup) section above.

## Testing

### Quick Test Commands 🚀

```bash
# Run all unit tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode (for development)
npm run test:watch
```

### Writing Tests ✍️

The project follows standard Jest testing patterns with proper TypeScript support and mocking. All tests are unit tests that focus on testing individual components in isolation.

### Testing Best Practices ✅

1. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
2. **Mocking**: Mock external dependencies and services
3. **Data**: Use factory functions for test data
4. **Isolation**: Each test should be independent
5. **Coverage**: Aim for meaningful test coverage, not just numbers

### Test Configuration ⚙️

The project uses Jest with TypeScript support and comprehensive coverage thresholds for unit testing.

### Test Database 🗄️

For unit tests, the project uses mocked database services to ensure tests run quickly and don't require a real database connection.

```typescript
// Example: Mocking Prisma service in unit tests
const mockPrismaService = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};
```

## Docker Setup

### Development with Docker 🛠️

Run the entire stack (app + database) with Docker Compose:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**What's included:**

- ✅ **PostgreSQL database** (with persistent volume)
- ✅ **NestJS application** (with hot reload)
- ✅ **Network configuration** (services can communicate)

### Production Docker Image 🚀

Build optimized production image:

```bash
# Build production image
docker build -t nestjs-app .

# Run production container
docker run -p 3000:3000 \
  -e DATABASE_URL="your_production_db_url" \
  -e JWT_ACCESS_SECRET_KEY="your_secret" \
  nestjs-app
```

### Docker Commands 🐳

| Command                                         | Description                  |
| ----------------------------------------------- | ---------------------------- |
| `docker-compose up`                             | Start all services           |
| `docker-compose up -d`                          | Start services in background |
| `docker-compose down`                           | Stop and remove containers   |
| `docker-compose logs backend`                   | View app logs                |
| `docker-compose exec backend bash`              | Access app container         |
| `docker-compose exec postgres psql -U postgres` | Access database              |

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
