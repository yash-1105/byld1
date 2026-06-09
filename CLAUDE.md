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
- Fetches all tables with `useQuery` (projects, tasks, site_updates, budget_entries, approvals, notifications, users, project_members)
- Filters data to the current user's accessible projects via `accessibleProjectIds`
- Transforms raw DB rows into typed interfaces from `src/data/mockData.ts`
- Exposes typed mutation functions (`addApproval`, `updateTask`, etc.) that call `useMutation` + `queryClient.invalidateQueries`
- Never fetches when `!user` (all queries are `enabled: !!user`)

**AuthContext** (`src/contexts/AuthContext.tsx`) restores session from localStorage on mount, fetches the user profile from the `users` table, and provides `{ user, isAuthenticated, loading, signOut }`.

### Role System

Four roles: `architect`, `contractor`, `client`, `consultant`. Role is stored in the `users` table and drives:
- Which dashboard variant renders in `DashboardPage.tsx`
- Which sidebar nav items appear in `AppSidebar.tsx`
- Whether a user can approve/reject in `ApprovalsPage.tsx` (architect + client only)

### Routing

React Router v6. All dashboard routes are wrapped in `<ProtectedRoute>` (redirects to `/login` if unauthenticated) and rendered inside `DashboardLayout` (sidebar + topbar). Pages are lazy-loaded with `React.lazy()`.

### JSON-encoded text columns

Two Supabase text columns store structured data as JSON strings — follow this pattern when reading/writing them:

- `site_updates.content` → `{ title, description, type, taggedUserIds }`
- `approvals.description` → `{ text, images: string[] }` (only when images are present; plain string otherwise)

Both are parsed with try/catch in DataContext transformers, falling back to treating the field as plain text.

### Image Uploads

All file uploads use the `chat-media` Supabase Storage bucket:

```typescript
const path = `<folder>/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
const { error } = await supabase.storage.from('chat-media').upload(path, file);
const { data: { publicUrl } } = supabase.storage.from('chat-media').getPublicUrl(path);
```

Folders in use: `site-updates/<projectId>/`, `approvals/`, `chat/<conversationId>/`.

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

### Deployment

Deployed on Vercel. `vercel.json` rewrites all routes to `index.html` for SPA routing.
