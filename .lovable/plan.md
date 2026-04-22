

## Add Real AI Chatbot (Gemini Flash) to BYLD

Replace the mock `AIAssistant` keyword-matcher with a real streaming chatbot powered by **Lovable AI Gateway** using `google/gemini-3-flash-preview`.

### What you get

- The same floating bottom-right chat bubble, but it actually understands questions
- Streaming token-by-token responses (modern feel)
- Markdown-formatted answers (bold, lists)
- Context-aware: knows the logged-in user's role, projects, tasks, budget, approvals
- Friendly error toasts for rate limits (429) and out-of-credits (402)
- Suggested prompts kept from current UI

### How it works

**1. Enable Lovable Cloud + Lovable AI** — required to provision the `LOVABLE_API_KEY` secret. No keys needed from you.

**2. New edge function `supabase/functions/chat/index.ts`**
- Accepts `{ messages, context }` from the client
- Builds a system prompt on the backend that includes the user's role + a compact summary of their projects/tasks/budget
- Calls `https://ai.gateway.lovable.dev/v1/chat/completions` with `model: "google/gemini-3-flash-preview"` and `stream: true`
- Returns the SSE stream straight to the client
- Handles 429 and 402 with clear JSON errors
- Registered in `supabase/config.toml` with `verify_jwt = false` (public)

**3. Rewrite `src/components/AIAssistant.tsx`**
- Remove `mockResponses` / `getResponse()`
- Add `streamChat()` helper that POSTs to the edge function and parses SSE line-by-line for true token-by-token rendering
- Pull live data from `useData()` and `useAuth()` and pass as `context` with each request
- Render assistant messages with `react-markdown`
- Show toast on 429 / 402
- `AbortController` cancels in-flight stream when the panel closes
- Cap history at last ~20 messages to control token cost

### Files

```text
NEW    supabase/functions/chat/index.ts
EDIT   supabase/config.toml                (register chat function, verify_jwt=false)
EDIT   src/components/AIAssistant.tsx      (real streaming + markdown)
NEW    package: react-markdown
```

### Out of scope (easy follow-ups)

- Persisting chat history across sessions (needs a `chat_messages` table)
- Tool calling so the AI can create tasks / approve requests
- Per-project scoped chats

