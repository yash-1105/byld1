import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SiteUpdateLite {
  title?: string;
  description?: string;
  type?: string;
  author?: string;
  createdAt?: string;
  projectId?: string;
}

function inRange(iso: string | undefined, range: string, from?: string, to?: string): boolean {
  if (!iso) return true;
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return true;
  const now = Date.now();
  if (range === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return d >= start.getTime();
  }
  if (range === "7d") {
    return d >= now - 7 * 24 * 60 * 60 * 1000;
  }
  if (range === "custom" && from && to) {
    const f = new Date(from).getTime();
    const t = new Date(to).getTime() + 24 * 60 * 60 * 1000;
    return d >= f && d <= t;
  }
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const updates: SiteUpdateLite[] = Array.isArray(body?.updates) ? body.updates : [];
    const range: string = body?.range ?? "7d";
    const from: string | undefined = body?.from;
    const to: string | undefined = body?.to;

    if (!Array.isArray(updates)) {
      return new Response(JSON.stringify({ error: "updates must be an array" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const filtered = updates.filter((u) => inRange(u.createdAt, range, from, to));

    if (filtered.length === 0) {
      return new Response(JSON.stringify({ summary: "No site updates found in the selected range." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updatesText = filtered
      .slice(0, 80)
      .map((u, i) => `${i + 1}. [${u.type ?? "update"}] ${u.title ?? "Untitled"} — ${u.description ?? ""} (by ${u.author ?? "unknown"} on ${u.createdAt ?? "?"})`)
      .join("\n");

    const rangeLabel = range === "today" ? "today" : range === "7d" ? "the last 7 days" : `${from} to ${to}`;

    const systemPrompt = `You are BYLD AI, a construction project communication summarizer.
Produce a clear, professional executive summary of the site updates below for ${rangeLabel}.

Format using markdown:
- Start with a 1-2 sentence overall status line.
- **Progress** — bullet key advances.
- **Issues & Risks** — bullet anything flagged as issue or delay.
- **Milestones** — bullet completed milestones.
- End with a brief recommended next action.

Be concise. Reference specific items. Do not invent facts not present in the updates.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Site updates for ${rangeLabel}:\n\n${updatesText}` },
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("ai-summarize gateway error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const summary: string = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ summary, count: filtered.length, range }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-summarize error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});