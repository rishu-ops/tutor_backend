# project-tutor (tutor_backend)

A production-grade, highly scalable backend monorepo setup for **project-tutor**, engineered with modern Node.js, Express, TypeScript, Prisma, PostgreSQL, MongoDB, and Redis.

---

## 📁 Repository Structure

```
project-tutor/
├── apps/
│   └── api/                # Express API application
├── packages/
│   ├── config/             # Shared linting/typescript configurations
│   ├── database/           # Core database connections (Prisma + ioredis + Mongoose)
│   ├── logger/             # Shared Pino logger
│   ├── shared/             # Shared validations, schemas, and models
│   ├── types/              # Monorepo type declarations
│   └── utils/              # Common utility functions
├── docs/                   # Architectural & design documentation
├── docker/                 # Container infrastructure files
└── scripts/                # Build & deployment orchestration scripts
```

---

## 🛠️ Tech Stack & Tooling

- **Runtime**: Node.js (v22+)
- **Package Manager**: `pnpm`
- **API Framework**: Express
- **Databases**: PostgreSQL (via Prisma), MongoDB (via Mongoose), Redis (via ioredis)
- **Language**: TypeScript (ESModules, NodeNext resolution)
- **Code Quality**: ESLint (Flat Config), Prettier, Husky, lint-staged
- **API Docs**: Swagger UI (`/api/docs`)
- **Logging**: Pino & `pino-pretty`

---

## 🚀 Quick Start

### 1. Prerequisite: Boot Databases via Docker

Ensure Docker Desktop is open and running, then execute:

```bash
docker-compose up -d
```

This spins up:

- PostgreSQL on port `5433`
- MongoDB on port `27017`
- Redis on port `6379`

### 2. Install Workspace Dependencies

```bash
npx pnpm install
```

### 3. Sync Database Schemas

Runs migrations on the PostgreSQL instance and generates local client wrappers:

```bash
npx pnpm --filter database exec prisma db push
```

### 4. Build Monorepo Packages

```bash
npx pnpm build
```

### 5. Launch the Development API Server

```bash
npx pnpm --filter api dev
```

---

## 🔒 Verification Endpoints

- **Health Checks**: [http://localhost:3000/health](http://localhost:3000/health)
- **Swagger Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
