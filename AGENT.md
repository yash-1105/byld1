# AGENT.md — BYLD Project Context

## Project
BYLD — construction/architecture project management platform.

## Repo Structure
Monorepo. Frontend and backend live side by side at the repo root.
byld/
├── frontend/          # React 18 + TypeScript + Vite (exists, prototype)
├── backend/           # Python + FastAPI (being built)
├── docker-compose.yml
├── AGENT.md
└── README.md

## Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind, shadcn/ui, React Query, react-hook-form, zod, react-router-dom
- **Backend:** Python 3.12+, FastAPI, SQLAlchemy 2.x, Alembic, Pydantic v2
- **Database:** PostgreSQL 15+ (Docker locally)
- **Storage:** S3 or Cloudflare R2 (presigned URL uploads)
- **Optional:** Redis for caching/jobs later

## Team
- **Y** — Workflow lane: projects, stages, tasks, approvals, activity log, dashboard, RBAC, notifications
- **R** — Operations lane: site updates, logbook, documents, contracts, budget, milestones, AI summaries, AI document search

## Conventions

### Backend
- Python package: `app/`
- FastAPI app in `app/main.py`
- Config via pydantic-settings in `app/config.py`, reads from `.env`
- DB models in `app/db/models/` — one file per domain (e.g., `user.py`, `project.py`, `task.py`)
- All models inherit from `app/db/base.py` Base class
- Pydantic schemas in `app/schemas/` — one file per domain
- API routes in `app/api/` — one file per domain, mounted as routers
- Shared dependencies (get_db, get_current_user) in `app/api/deps.py`
- Services/business logic in `app/services/`
- All IDs are UUID
- All timestamps are UTC
- API prefix: `/api/v1`
- Response envelope: `{ "success": true, "data": {}, "meta": {} }`
- Error envelope: `{ "success": false, "data": null, "error": { "code": "...", "message": "..." } }`
- Alembic for migrations, config in `backend/alembic/`
- Tests in `backend/tests/` using pytest

### Frontend
- Source in `frontend/src/`
- API client in `frontend/src/api/client.ts` — axios instance with auth interceptor
- API endpoint functions in `frontend/src/api/` — one file per domain (e.g., `projects.ts`, `tasks.ts`)
- React Query hooks in `frontend/src/hooks/` — wrapping API calls
- All data fetching goes through React Query — no more DataContext for server data
- Auth context remains for current user state but talks to real backend
- Environment variables prefixed with `VITE_`

### Enums (shared source of truth)
```python
# Roles
class UserRole(str, Enum):
    ARCHITECT = "architect"
    CONTRACTOR = "contractor"
    CLIENT = "client"
    CONSULTANT = "consultant"

# Task statuses
class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    DONE = "done"
    CANCELLED = "cancelled"

# Approval statuses
class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"

# Payment milestone statuses
class MilestoneStatus(str, Enum):
    UPCOMING = "upcoming"
    DUE = "due"
    PAID = "paid"
    OVERDUE = "overdue"

# Contract statuses
class ContractStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    COMPLETED = "completed"
    TERMINATED = "terminated"

# Change order statuses
class ChangeOrderStatus(str, Enum):
    PROPOSED = "proposed"
    APPROVED = "approved"
    REJECTED = "rejected"
    IMPLEMENTED = "implemented"
```

### Schema Rules
- All tables use UUID primary keys (server-generated)
- All tables have `created_at` and `updated_at` (UTC)
- All major records are project-scoped (have `project_id` FK)
- File references store object storage keys, never embedded binary
- Soft deletes where appropriate (is_deleted flag or deleted_at timestamp)

## Current State Log
<!-- Both agents update this section after completing work -->

### Completed
- [x] AGENT.md created
- [x] Frontend moved into `frontend/` subdirectory
- [x] ESLint errors and warnings fixed (0 errors, 0 warnings)
- [x] `docker-compose.yml` created (postgres:15, redis:7) + `.env.example`
- [x] Backend scaffolded (`backend/app/` with config, main, db, schemas, api, services, security, storage, workers)
- [x] Alembic initialized with async engine + `Base.metadata` wired to `settings.DATABASE_URL`
- [x] SQLAlchemy models drafted — 19 tables across 9 domain files + `enums.py`
- [x] Frontend API client layer — `api/client.ts` (axios + auth interceptors + envelope unwrap), `api/auth.ts`, `api/index.ts`
- [x] Full verification pass — all checks green (docker, backend health, frontend build + lint)
- [x] Full system audit completed and written to `SYSTEM_AUDIT.md`
- [x] Backend schema stabilized: enum drift fixed, timestamp conventions aligned, FK indexes added, bidirectional relationships completed, FK nullability/type hints normalized
- [x] Security layer implemented: password hashing, JWT access/refresh tokens, token decode, current-user dependencies, and consistent auth error handling
- [x] Auth API implemented and wired under `/api/v1/auth` with frontend-compatible register/login/refresh/me/logout endpoints
- [x] Initial Alembic migration generated and applied to Postgres (`alembic upgrade head`)
- [x] Backend test suite added and passing (`pytest -v` → 9 passed)
- [x] Env handling cleaned up: repo-root `.env.example` removed, `backend/.env` gitignored, backend env example remains source of truth
- [x] Post-stabilization full system audit rerun completed; `SYSTEM_AUDIT.md` refreshed with current verification results, API surface, model inventory, config state, and remaining gaps

### In Progress
- (none)

### Blocked
- (none)

### Verification Status (2026-04-08)
- **Docker:** `docker compose up -d` starts `postgres:15` and `redis:7`; Postgres responds to `pg_isready` ✓
- **Backend boot:** `app.main` imports cleanly; `/api/v1/health` returns the documented success envelope with `meta`
- **Alembic:** initial revision generated and `alembic upgrade head` applied successfully; Postgres now has all expected tables
- **Backend tests:** `pytest -v` passes (9/9) ✓
- **Frontend build:** `npm run build` succeeds (chunk size warning on index bundle only) ✓
- **Frontend lint:** `npm run lint` passes cleanly ✓
- **Frontend tests:** `npm run test` passes (1/1) ✓
- **Auth API:** frontend-compatible auth routes now exist and are registered under `/api/v1/auth` ✓

### Decisions Made
- **Schema is MIGRATED status** — initial migration has been generated and applied locally; future model changes should proceed through Alembic revisions rather than ad hoc schema resets.
