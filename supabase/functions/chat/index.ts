import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatContext {
  user?: { name?: string; role?: string };
  projects?: Array<Record<string, unknown>>;
  tasks?: Array<Record<string, unknown>>;
  budgetItems?: Array<Record<string, unknown>>;
  siteUpdates?: Array<Record<string, unknown>>;
  notifications?: Array<Record<string, unknown>>;
}

function buildSystemPrompt(context: ChatContext): string {
  const { user, projects = [], tasks = [], budgetItems = [], siteUpdates = [] } = context;

  const projectSummary = projects
    .slice(0, 10)
    .map((p: any) => `- ${p.name} (${p.status}, ${p.progress}% complete, budget $${p.budget})`)
    .join("\n");

  const taskSummary = tasks
    .slice(0, 20)
    .map((t: any) => `- [${t.status}] ${t.title} (priority: ${t.priority}${t.dueDate ? `, due ${t.dueDate}` : ""})`)
    .join("\n");

  const budgetSummary = budgetItems
    .slice(0, 15)
    .map((b: any) => `- ${b.category}: allocated $${b.allocated}, spent $${b.spent}`)
    .join("\n");

  const updatesSummary = siteUpdates
    .slice(0, 5)
    .map((u: any) => `- ${u.title}: ${u.description}`)
    .join("\n");

  return `You are BYLD AI, an intelligent assistant for the BYLD construction project management platform.

Current user: ${user?.name ?? "Unknown"} (role: ${user?.role ?? "user"})

## Active Projects
${projectSummary || "No projects available."}

## Recent Tasks
${taskSummary || "No tasks available."}

## Budget Overview
${budgetSummary || "No budget data available."}

## Recent Site Updates
${updatesSummary || "No updates available."}

Guidelines:
- Be concise, helpful, and professional.
- Use markdown formatting (bold, lists) for clarity.
- Reference specific projects, tasks, or numbers when relevant.
- If asked about something not in the context, say so honestly.
- Tailor responses to the user's role (architect, contractor, client, consultant).`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json() as {
      messages: ChatMessage[];
      context?: ChatContext;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(context ?? {});

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings → Workspace → Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});