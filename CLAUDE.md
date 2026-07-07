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

`addTask` in DataContext is `mutateAsync`-backed (returns a `Promise`, not fire-and-forget) so bulk-creation flows (Meeting-to-Tasks) can await each insert and attribute failures per task; the insert also writes `assigned_to` (previously silently dropped — only `updateTask` wrote it).

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

Gemini 2.5 Flash via `@google/generative-ai`, called client-side (`VITE_GEMINI_API_KEY` in `.env`). All Gemini call sites share `src/lib/ai.ts` (`getAI()` lazy singleton, `getModel({ json, responseSchema, systemInstruction })`, `parseAIJson<T>()` — fence-strips markdown and falls back to extracting the outermost `[]`/`{}` span) and `src/lib/aiContext.ts` (pure, hook-free helpers: `compactContext()` trims workspace entities to prompt-relevant fields, `computePortfolioMetrics()` precomputes overdue/budget/approval-age/delivery-risk numbers in TS so the model never does arithmetic, `dataFingerprint()` is a cheap change-hash for cache invalidation). Never instantiate `GoogleGenerativeAI` directly outside `ai.ts`.

- **`src/components/AIAssistant.tsx`** — floating chat, mounted globally in `App.tsx` for authenticated users. Grounded in the full workspace (projects/tasks/budget/siteUpdates/approvals/purchaseOrders/reimbursements/notifications) via `compactContext` + `computePortfolioMetrics`, with a role-conditioned `systemInstruction` (different guidance per architect/contractor/client/consultant). Multi-turn via `startChat`, history capped at 20 sent / 50 persisted. **History persists to localStorage** (`byld.ai.assistant.v1:{userId}`, per-user keyed) so it survives reloads; a header Trash button clears it. Full-screen sheet layout on mobile (`useIsMobile()`), floating `w-96` panel on desktop. Gotcha: Gemini's `startChat` history must start with a `'user'` turn — the hardcoded greeting message is `role: 'assistant'`/`'model'` and must never be the first item sent (leading `model` turns are stripped before the API call).
- **`src/components/ai/AIInsightsPanel.tsx`** — "Analyze Project" (opened via `useAnalyzeDialog` in `BentoKit.tsx`, all 4 dashboards) returns a structured JSON array (`responseSchema`) of predictive risk insights — schedule slip, budget trajectory, approval bottlenecks (>5 days), delivery risk, assignee overload — each with `projectName` (click-through to `/projects/:id`) and a `recommendation`. Cached per-user in localStorage (`byld.ai.insights.v1:{userId}`) with a `dataFingerprint` staleness check; never auto-fires on mount.
- **`src/components/ai/AISummaryPanel.tsx`** — date-ranged (today/7d/custom) executive markdown digest of site updates only. Rendered in the analyze dialog and in `SiteUpdatesPage.tsx`'s Timeline tab (reordered `order-last` on mobile so real updates show above the digest).
- **`src/components/ai/ClientUpdateComposer.tsx`** (lazy, opened from a "Client Update" button on `SiteUpdatesPage.tsx`, architect/contractor only) — drafts a client-facing weekly progress update (recently-completed tasks, upcoming milestones, site updates, budget movement, pending client-visible approvals) from `buildClientUpdateDigest()` in `aiContext.ts`, editable with a preview tab, then delivered via **in-app chat** (`src/services/clientUpdateService.ts`: `findProjectClients()` + `sendClientUpdate()`, which reuses or creates a direct conversation through `chatService`). Draft autosaves to `byld.ai.clientupdate.v1:{userId}:{projectId}` until sent.
- **`src/components/ai/MeetingToTasksDialog.tsx`** (lazy, opened from a "From Meeting Notes" button on `TasksPage.tsx`) — paste meeting notes → structured extraction (title/description/priority/assigneeName/deadline) resolved against the project's team roster (exact then unique-first-name match; unmatched names show inline for manual assignment), editable preview, then bulk `addTask()`. Depends on `addTaskMutation` writing `assigned_to` on insert (see DataContext below) and `addTask` being promise-returning (`mutateAsync`) so per-task failures can be attributed.
- **Smart Search / Ask AI** — `src/components/layout/bento/CommandPalette.tsx` (⌘K) searches approvals, site updates, and purchase orders in addition to projects/tasks (role-gated, no longer capped at 8 items), and adds an explicit "Ask BYLD AI" row (never auto-fires) that switches the dialog into an answer view: a structured `{answer, links}` response, with links validated client-side against real project ids / role-allowed routes before rendering.

Fix history: the `BudgetPage.tsx` receipt-scan model fallback chain used to start with a nonexistent `gemini-3.5-flash` (always failed, wasting a round-trip) — chain is now `gemini-2.5-flash → gemini-2.0-flash → gemini-flash-latest` via the shared `ai.ts` client.

### Google Drive Integration

Per-user OAuth tokens stored in `drive_connections`. Key files: `supabase/functions/google-auth-url/index.ts` (generates the OAuth URL, `drive.readonly` scope, carries `userId|encodeURIComponent(origin)` in `state`), `supabase/functions/google-auth-callback/index.ts` (**`verify_jwt = false`** — Google's redirect can't carry a Supabase auth header; decodes `state`, restricted to an **origin allowlist** — `localhost:5173`, `localhost:8080`, the prod Vercel URL — before redirecting back to `${origin}/settings`, falling back to `APP_URL`), `src/components/drive/DriveIntegration.tsx` (connect/disconnect card in Settings → Integrations, passes `window.location.origin` when invoking `google-auth-url`). `include_granted_scopes=true` on both Drive's and Calendar's auth-url functions prevents one integration's re-auth from dropping the other's grant (they share the same OAuth client).

### Google Calendar Integration

Mirrors the Drive integration pattern (same shared OAuth client — `GOOGLE_DRIVE_CLIENT_ID` / `GOOGLE_DRIVE_CLIENT_SECRET` — and the same origin-carrying `state` param). Per-user OAuth tokens stored in `calendar_connections` (same shape as `drive_connections`).

Key files:
- `supabase/functions/google-calendar-auth-url/index.ts` — generates OAuth URL with the **`calendar.events`** scope (superset of `calendar.readonly` — covers both listing and creating/editing/deleting events); carries `userId|encodeURIComponent(origin)` in `state`
- `supabase/functions/google-calendar-callback/index.ts` — **`verify_jwt = false`**; upserts into `calendar_connections`, redirects to `${APP_URL}/dashboard?success=calendar_connected`
- `supabase/functions/google-calendar-events/index.ts` — fetches next N days (read-only); full 401 → `refreshAccessToken()` → update DB → retry pattern (identical to `google-drive-folders`)
- `supabase/functions/google-calendar-event-write/index.ts` — create/update/delete against the Calendar API (`action: 'create'|'update'|'delete'` in the request body), same token-refresh pattern. A 403 from Google returns `{ error: 'insufficient_scope' }` — the stored token predates the `calendar.events` scope (granted before this feature shipped) and the user must reconnect.
- `src/hooks/useCalendarEvents.ts` — connection + events `useQuery` hooks (`staleTime: 5min`), plus `createEvent`/`updateEvent`/`deleteEvent` mutations. `InsufficientCalendarScopeError` is thrown when the edge function reports `insufficient_scope`; callers should catch it and prompt reconnect (see the widget's `handleInsufficientScope`).
- `src/components/dashboards/GoogleCalendarWidget.tsx` — rendered for **all four roles**; a `+` button opens `CalendarEventDialog` to schedule, hover-revealed pencil/trash icons on each event edit/cancel it. **Existing connections only granted `calendar.readonly`** — the widget surfaces a "Reconnect Google Calendar to enable scheduling" toast with a one-click reconnect action rather than failing silently.
- `src/components/dashboards/CalendarEventDialog.tsx` — shared create/edit form (title, all-day toggle, date/time, location, notes) → `CalendarEventDraft`, mapped to the Google event shape in `useCalendarEvents.ts`'s `draftToGoogleEvent()`.
- `src/components/calendar/CalendarIntegration.tsx` — connect/disconnect card in Settings → Integrations

Supabase secrets required: `GOOGLE_CALENDAR_REDIRECT_URI`, `APP_URL` (production origin, no trailing slash). `APP_URL` trailing slash causes a double-slash redirect bug — always strip with `.replace(/\/+$/, '')`.

### Real-Time Chat

Separate from the main DataContext. `src/services/chatService.ts` handles conversations, messages, file uploads, and Postgres real-time subscriptions. Chat messages are stored in `conversations`, `conversation_members`, and `messages` tables.

### Marketing landing page — cinematic scroll showcase

The public landing page (`src/pages/LandingPage.tsx`, route `/`) is: fixed nav → `HeroScrollAnimation` → `CinematicShowcase` → `Footer`. It is a marketing surface, not product UI — treat it separately from the dashboard app.

**Hero** (`src/components/HeroScrollAnimation.tsx`): a 650vh sticky section that scroll-scrubs a single video (`public/hero.mp4`) via Framer Motion's `useScroll` (NOT a frame sequence — the old 240-JPG `public/hero-sequence/` was removed). `scrollYProgress.onChange` sets `video.currentTime = progress * duration`. Three headline reveals + a fade-to-white at the end use `useTransform`. Poster `public/hero-poster.jpg` paints instantly.

Hero copy (the three scroll-revealed text panels):
1. **"Build smarter. / Deliver faster."** — subtext: "Uncomplicate project management. Control timelines, enhance client transparency, collect faster and hire the right people — all in one place."
2. **"Real-time site updates."** — subtext: transparency/documentation messaging for contractors & site engineers
3. **"Transparent costs and seamless viewing."** — subtext: centralized document hub, segment-wise cost tracking for clients

**CinematicShowcase** (`src/components/cinematic/CinematicShowcase.tsx` + `cinematic.css`): five full-bleed feature scenes, each a 400vh sticky wrapper whose scroll progress (0→1) scrubs a per-scene video and drives overlaid copy/status UI. Key conventions:
- **One vanilla `requestAnimationFrame` engine** in a single `useEffect` drives all scenes (no animation library here). It computes per-scene progress from `getBoundingClientRect` and writes directly to `element.style` — it never touches React state and never uses a `scroll` listener. Helpers: `lerp`, `clamp`, `seg(p,a,b)`, `easeOut`, `easeInOut`, `setOT(el,opacity,y,x,scale)`.
- **Video scrubbing per scene:** `videoNReady`/`videoNDur` flags set on `loadedmetadata`; each frame sets `currentTime = clamp(p) * (dur - 0.04)` only when ready + visible.
- **Lazy loading (perf):** videos are `preload="none"`; a dedicated IntersectionObserver (`rootMargin: 200%`) calls `video.load()` only when a scene nears the viewport, then unobserves. Nothing downloads on initial page load.
- **Scenes:** 1 Segment Map (`segment-map.mp4`, room status cards + stats), 2 Design Board (`design-board.mp4`, material cards), 3 Approvals (`approvals-board.mp4`, name card + Tinder-style `.cin-verdict` tick/X badge at right-middle), 4 Procurement (`procurement-board.mp4`, flipped layout, copy fades out mid-scroll), 5 Timeline (`timeline-board.mp4`, flipped). Scenes 4–5 use `cin-hero--flip` (copy on the right) because their videos are full-frame UI demos. Scene 6 (Workflow + Roles) and the CTA are normal sections revealed via IntersectionObserver (`.cin-rev-el.in`).
- **`.cin-hero-copy` bottom padding:** set to `clamp(100px, 16vh, 140px)` so the CTA button ("Explore X") is never hidden behind the `.cin-stats` bar on shorter/laptop screens. If adjusting copy height, re-check this value.
- **Multi-line bullet support:** `.cin-check li` uses `align-items: flex-start` (tick pinned to top). Long bullets wrap into a `.cin-check-text` flex-column span; a `.cin-check-sub` span renders a smaller italic sub-line (used on Scene 3 Approvals first bullet).

**Scene copy reference** (update this if copy changes):
- Scene 1 (Segment Map): 2 bullets — "Per-room status, budget & tasks" / "Convenient viewing and visualisation of the final design at a single portal"
- Scene 2 (Design Board): 3 bullets — design lifecycle tracking / discarded designs for client revision reviews / scope creep + variation billing
- Scene 3 (Approvals): first bullet has sub-line "Forget the blame game." (italic, `.cin-check-sub`); other two are "One-tap approve or reject" / "Timestamped audit trail"
- Scene 4 (Procurement): copy fades out at ~45% scroll; bullets unchanged
- Scene 5 (Timeline): "Dependency-aware scheduling" / "Warn clients of the opportunity cost of every change requested, minimise variations" / "Deadlines for approvals — clients know the cost of their delayed decisions"
- Workflow cards (Scene 6): Construction = "Site monitoring, task execution, and intelligent timelines."; Finishing = "Final inspections and transparent project close-outs."
- **Per-scene timing** is tuned to each clip in `sNWindows` arrays / fade ranges — re-check against the footage if a video is swapped.
- **Mobile / `prefers-reduced-motion`:** the sticky scrub is disabled (CSS collapses the wrappers) and each scene renders a clean static frame with copy visible.

**Showcase video assets** (`public/*.mp4`): re-encode any replacement clip for smooth scroll-seeking with a short keyframe interval + faststart, e.g. `ffmpeg -i in.mp4 -an -vf scale=1280:-2 -c:v libx264 -g 10 -keyint_min 10 -sc_threshold 0 -crf 24 -movflags +faststart out.mp4`, and extract a `*-poster.jpg`. (GOP-10 keeps files small while seeking stays responsive; avoid all-intra `-g 1` — it bloats size ~2–3×.) Keep clips at 1280px.

The older static showcase (`src/components/showcase/`, `featureData.ts`) is no longer used by the landing page but may still back the `/features` tour; do not assume it is dead.

### UI Conventions

- **Tailwind utility classes** `soft-card`, `glass-card`, `gradient-primary`, `text-primary`, `text-success`, `text-warning`, `text-destructive` are defined in `src/index.css` and used throughout — prefer these over inline color definitions.
- **Framer Motion** for all animations. Standard pattern: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}`.
- **shadcn/ui** components live in `src/components/ui/`. The component library is Radix UI primitives styled with Tailwind. `src/components/ui/password-input.tsx` (`PasswordInput`) wraps `Input` with a show/hide eye-icon toggle — use it for every password field instead of a bare `<Input type="password">`.
- **Recharts** for all data visualizations (BarChart, PieChart, LineChart).
- **sonner** (`toast.success/error`) for all user feedback toasts.
- **BrandLogo** (`src/components/BrandLogo.tsx`) must be used everywhere a logo appears — never the PNG (`public/images/byld-logo.png` is an unusable 3464×3464 image with mostly whitespace).
- **`.scrollbar-none`** (defined in `src/index.css`) hides the scrollbar on horizontal chip/tab rows — used across Tasks, Approvals, Timeline, Budget, Documents, Site Updates, Team, Procurement. Always pair `overflow-x-auto` with this class rather than leaving a visible scrollbar on mobile chip rows.

### Mobile / responsive patterns (dashboard app, not the landing page)

The authenticated app (everything under `DashboardLayout`) follows a few repeated mobile patterns — reuse these rather than inventing new ones:
- **Bento grid**: `BentoGrid` (`src/components/dashboards/bento/BentoKit.tsx`) is `grid-cols-2` on mobile (`lg:grid-cols-12` on desktop) — dashboard tiles use `col-span-1`/`col-span-2` to pair KPI tiles side-by-side while content tiles stay full-width, instead of one long linear column. Applied identically across all four role dashboards.
- **Kanban / status boards**: `TasksPage.tsx` shows one column at a time on mobile via status chips (with counts) plus explicit prev/next move buttons per card — **HTML5 `draggable`/`onDragStart` never fires on touch**, so any future drag-and-drop board needs an equivalent tap-to-move fallback, not just a responsive grid.
- **Wide data tables / Gantt charts**: make the leading label column `sticky left-0` (see `TimelinePage.tsx`'s Gantt task-name column) so it doesn't scroll away when the user swipes through wide horizontal content; give the scroll container a `min-w-[...]` on the inner table rather than letting columns crush illegibly (see `BudgetPage.tsx` expenses table).
- **Category/filter lists**: prefer a real sidebar on desktop (`md:` breakpoint) with the same list rendered as horizontal `scrollbar-none` chips on mobile (see `DocumentsPage.tsx` categories), so filtering never pushes primary content below the fold.
- **Compact stat strips**: 3–4 KPI cards collapse to a dense single row with shortened labels on mobile rather than stacking (see Approvals, Timeline, Budget summary cards) — icons hide first, then labels abbreviate, before font sizes shrink.
- Always verify touch-only affordances (hover-revealed buttons, drag handles) have a tap-accessible equivalent — the Team page's remove-member button was hover-only (`opacity-0 group-hover:opacity-100`) and therefore unreachable on phones until scoped to `sm:opacity-0 sm:group-hover:opacity-100`.

### Liquid glass material (`.app-glass`)

The authenticated app shell (nav bars + all dashboard/page cards) uses a frosted-glass material, defined entirely in `src/index.css` and scoped by the `.app-glass` class on `DashboardLayout.tsx`'s root div — **the marketing/landing page and any Radix portal content (dialogs, popovers, dropdowns render to `document.body`) are structurally outside this scope and unaffected.**

- Every fill is an alpha-adjusted version of an existing token (`--card`, ink `#1e2419`, sage) — no new hues, fonts, or spacing were introduced.
- `Tile` (`BentoKit.tsx`) renders `lg-tile` (light) or `lg-tile-dark` (dark, for the AI Insights tile — dark surfaces stay dark, never recolored light); `soft-card`/`glass-card`/`bg-card.rounded-2xl` utility classes get the same treatment automatically. Small elements (`bg-card.rounded-xl`/`rounded-lg` — chips, inputs, kanban cards) get translucency + an edge highlight but **no `backdrop-filter`**, to keep compositing cheap when dozens render on a phone at once.
- `DashboardLayout.tsx`'s root background carries four sage radial gradients (alpha-adjusted `C.sage`/`C.sageLight`) — the blur needs visible tonal variation behind it to read as glass; a flat background makes any backdrop-filter invisible regardless of blur radius.
- `@supports (backdrop-filter: blur(1px))` gates the actual blur (`blur(24px) saturate(160%)` on tiles/cards, `blur(20px)` on nav panes); browsers without support get a near-solid fallback fill. `@media (prefers-reduced-transparency: reduce)` restores fully solid fills for users who opt out.
- All glass rules use `!important` — Tailwind utility classes like `bg-card` would otherwise win on specificity/cascade order and silently strip the effect.
- When adding a new authenticated-app card, use an existing class (`soft-card`, `glass-card`, `lg-tile`) rather than a bespoke `bg-card rounded-2xl border` combination, so it picks up the glass treatment automatically.

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
- `20260614000000_add_google_calendar_integration.sql` — `calendar_connections` table (mirrors `drive_connections`; owner-scoped RLS; `updated_at` trigger)

**Caveats:**
- The `purchase_orders` table was created directly in the Supabase SQL editor, so its migration file exists in the repo but is **not** recorded in the remote migration history. A future `supabase db push` may error trying to re-create it — resolve with `npx supabase migration repair --status applied 20260609000000`.
- `20260611000001_add_payments.sql` created a `payments` table that is **no longer used** (the Payments feature was removed). The migration file is kept for history integrity; the orphaned remote table can be dropped with a future migration if desired. No app code references it.
- `supabase/config.toml`'s `project_id` **must be `qnriqsnuebcxxzcfxfsv`** (the hosted project referenced throughout this doc). It drifted to a stale/unrelated ref (`pikleinlgnhvikolifjc`) at some point; if `supabase link`/`functions deploy` behave unexpectedly or target the wrong project, check this value first.

### Deployment

Deployed on Vercel from the `main` branch — pushing to `main` triggers a production deploy. `vercel.json` rewrites all routes to `index.html` for SPA routing. The deployed app talks to the same hosted Supabase project, so DB schema changes must be applied to that project (not just committed) to work in production.
