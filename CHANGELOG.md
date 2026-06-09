# Changelog

All notable changes to the BYLD platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — 2026-06-09

### Approval Center (`/approvals`)

Rebuilt from a static mockup into a fully dynamic, database-backed approval workflow.

- **Wired to Supabase** — reads/writes the real `approvals` table; all actions persist (previously 7 hardcoded items that saved nothing).
- **Submit requests** — "New Request" modal lets any team member raise an approval (title, category, project, description).
- **Photo attachments** — requests can include uploaded photos (stored in the `chat-media` bucket); approval cards display them as a swipeable gallery.
- **Persisted decisions** — Approve / Reject / Put-on-hold save to the DB, with a required reason on reject/hold and a record of who decided and when.
- **Live stats & filtering** — clickable Pending / Approved / Rejected / On-Hold counts, per-category counts, project filter, and a "My Decisions" section.
- **Role-aware** — only architects and clients can decide; all other roles can submit requests.
- **Dashboard sync** — the "Pending Approvals" KPI on the Architect and Client dashboards now reflects real approval data (previously derived from task data).

### Procurement (`/procurement`)

Replaced the fake "supplier marketplace" with a real purchase-order pipeline.

- **New `purchase_orders` Supabase table** backs the page (with row-level security matching existing tables).
- **Pipeline (kanban) view** — orders move through **Requested → Approved → Ordered → In Transit → Delivered** (plus Cancelled), advanced via per-card controls.
- **Order details** — item, supplier, project, area/segment, quantity + unit, cost, expected delivery date, and notes.
- **KPI cards** — committed spend, pending deliveries, overdue, and delivered-this-month.
- **Overdue tracking** — orders past their expected delivery date are flagged in red.
- **Suppliers tab** — auto-generated vendor list with order counts and total spend per supplier.
- **Analytics tab** — spend-by-category and spend-by-supplier charts.
- **Role-aware** — contractors/architects create and advance orders; only architects/clients can approve; the requester or an architect can cancel.

### Cross-feature integrations

- **Delivered order → Budget entry** — marking an order Delivered auto-logs its cost as an expense on the Budget page. Idempotent (a hidden `PO:<id>` marker prevents double-counting if an order is moved back and re-delivered); the marker is stripped from the Budget table display.
- **Large order → Approval** — creating an order ≥ $10,000 auto-raises a "Procurement" approval in the Approval Center for sign-off. One-directional: it surfaces the order for visibility but does not auto-advance the pipeline.
- **Pending Deliveries KPI** — added to the Architect and Contractor dashboards (counts committed-but-not-delivered orders; turns red when any are overdue).

### Other / fixes

- **Brand logo** — replaced the unusable white PNG (oversized, invisible on light backgrounds) with a crisp text-based `BrandLogo` component across the landing page, login, sidebar, and footer.
- **Role dashboards** — revamped Architect, Client, Contractor, and Consultant dashboards with dynamic, construction-relevant KPIs and charts.
- **Budget display** — procurement-linked expenses now hide their internal `PO:<id>` marker in the Expenses table.

### Backend / ops notes

- The `purchase_orders` table was created directly via the Supabase SQL editor. The migration file `supabase/migrations/20260609000000_add_purchase_orders.sql` exists in the repo but is **not** recorded in the remote DB's migration history. If `supabase db push` is run later it may error re-creating the table — resolve with `npx supabase migration repair --status applied 20260609000000`.
- Supabase TypeScript types were regenerated (`npm run supabase:types`) to include `purchase_orders`.
- The `$10,000` procurement-approval threshold is a constant in `src/pages/ProcurementPage.tsx`.
