# SYSTEM_AUDIT

Audit run date: 2026-04-08

## Verification Summary

| Area | Command / Check | Result |
| --- | --- | --- |
| Docker | `docker compose up -d` | Passed. `postgres` and `redis` are running. |
| Postgres reachability | `docker compose exec -T postgres pg_isready -U byld -d byld` | Passed. Database is accepting connections. |
| Backend deps | `cd backend && source .venv/bin/activate && pip install -r requirements.txt` | Passed. Requirements already satisfied in `backend/.venv`. |
| FastAPI app bootability | `from app.main import app` and backend tests | Passed. App imports cleanly and health route test passes. |
| Health endpoint | `backend/tests/test_health.py` | Passed. `/api/v1/health` returns `{"success": true, "data": {"status": "healthy"}, "meta": {}}`. |
| Models import | `python -c "from app.db.models import *; print('All models OK')"` | Passed. |
| Alembic metadata | `cd backend && source .venv/bin/activate && alembic heads` | Passed. Current head is `07ec2500a161`. |
| Alembic migration apply | `cd backend && source .venv/bin/activate && alembic upgrade head` | Passed. |
| Post-migration schema check | `docker compose exec -T postgres psql -U byld -d byld -c "\dt"` | Passed. 20 tables exist, including `alembic_version`. |
| Backend tests | `cd backend && source .venv/bin/activate && pytest -v` | Passed. `9 passed`. |
| Frontend deps | `cd frontend && npm install` | Passed. Up to date. |
| Frontend lint | `cd frontend && npm run lint` | Passed cleanly. No errors or warnings emitted. |
| Frontend build | `cd frontend && npm run build` | Passed. One Vite chunk-size warning only; no build errors. |
| Frontend tests | `cd frontend && npm run test` | Passed. `1 passed`. |
| Frontend API layer importability | Vite build of `frontend/src/api/*` | Passed as part of the production build. |

## A. Directory Tree

Files only. `backend/.env` is intentionally omitted because it is a local secret file and gitignored.

```text
backend/
├── .env.example
├── .gitignore
├── alembic.ini
├── pytest.ini
├── requirements.txt
├── alembic/
│   ├── README
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 07ec2500a161_initial_schema.py
├── app/
│   ├── __init__.py
│   ├── config.py
│   ├── main.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── deps.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── enums.py
│   │   ├── session.py
│   │   └── models/
│   │       ├── __init__.py
│   │       ├── activity.py
│   │       ├── approval.py
│   │       ├── contract.py
│   │       ├── document.py
│   │       ├── finance.py
│   │       ├── project.py
│   │       ├── site.py
│   │       ├── task.py
│   │       └── user.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── base.py
│   ├── security/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   └── dependencies.py
│   ├── services/
│   │   └── __init__.py
│   ├── storage/
│   │   └── __init__.py
│   └── workers/
│       └── __init__.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_auth.py
    └── test_health.py

frontend/src/api/
├── auth.ts
├── client.ts
└── index.ts
```

## B. Models Inventory

| Model | Table | Columns | Foreign Keys | Indexes | Relationships |
| --- | --- | --- | --- | --- | --- |
| `Project` | `projects` | `id UUID`; `name VARCHAR(255)`; `description TEXT`; `status VARCHAR(50)`; `cover_image_key VARCHAR(500)`; `start_date DATE`; `end_date DATE`; `is_deleted BOOLEAN`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | none | `ix_projects_status(status)` | `members`; `stages`; `tasks`; `approvals`; `site_updates`; `logbook_entries`; `documents`; `contracts`; `budget_entries`; `payment_milestones`; `activity_logs`; `design_decisions`; `notifications` |
| `User` | `users` | `id UUID`; `email VARCHAR(255)`; `hashed_password VARCHAR(255)`; `full_name VARCHAR(255)`; `role VARCHAR(50)`; `avatar_key VARCHAR(500)`; `is_active BOOLEAN`; `is_deleted BOOLEAN`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | none | `ix_users_email(email)` unique | `project_memberships`; `refresh_tokens`; `notifications`; `activity_logs`; `tasks_assigned`; `tasks_created`; `approvals_requested`; `approvals_reviewed`; `contracts_created`; `contracts_as_contractor`; `change_orders_requested`; `change_orders_reviewed`; `documents_uploaded`; `design_decisions_created`; `budget_entries_created`; `payment_milestones_created`; `site_updates_created`; `logbook_entries_created` |
| `RefreshToken` | `refresh_tokens` | `id UUID`; `user_id UUID`; `token_hash VARCHAR(255)`; `expires_at TIMESTAMPTZ`; `revoked BOOLEAN`; `created_at TIMESTAMPTZ` | `user_id -> users.id` | `ix_refresh_tokens_user_id(user_id)`; unique constraint on `token_hash` | `user` |
| `ProjectMember` | `project_members` | `id UUID`; `project_id UUID`; `user_id UUID`; `role VARCHAR(50)`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id`; `user_id -> users.id` | `ix_project_members_project_id(project_id)`; `ix_project_members_user_id(user_id)` | `project`; `user` |
| `ProjectStage` | `project_stages` | `id UUID`; `project_id UUID`; `name VARCHAR(255)`; `description TEXT`; `order INTEGER`; `color VARCHAR(20)`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id` | `ix_project_stages_project_id(project_id)` | `project`; `tasks` |
| `Task` | `tasks` | `id UUID`; `project_id UUID`; `stage_id UUID`; `assignee_id UUID`; `created_by_id UUID`; `title VARCHAR(500)`; `description TEXT`; `status VARCHAR(50)`; `priority VARCHAR(50)`; `due_date DATE`; `is_deleted BOOLEAN`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id`; `stage_id -> project_stages.id`; `assignee_id -> users.id`; `created_by_id -> users.id` | `ix_tasks_project_id(project_id)`; `ix_tasks_status(status)`; `ix_tasks_assignee_id(assignee_id)`; `ix_tasks_stage_id(stage_id)`; `ix_tasks_created_by_id(created_by_id)` | `project`; `stage`; `assignee`; `created_by`; `approvals` |
| `Approval` | `approvals` | `id UUID`; `project_id UUID`; `task_id UUID`; `requested_by_id UUID`; `reviewed_by_id UUID`; `title VARCHAR(500)`; `description TEXT`; `status VARCHAR(50)`; `review_notes TEXT`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id`; `task_id -> tasks.id`; `requested_by_id -> users.id`; `reviewed_by_id -> users.id` | `ix_approvals_project_id(project_id)`; `ix_approvals_status(status)`; `ix_approvals_task_id(task_id)`; `ix_approvals_requested_by_id(requested_by_id)`; `ix_approvals_reviewed_by_id(reviewed_by_id)` | `project`; `task`; `requested_by`; `reviewed_by` |
| `SiteUpdate` | `site_updates` | `id UUID`; `project_id UUID`; `created_by_id UUID`; `title VARCHAR(500)`; `description TEXT`; `update_type VARCHAR(50)`; `image_keys TEXT[]`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id`; `created_by_id -> users.id` | `ix_site_updates_project_id(project_id)`; `ix_site_updates_created_by_id(created_by_id)` | `project`; `created_by` |
| `SiteLogbookEntry` | `site_logbook_entries` | `id UUID`; `project_id UUID`; `created_by_id UUID`; `entry_date VARCHAR(20)`; `weather VARCHAR(100)`; `workers_on_site INTEGER`; `notes TEXT`; `ai_summary TEXT`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id`; `created_by_id -> users.id` | `ix_site_logbook_entries_project_id(project_id)`; `ix_site_logbook_entries_created_by_id(created_by_id)` | `project`; `created_by` |
| `ActivityLog` | `activity_logs` | `id UUID`; `project_id UUID`; `user_id UUID`; `action VARCHAR(50)`; `entity_type VARCHAR(100)`; `entity_id VARCHAR(36)`; `detail JSONB`; `created_at TIMESTAMPTZ` | `project_id -> projects.id`; `user_id -> users.id` | `ix_activity_logs_project_id(project_id)`; `ix_activity_logs_user_id(user_id)`; `ix_activity_logs_created_at(created_at)` | `project`; `user` |
| `Notification` | `notifications` | `id UUID`; `user_id UUID`; `project_id UUID`; `notification_type VARCHAR(100)`; `title VARCHAR(500)`; `body TEXT`; `entity_type VARCHAR(100)`; `entity_id VARCHAR(36)`; `is_read BOOLEAN`; `created_at TIMESTAMPTZ` | `user_id -> users.id`; `project_id -> projects.id` | `ix_notifications_user_id(user_id)`; `ix_notifications_project_id(project_id)`; `ix_notifications_is_read(is_read)` | `user`; `project` |
| `Document` | `documents` | `id UUID`; `project_id UUID`; `uploaded_by_id UUID`; `name VARCHAR(500)`; `description TEXT`; `category VARCHAR(50)`; `object_key VARCHAR(1000)`; `mime_type VARCHAR(200)`; `file_size_bytes INTEGER`; `version INTEGER`; `is_deleted BOOLEAN`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id`; `uploaded_by_id -> users.id` | `ix_documents_project_id(project_id)`; `ix_documents_uploaded_by_id(uploaded_by_id)`; `ix_documents_category(category)` | `project`; `uploaded_by`; `chunks`; `design_decision_links` |
| `DocumentChunk` | `document_chunks` | `id UUID`; `document_id UUID`; `chunk_index INTEGER`; `content TEXT`; `embedding FLOAT[]` | `document_id -> documents.id` | `ix_document_chunks_document_id(document_id)` | `document` |
| `DesignDecision` | `design_decisions` | `id UUID`; `project_id UUID`; `created_by_id UUID`; `title VARCHAR(500)`; `description TEXT`; `rationale TEXT`; `status VARCHAR(50)`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id`; `created_by_id -> users.id` | `ix_design_decisions_project_id(project_id)`; `ix_design_decisions_created_by_id(created_by_id)` | `project`; `created_by`; `document_links` |
| `DesignDecisionDocument` | `design_decision_documents` | `id UUID`; `design_decision_id UUID`; `document_id UUID` | `design_decision_id -> design_decisions.id`; `document_id -> documents.id` | `ix_ddd_design_decision_id(design_decision_id)`; `ix_ddd_document_id(document_id)` | `design_decision`; `document` |
| `Contract` | `contracts` | `id UUID`; `project_id UUID`; `contractor_id UUID`; `created_by_id UUID`; `title VARCHAR(500)`; `description TEXT`; `status VARCHAR(50)`; `contract_value FLOAT`; `currency VARCHAR(10)`; `start_date DATE`; `end_date DATE`; `object_key VARCHAR(1000)`; `is_deleted BOOLEAN`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id`; `contractor_id -> users.id`; `created_by_id -> users.id` | `ix_contracts_project_id(project_id)`; `ix_contracts_status(status)`; `ix_contracts_contractor_id(contractor_id)`; `ix_contracts_created_by_id(created_by_id)` | `project`; `contractor`; `created_by`; `change_orders` |
| `ChangeOrder` | `change_orders` | `id UUID`; `project_id UUID`; `contract_id UUID`; `requested_by_id UUID`; `reviewed_by_id UUID`; `title VARCHAR(500)`; `description TEXT`; `status VARCHAR(50)`; `cost_impact FLOAT`; `schedule_impact_days INTEGER`; `review_notes TEXT`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id`; `contract_id -> contracts.id`; `requested_by_id -> users.id`; `reviewed_by_id -> users.id` | `ix_change_orders_project_id(project_id)`; `ix_change_orders_contract_id(contract_id)`; `ix_change_orders_status(status)`; `ix_change_orders_requested_by_id(requested_by_id)`; `ix_change_orders_reviewed_by_id(reviewed_by_id)` | `contract`; `requested_by`; `reviewed_by` |
| `BudgetEntry` | `budget_entries` | `id UUID`; `project_id UUID`; `created_by_id UUID`; `contract_id UUID`; `entry_type VARCHAR(50)`; `category VARCHAR(255)`; `description TEXT`; `amount FLOAT`; `currency VARCHAR(10)`; `entry_date DATE`; `status VARCHAR(50)`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id`; `created_by_id -> users.id`; `contract_id -> contracts.id` | `ix_budget_entries_project_id(project_id)`; `ix_budget_entries_created_by_id(created_by_id)`; `ix_budget_entries_entry_type(entry_type)`; `ix_budget_entries_contract_id(contract_id)` | `project`; `created_by` |
| `PaymentMilestone` | `payment_milestones` | `id UUID`; `project_id UUID`; `contract_id UUID`; `created_by_id UUID`; `title VARCHAR(500)`; `description TEXT`; `amount FLOAT`; `currency VARCHAR(10)`; `due_date DATE`; `paid_date DATE`; `status VARCHAR(50)`; `created_at TIMESTAMPTZ`; `updated_at TIMESTAMPTZ` | `project_id -> projects.id`; `contract_id -> contracts.id`; `created_by_id -> users.id` | `ix_payment_milestones_project_id(project_id)`; `ix_payment_milestones_status(status)`; `ix_payment_milestones_contract_id(contract_id)`; `ix_payment_milestones_created_by_id(created_by_id)` | `project`; `created_by` |

Model audit result:

- All foreign keys reference valid tables.
- Enum drift called out in the earlier audit is fixed. `DesignDecision.status` uses `DesignDecisionStatus`, and `BudgetEntry.status` uses `BudgetEntryStatus`.
- The earlier missing FK indexes and relationship pairs listed in `SYSTEM_AUDIT.md` have been added.

## D. API Surface

| File | Endpoints / Surface |
| --- | --- |
| `backend/app/main.py` | `GET /api/v1/health`; registers `/api/v1/auth`; global `HTTPException` and validation handlers return the documented error envelope |
| `backend/app/api/auth.py` | `POST /register`; `POST /login`; `POST /refresh`; `GET /me`; `POST /logout` |
| `backend/app/api/deps.py` | Dependency helper `get_db()` |
| `backend/app/api/__init__.py` | Empty package marker |

Behavior notes:

- Success responses now follow `{ "success": true, "data": ..., "meta": {} }`.
- Error responses now follow `{ "success": false, "data": null, "error": { "code": "...", "message": "..." } }`.
- The backend route surface is still minimal: health plus auth only.

## E. Frontend API Layer

| File | Function / Export | Endpoint | Request Type | Response Type | Notes |
| --- | --- | --- | --- | --- | --- |
| `frontend/src/api/client.ts` | default `client` | base URL only | axios config | axios instance | Base URL is `VITE_API_BASE_URL` with fallback `http://localhost:8000/api/v1`; unwraps success envelope; attaches bearer token; retries once after refresh |
| `frontend/src/api/client.ts` | `ACCESS_TOKEN_KEY` | n/a | n/a | `string` | Local storage key `byld_access_token` |
| `frontend/src/api/client.ts` | `REFRESH_TOKEN_KEY` | n/a | n/a | `string` | Local storage key `byld_refresh_token` |
| `frontend/src/api/auth.ts` | `login(data)` | `POST /auth/login` | `LoginRequest` | `Promise<AuthResponse>` | Matches backend |
| `frontend/src/api/auth.ts` | `register(data)` | `POST /auth/register` | `RegisterRequest` | `Promise<AuthResponse>` | Matches backend |
| `frontend/src/api/auth.ts` | `refreshToken(token)` | `POST /auth/refresh` | `{ refresh_token: string }` | `Promise<AuthResponse>` | Matches backend |
| `frontend/src/api/auth.ts` | `getMe()` | `GET /auth/me` | none | `Promise<UserResponse>` | Matches backend |
| `frontend/src/api/auth.ts` | `logout()` | `POST /auth/logout` | none | `Promise<null>` | Backend accepts bodyless logout and returns `data: null` |
| `frontend/src/api/index.ts` | barrel exports | n/a | n/a | re-exports | Re-exports client and auth layer |

Contract result:

- Frontend auth functions exist.
- Endpoint paths match what the backend currently serves under `/api/v1/auth`.
- The Vite build proves the API layer imports correctly in the app toolchain.

## F. Config & Environment

### Backend vars

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | yes | Async SQLAlchemy database URL used by app runtime and Alembic |
| `JWT_SECRET_KEY` | yes | JWT signing secret |
| `JWT_ALGORITHM` | no | JWT algorithm, default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | no | Access-token TTL, default `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | no | Refresh-token TTL, default `7` |
| `S3_BUCKET_NAME` | no | Upload bucket name |
| `S3_REGION` | no | Object storage region |
| `S3_ACCESS_KEY` | no | Object storage access key |
| `S3_SECRET_KEY` | no | Object storage secret key |
| `CORS_ORIGINS` | no | Comma-separated frontend origins |
| `APP_ENV` | no | Environment flag, default `development` |

### Frontend vars

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_BASE_URL` | yes | Frontend API base URL, expected format `http://localhost:8000/api/v1` |

### Config checks

- `frontend/.env.example` contains `VITE_API_BASE_URL`.
- `backend/.env.example` covers every field referenced by `backend/app/config.py`.
- `docker-compose.yml` contains both `postgres` and `redis`.
- Repo-root `.env.example` has been removed, so `backend/.env.example` is the source of truth.
- Root `.gitignore` excludes `backend/.env`.

## G. What's Built vs What's Empty

| Backend module | Status | Notes |
| --- | --- | --- |
| `backend/app/main.py` | implemented | FastAPI app, CORS, auth router registration, health route, envelope-aware exception handlers |
| `backend/app/config.py` | implemented | Settings model and CORS parsing |
| `backend/app/api/auth.py` | implemented | Register/login/refresh/me/logout endpoints |
| `backend/app/api/deps.py` | implemented | Async DB dependency |
| `backend/app/api/__init__.py` | scaffolded | Empty package marker |
| `backend/app/db/base.py` | implemented | Declarative base, UUID mixin, timestamp mixin |
| `backend/app/db/enums.py` | implemented | Enum source of truth, including design-decision and budget-entry statuses |
| `backend/app/db/session.py` | implemented | Async engine and session factory |
| `backend/app/db/models/*.py` | implemented | Full current schema across project, user, task, approval, site, document, contract, finance, activity domains |
| `backend/app/schemas/base.py` | implemented | Success/error/paginated envelopes |
| `backend/app/schemas/auth.py` | implemented | Auth request and response schemas |
| `backend/app/schemas/__init__.py` | scaffolded | Empty package marker |
| `backend/app/security/auth.py` | implemented | Password hashing, token create/decode helpers |
| `backend/app/security/dependencies.py` | implemented | Bearer-token auth dependencies |
| `backend/app/security/__init__.py` | scaffolded | Empty package marker |
| `backend/alembic/env.py` | implemented | Alembic metadata wiring |
| `backend/alembic/versions/07ec2500a161_initial_schema.py` | implemented | Initial schema migration |
| `backend/tests/conftest.py` | implemented | Async client and test DB setup |
| `backend/tests/test_health.py` | implemented | Health route coverage |
| `backend/tests/test_auth.py` | implemented | Register/login/me/refresh/logout coverage |
| `backend/app/services/__init__.py` | scaffolded | Package exists; no service modules yet |
| `backend/app/storage/__init__.py` | scaffolded | Package exists; no storage implementation yet |
| `backend/app/workers/__init__.py` | scaffolded | Package exists; no worker/job implementation yet |
| Missing expected route modules | missing | No routers yet for projects, tasks, approvals, documents, contracts, finance, site updates, notifications, dashboards, or users |
| Missing domain schemas | missing | No non-auth schema modules yet |

Empty file check under `backend/app/`:

- `backend/app/__init__.py`
- `backend/app/api/__init__.py`
- `backend/app/db/__init__.py`
- `backend/app/schemas/__init__.py`
- `backend/app/security/__init__.py`
- `backend/app/services/__init__.py`
- `backend/app/storage/__init__.py`
- `backend/app/workers/__init__.py`

These are package markers, not accidental empty implementation files.

## H. Issues Found

1. The backend is now coherent for health and auth, but the broader API surface is still missing. There are no implemented routers yet for projects, tasks, approvals, documents, contracts, finance, site updates, notifications, or dashboard features.
2. Several `Date` columns are typed as `Mapped[str]` in the ORM instead of `Mapped[date]`: `Project.start_date`, `Project.end_date`, `Task.due_date`, `Contract.start_date`, `Contract.end_date`, `BudgetEntry.entry_date`, `PaymentMilestone.due_date`, and `PaymentMilestone.paid_date`.
3. Schema-rule drift remains for timestamps. `ActivityLog`, `Notification`, and `RefreshToken` do not have `updated_at`; `DocumentChunk` and `DesignDecisionDocument` have no timestamps at all, even though `AGENT.md` says all tables should have `created_at` and `updated_at`.
4. `SiteLogbookEntry.entry_date` is stored as `String(20)` instead of a proper `DATE`, which will make filtering, sorting, and validation weaker than the rest of the schema.
5. `backend/app/services/`, `backend/app/storage/`, and `backend/app/workers/` are still empty shells.
6. `docker-compose.yml` and `backend/.env.example` still contain development credentials and placeholder secrets. That is acceptable for local bootstrap, but it should not survive unchanged into shared or production environments.
7. Frontend build is green, but Vite reports a large bundle warning on the main chunk. This is not a functional failure, but it is a real performance follow-up item.

Checks that are now clean:

- Enum coverage matches model status fields.
- Response envelope matches `AGENT.md`.
- `security/` is implemented, not empty.
- Frontend auth endpoints match backend auth routes.
- FK indexes and relationship mismatches called out in the previous audit are resolved.

## I. Recommended Fix List

1. Implement the next router layer under `/api/v1` for projects, tasks, approvals, documents, contracts, budget, site updates, and notifications so the backend covers more than auth and health.
2. Fix the remaining ORM typing drift by changing all `Date`-backed `Mapped[str]` fields to `Mapped[date]` or `Mapped[date | None]`.
3. Decide whether BYLD really requires timestamps on every table. If yes, normalize `RefreshToken`, `ActivityLog`, `Notification`, `DocumentChunk`, and `DesignDecisionDocument` to the shared convention and generate a follow-up Alembic revision.
4. Convert `SiteLogbookEntry.entry_date` from `String(20)` to `DATE` unless there is a strong product reason to keep free-form text.
5. Start filling `services/`, `storage/`, and `workers/` with the minimum real modules needed by Milestone 1, or remove those empty packages until they are needed.
6. Replace development secrets and passwords before any shared deployment workflow, and keep `.env` local-only.
7. Reduce the frontend bundle size with route-level splitting or chunk configuration before performance work begins.
