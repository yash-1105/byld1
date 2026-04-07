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

### In Progress
- (none)

### Blocked
- (none)

### Decisions Made
- (none yet)
