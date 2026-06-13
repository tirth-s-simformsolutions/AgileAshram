# NestJS Boilerplate 🚀

[![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-%2347A248.svg?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/mongoose-%2340A9E8.svg?style=for-the-badge&logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![Swagger](https://img.shields.io/badge/-Swagger-%23Clojure?style=for-the-badge&logo=swagger&logoColor=white)](https://swagger.io/)

A **production-ready**, **enterprise-grade** NestJS boilerplate with MongoDB (Mongoose), JWT authentication, and comprehensive API documentation. This project provides a **solid foundation** for building modern, scalable backend applications with TypeScript.

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

| Tool        | Minimum Version | Download Link                                                      |
| ----------- | --------------- | ------------------------------------------------------------------ |
| **Node.js** | `v22+`          | [Download Node.js](https://nodejs.org/)                            |
| **MongoDB** | `v6+`           | [Download MongoDB](https://www.mongodb.com/try/download/community) |
| **npm**     | `v10.9.2+`      | Comes with Node.js                                                 |

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
# Start MongoDB with Docker
docker-compose up -d mongo
```

### 4. Seed Initial Data (Optional)

```bash
npm run seed
```

This will create an admin user in your database if it does not exist.

### 4. Start Development 🚀

```bash
npm run dev
```

### 🎉 You're Ready!

Your application is now running! Here are the key endpoints:

| Service          | URL                                 | Description            |
| ---------------- | ----------------------------------- | ---------------------- |
| **API Server**   | http://localhost:3000               | Main application       |
| **API Docs**     | http://localhost:3000/docs          | Interactive Swagger UI |
| **Health Check** | http://localhost:3000/api/v1/health | System status          |

---

## Requirements

**Essential Requirements:**

| Tool                                    | Version   | Purpose            | Installation                                               |
| --------------------------------------- | --------- | ------------------ | ---------------------------------------------------------- |
| **[Node.js](https://nodejs.org/)**      | v22.15.0+ | JavaScript runtime | [Download](https://nodejs.org/en/download)                 |
| **[MongoDB](https://www.mongodb.com/)** | v6+       | Database           | [Download](https://www.mongodb.com/try/download/community) |
| **[npm](https://www.npmjs.com/)**       | v10.9.2+  | Package manager    | Comes with Node.js                                         |

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

### 🗄️ **Database & ODM**

- **MongoDB** - Modern NoSQL database
- **Mongoose ODM** - Elegant MongoDB object modeling for Node.js

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
│   ├── 📂 seeds/                         # MongoDB seeding scripts
│   │   ├── seed.ts                       # MongoDB seeder script
│   │
│   ├── 📂 i18n/                          # 🌐 Internationalization
│   │   └── 📂 en/                        # English translations
│   │       ├── error.json                # error messages
│   │
│   ├── 📂 modules/                             # 🧩 Feature modules
│   │   └── 📂 feature/                         # Example feature module
│   │       ├── 📂 dtos/                        # Feature-specific DTOs
│   │       ├── 📂 interfaces/                  # Feature interfaces
│   │       ├── 📂 messages/                    # Feature messages
│   │       ├── 📂 schemas/                     # Mongoose schemas (e.g., feature.schema.ts)
│   │       ├── feature.controller.ts           # Feature endpoints
│   │       ├── feature.controller.spec.ts      # Feature endpoints tests
│   │       ├── feature.service.ts              # Feature business logic
│   │       ├── feature.service.spec.ts         # Feature business logic tests
│   │       ├── feature.repository.ts           # Feature repository (Mongoose ODM)
│   │       ├── feature.repository.spec.ts      # Feature repository tests
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

### MongoDB/Mongoose Commands 🔧

```bash
# Start MongoDB (if not running)
docker-compose up -d mongo

# Optional: Seed database with initial data
npm run seed
```

This will create an admin user in your database if it does not exist.

## Database Setup

### 1. Start MongoDB

You can use Docker or install MongoDB locally.

#### Using Docker

```bash
docker-compose up -d mongo
```

#### Local Installation

Install [MongoDB](https://www.mongodb.com/try/download/community) and start the service.

### 2. Set Environment Variables

Update `.env`:

```
DATABASE_URL=mongodb://localhost:27017/nestjs_boilerplate
```

**What's included:**

- ✅ **MongoDB database** (with persistent volume)
- ✅ **NestJS application** (with hot reload)
- ✅ **Network configuration** (services can communicate)

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
| `npm run start:prod`     | 🚀 **Start** production server     | Production        |
| `npm run lint`           | 🧹 **Fix** ESLint issues           | Code cleanup      |
| `npm run lint:check`     | 👀 **Check** lint issues           | CI/CD             |
| `npm run prettier`       | 💅 **Format** code with Prettier   | Code formatting   |
| `npm run prettier:check` | 👀 **Check** code formatting       | CI/CD             |

> **Note**: Before running the production server, build the project using `npm run build`. This compiles TypeScript to JavaScript in the `dist/` folder.

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
// Example: Mocking Mongoose model in unit tests
const mockUserModel = {
  create: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
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

- ✅ **MongoDB database** (with persistent volume)
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

| Command                            | Description                  |
| ---------------------------------- | ---------------------------- |
| `docker-compose up`                | Start all services           |
| `docker-compose up -d`             | Start services in background |
| `docker-compose down`              | Stop and remove containers   |
| `docker-compose logs backend`      | View app logs                |
| `docker-compose exec backend bash` | Access app container         |
| `docker-compose exec mongo mongo`  | Access MongoDB               |

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
