# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Vite dev server (http://localhost:5173)
npm run build            # Production build
npm run lint             # ESLint
npm run test             # Run Vitest once
npm run test:watch       # Vitest in watch mode
npm run supabase:types   # Regenerate src/integrations/supabase/types.ts from schema
```

## Architecture Overview

BYLD is a React + TypeScript construction project management SPA backed by Supabase.

### Data Flow

```
UI Components / Pages
      │
      ▼
useData() hook → DataContext (TanStack React Query + Supabase mutations)
useAuth() hook → AuthContext (Supabase session + user profile)
      │
      ▼
supabase client (src/integrations/supabase/client.ts)
      │
      ▼
Supabase PostgreSQL + Storage (chat-media bucket)
```

**DataContext** (`src/contexts/DataContext.tsx`) is the single source of truth for all server state. It:
- Fetches all tables with `useQuery` (projects, tasks, site_updates, budget_entries, approvals, purchase_orders, segments, notifications, users, project_members)
- Filters data to the current user's accessible projects via `accessibleProjectIds`
- Transforms raw DB rows into typed interfaces from `src/data/mockData.ts`
- Exposes typed mutation functions (`addApproval`, `addPurchaseOrder`, `updateTask`, etc.) that call `useMutation` + `queryClient.invalidateQueries`
- Never fetches when `!user` (all queries are `enabled: !!user`)

When adding a new entity, follow the established pattern exactly (it repeats per table): a `useQuery` block → a `useMemo` transformer that maps snake_case rows to a camelCase interface and filters by `accessibleProjectIds` → `useMutation` add/update functions with `onSuccess: invalidateQueries`. The `approvals` and `purchase_orders` implementations are the cleanest references.

**AuthContext** (`src/contexts/AuthContext.tsx`) restores session from localStorage on mount, fetches the user profile from the `users` table, and provides `{ user, isAuthenticated, loading, signOut }`.

### Role System

Four roles: `architect`, `contractor`, `client`, `consultant`. Role is stored in the `users` table and drives:
- Which dashboard variant renders in `DashboardPage.tsx`
- Which sidebar nav items appear in `AppSidebar.tsx`
- Approval decisions in `ApprovalsPage.tsx`: only architects & clients decide, **and never on their own request** — an architect's request can only be decided by a client and vice versa (`canDecideApproval()`). Requests from other roles fall back to any architect/client.
- Procurement permissions in `ProcurementPage.tsx`: contractors/architects create and advance orders; only architects/clients can approve (Requested → Approved); the requester or an architect can cancel
- Reimbursement workflow in `ReimbursementsTab.tsx`: architects/contractors create & submit; only the **client** approves/rejects/marks-paid
- Approval visibility: contractors & consultants have **no Approvals page**. They see approvals explicitly shared with their role via the `SharedApprovalsWidget` on their dashboard (see below)

### Routing

React Router v6. All dashboard routes are wrapped in `<ProtectedRoute>` (redirects to `/login` if unauthenticated) and rendered inside `DashboardLayout` (sidebar + topbar). Pages are lazy-loaded with `React.lazy()`.

### JSON-encoded text columns

Two Supabase text columns store structured data as JSON strings — follow this pattern when reading/writing them:

- `site_updates.content` → `{ title, description, type, taggedUserIds }`
- `approvals.description` → `{ text, images: string[] }` (only when images are present; plain string otherwise)

Both are parsed with try/catch in DataContext transformers, falling back to treating the field as plain text.

### Procurement pipeline & cross-feature integrations

`ProcurementPage.tsx` is a purchase-order pipeline backed by the `purchase_orders` table. Orders move through a fixed status flow: `requested → approved → ordered → in_transit → delivered` (plus `cancelled`). The page has three tabs: **Pipeline** (kanban), **Suppliers** (derived from order data — there is no suppliers table), and **Analytics** (Recharts).

Three integrations connect procurement to the rest of the app — preserve these when editing:
- **Delivered → Budget.** Marking an order delivered auto-creates a `budget_entries` row via `addBudgetItem`. See the `PO:<id>` marker convention below.
- **Large order → Approval.** Creating an order whose cost ≥ `APPROVAL_THRESHOLD` (a constant in `ProcurementPage.tsx`, currently `$10,000`) also calls `addApproval` with category `'Procurement'`. This is **one-directional** — approving in the Approval Center does NOT auto-advance the order's pipeline status.
- **Dashboard KPI.** Architect & Contractor dashboards show a "Pending Deliveries" KPI derived from `purchaseOrders` (statuses `approved|ordered|in_transit`).

### The `PO:<id>` / `APR:<id>` marker convention (idempotency without a link column)

`budget_entries` has no column to reference its source order/approval, so generated budget entries encode the link inside their `description` as a prefix:
- Procurement: `` `PO:${po.id} · <readable text>` ``
- Approvals: `` `APR:${approval.id}[ [est]] · <readable text>` `` — the `[est]` flag marks a **variable-cost** estimate (see Approvals → Budget below)

This serves two purposes:
- **Idempotency:** before logging to the budget, the source page checks `budgetItems.some(b => b.description.startsWith('PO:' + id))` (or `'APR:' + id`) and skips if already present — so re-delivering/re-approving never double-counts.
- **Display:** `BudgetPage.tsx` strips both markers for display via `cleanDescription()` (regexes `^PO:[0-9a-fA-F-]+\s*·\s*` and `^APR:[0-9a-fA-F-]+(\s*\[est\])?\s*·\s*`). If you surface budget descriptions anywhere else, strip the markers the same way.

### Budget & Finance workspace (`BudgetPage.tsx`)

The Budget module is a 3-tab workspace per project: **Financial Dashboard** (pie + trend charts, category breakdown), **Expenses** (unified table of budget entries **+** reimbursements), and **Reimbursements** (`ReimbursementsTab.tsx`). There is intentionally **no** Payments or Cost Reports tab (both were removed).

- **Single display currency.** All money is stored in a **USD base** and rendered through `formatCurrency`/`formatCurrencyCompact` (from `usePreferences()`), which convert to the user's chosen settings currency. Reimbursements/approvals capture amounts in the user's display currency and are converted to USD on save via `USD_RATES` (exported from `src/lib/preferences.ts`): `usd = entered / USD_RATES[currency]`. Never display a raw stored amount without `formatCurrency`.
- **Total Spent** = budget entries + active reimbursements (`pending_client_review|approved|paid`), all summed in USD.
- **Expense categories** are a fixed list (`EXPENSE_CATEGORIES` in `BudgetPage.tsx`) surfaced as a dropdown; the AI receipt scanner is prompted to pick from it and its output is run through `normalizeCategory()`.

### Approvals → Budget integration & variable cost

`ApprovalsPage.tsx` lets a requester attach a **cost** to an approval: `cost_type` is `fixed` (final) or `variable` (an estimate), with `cost_amount` stored in USD base (`approvals.cost_type` / `approvals.cost_amount`).
- **On approval**, `handleAction()` auto-creates a `budget_entries` row (idempotent via the `APR:<id>` marker; `[est]` appended for variable).
- **Finalising a variable cost:** in the Budget **Expenses** tab, only `[est]`-flagged entries show a **"Set final cost"** action, visible to the approval's requester (assignee) or an architect (`canEditApprovalCost()`). Saving (`saveCostEdit()`) updates the amount **and strips the `[est]` flag**, so a variable estimate can be finalised exactly **once**. Fixed-cost entries are never editable.

### Shared approvals for contractors & consultants (`SharedApprovalsWidget.tsx`)

Because contractors/consultants have no Approvals page, `DashboardPage.tsx` renders `SharedApprovalsWidget` for those two roles. It lists approvals shared with them (pending first) and opens a read-only detail **popup** on click. The DataContext `approvals` transformer already scopes the list: architects/clients see everything; other roles see only approvals where their role is in `visible_roles`, or which they requested. The New Request form's **"Share with"** chips (`shareRoles`) add `contractor`/`consultant` to `visible_roles` (architect + client are merged in automatically by `addApprovalMutation`).

### Documents → Government Approvals

`DocumentsPage.tsx` has a **Government Approvals** category. Documents in it render through `GovernmentApprovalsTable.tsx` (not the normal file grid), showing an `approval_status` badge (`Pending`/`Submitted`/`Approved`/`Rejected`, stored on `documents.approval_status`). Architects can change the status inline. The upload modal exposes the status selector only when the chosen category is `Government Approvals`. The `NormalizedDocument` type (`src/types/drive.ts`) carries `projectId` and `approvalStatus` to unify Supabase + Drive docs.

### Image Uploads

All file uploads use the `chat-media` Supabase Storage bucket:

```typescript
const path = `<folder>/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
const { error } = await supabase.storage.from('chat-media').upload(path, file);
const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
```

Folders in use: `site-updates/<projectId>/`, `approvals/`, `chat/<conversationId>/`, `reimbursements/<projectId>/`.

### AI Integration

Gemini 2.5 Flash via `@google/generative-ai`. Key files:
- `src/components/AIAssistant.tsx` — floating chat widget, streams responses, injects current project data as context
- `src/components/ai/AISummaryPanel.tsx` — summarizes site updates
- `src/components/ai/AIInsightsPanel.tsx` — generates structured project health insights

Requires `VITE_GEMINI_API_KEY` in `.env`.

### Real-Time Chat

Separate from the main DataContext. `src/services/chatService.ts` handles conversations, messages, file uploads, and Postgres real-time subscriptions. Chat messages are stored in `conversations`, `conversation_members`, and `messages` tables.

### UI Conventions

- **Tailwind utility classes** `soft-card`, `glass-card`, `gradient-primary`, `text-primary`, `text-success`, `text-warning`, `text-destructive` are defined in `src/index.css` and used throughout — prefer these over inline color definitions.
- **Framer Motion** for all animations. Standard pattern: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}`.
- **shadcn/ui** components live in `src/components/ui/`. The component library is Radix UI primitives styled with Tailwind.
- **Recharts** for all data visualizations (BarChart, PieChart, LineChart).
- **sonner** (`toast.success/error`) for all user feedback toasts.
- **BrandLogo** (`src/components/BrandLogo.tsx`) must be used everywhere a logo appears — never the PNG (`public/images/byld-logo.png` is an unusable 3464×3464 image with mostly whitespace).

### Environment Variables

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_GEMINI_API_KEY
VITE_GOOGLE_MAPS_API_KEY
```

### Database migrations

SQL migrations live in `supabase/migrations/<timestamp>_name.sql` (RLS-enabled tables follow the convention in `20260605000000_add_google_drive_integration.sql` and `20260609000000_add_purchase_orders.sql`). The remote project is hosted (`qnriqsnuebcxxzcfxfsv`); apply changes with `supabase db push`, then regenerate types with `npm run supabase:types`.

Reimbursements & approvals additions (all applied to remote):
- `20260611000000_add_reimbursements.sql` — `reimbursements` table (RLS: any project member can view/update; submitter inserts/deletes)
- `20260611000002_add_document_approval_status.sql` — `documents.approval_status` column
- `20260612000000_add_approval_visible_roles.sql` — `approvals.visible_roles TEXT[]` (defaults to `{architect,client}`)
- `20260612000001_add_approval_cost.sql` — `approvals.cost_type` (`fixed`/`variable`) + `cost_amount` (USD base)

**Caveats:**
- The `purchase_orders` table was created directly in the Supabase SQL editor, so its migration file exists in the repo but is **not** recorded in the remote migration history. A future `supabase db push` may error trying to re-create it — resolve with `npx supabase migration repair --status applied 20260609000000`.
- `20260611000001_add_payments.sql` created a `payments` table that is **no longer used** (the Payments feature was removed). The migration file is kept for history integrity; the orphaned remote table can be dropped with a future migration if desired. No app code references it.

### Deployment

Deployed on Vercel from the `main` branch — pushing to `main` triggers a production deploy. `vercel.json` rewrites all routes to `index.html` for SPA routing. The deployed app talks to the same hosted Supabase project, so DB schema changes must be applied to that project (not just committed) to work in production.
