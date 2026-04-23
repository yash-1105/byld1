

## AI Communication Summaries + AI Smart Insights

Two new AI features wired to real backend endpoints powered by Gemini Flash via the Lovable AI Gateway. No mocks, no hardcoded responses, no keys in the frontend.

### Architecture

```text
React UI ──REST──▶ Edge Function ──▶ Lovable AI Gateway (Gemini 3 Flash)
  (BYLD)         (acts as Express)         (real LLM)
```

Edge Functions are Lovable Cloud's equivalent of Express routes — same contract (`POST /api/...` style), but managed, secure, and already used by the existing chatbot.

---

### Feature 1 — AI Communication Summaries

**Backend** — `supabase/functions/ai-summarize/index.ts`
- Accepts `{ updates: SiteUpdate[], range: 'today' | '7d' | 'custom', from?, to? }`
- Filters updates by date range server-side
- Calls Gemini Flash with a construction-PM system prompt
- Returns `{ summary: string }`
- CORS + input validation (Zod) + 429/402 handling

**Frontend component** — `src/components/ai/AISummaryPanel.tsx`
- Range dropdown: Today / Last 7 Days / Custom Range (date pickers appear when "Custom")
- "Generate Summary" button
- Output card with: title, markdown-rendered summary, refresh button, skeleton loader, error state
- Uses `supabase.functions.invoke('ai-summarize', { body: { updates, range } })`

**Placement**
- `DashboardPage` — compact variant near the top
- `SiteUpdatesPage` — full variant above the timeline tab

---

### Feature 2 — AI Smart Insights

**Backend** — `supabase/functions/ai-insights/index.ts`
- Accepts `{ tasks, approvals, budget, projects, siteUpdates }`
- Sends a structured prompt asking Gemini to return JSON via `tool_choice` (forced tool call) so output is always valid structured data
- Returns `{ insights: [{ title, description, severity: 'low'|'medium'|'high', category? }] }`
- Same CORS/validation/error handling pattern

**Frontend component** — `src/components/ai/AIInsightsPanel.tsx`
- "Analyze Project" button
- Renders alert cards in a responsive grid
- Each card: severity dot + colored left border, title, description, category chip
- Severity color map: high → destructive, medium → warning, low → primary
- Skeleton loader (3 placeholder cards), empty state, error toast

**Placement**
- Top of `DashboardPage`, above existing dashboard widgets

---

### Files

```text
NEW    supabase/functions/ai-summarize/index.ts
NEW    supabase/functions/ai-insights/index.ts
EDIT   supabase/config.toml                        (register both functions)
NEW    src/components/ai/AISummaryPanel.tsx
NEW    src/components/ai/AIInsightsPanel.tsx
EDIT   src/pages/DashboardPage.tsx                 (mount both panels)
EDIT   src/pages/SiteUpdatesPage.tsx               (mount summary panel)
```

### Design system compliance

- Glass cards, rounded-xl, soft shadows (matches existing `glass-card` + gradient-primary)
- Framer Motion fade/slide-in (no exit animations, per project rule)
- `react-markdown` already installed for the chatbot — reused for summary output
- Skeleton component already in `src/components/ui/skeleton.tsx`

### Security

- All AI calls happen server-side in edge functions
- `LOVABLE_API_KEY` already configured as a secret — never reaches the browser
- Input validated with Zod, CORS preflight handled, error envelopes returned with proper status codes

### Why this is integration-ready (not a mock)

- Real LLM calls on every click (Gemini 3 Flash via Lovable AI Gateway — free during the promo window)
- Structured JSON output for insights via forced tool-calling, so the frontend can trust the shape
- Proper loading, error, empty, and rate-limit (429) / out-of-credits (402) UX
- Swap the model string later to upgrade to Gemini 2.5 Pro or GPT-5 with a one-line change

### Out of scope (easy follow-ups)

- Caching summaries per range to avoid re-spending on identical inputs
- Streaming the summary token-by-token (like the chatbot)
- Persisting generated insights so they survive a refresh

