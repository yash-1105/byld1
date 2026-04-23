import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const tasks = Array.isArray(body?.tasks) ? body.tasks : [];
    const approvals = Array.isArray(body?.approvals) ? body.approvals : [];
    const budget = body?.budget ?? {};
    const projects = Array.isArray(body?.projects) ? body.projects : [];
    const siteUpdates = Array.isArray(body?.siteUpdates) ? body.siteUpdates : [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectsText = projects.slice(0, 10).map((p: any) =>
      `- ${p.name} (status: ${p.status}, progress: ${p.progress}%, budget: $${p.budget}, spent: $${p.spent}, deadline: ${p.deadline})`
    ).join("\n") || "none";

    const tasksText = tasks.slice(0, 40).map((t: any) =>
      `- [${t.status}] ${t.title} (priority: ${t.priority}, deadline: ${t.deadline})`
    ).join("\n") || "none";

    const approvalsText = approvals.slice(0, 20).map((a: any) =>
      `- ${a.title ?? "Approval"} (${a.status ?? "pending"})`
    ).join("\n") || "none";

    const updatesText = siteUpdates.slice(0, 15).map((u: any) =>
      `- [${u.type}] ${u.title}: ${u.description}`
    ).join("\n") || "none";

    const budgetText = `Total: $${budget?.total ?? 0}, Spent: $${budget?.spent ?? 0}, Utilization: ${budget?.utilization ?? "?"}%`;

    const systemPrompt = `You are BYLD AI, a construction project risk and opportunity analyst.
Analyze the provided project data and return 3 to 6 actionable insights.

You MUST call the function "report_insights" with a structured insights array.
Each insight has:
- title: short actionable headline (max 60 chars)
- description: 1-2 sentences explaining the insight and what to do
- severity: "low" | "medium" | "high"
- category: one of "schedule" | "budget" | "quality" | "approval" | "resource" | "opportunity"

Focus on: overdue tasks, budget overruns, blocked approvals, recurring issues, deadline risks, and opportunities to accelerate.
Do not invent facts. If data is sparse, say so in a single low-severity insight.`;

    const userPrompt = `## Projects\n${projectsText}\n\n## Tasks\n${tasksText}\n\n## Approvals\n${approvalsText}\n\n## Budget\n${budgetText}\n\n## Recent Site Updates\n${updatesText}`;

    const tools = [{
      type: "function",
      function: {
        name: "report_insights",
        description: "Return structured project insights",
        parameters: {
          type: "object",
          properties: {
            insights: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] },
                  category: { type: "string", enum: ["schedule", "budget", "quality", "approval", "resource", "opportunity"] },
                },
                required: ["title", "description", "severity", "category"],
                additionalProperties: false,
              },
            },
          },
          required: ["insights"],
          additionalProperties: false,
        },
      },
    }];

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
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "report_insights" } },
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
      console.error("ai-insights gateway error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    let insights: any[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        insights = Array.isArray(parsed?.insights) ? parsed.insights : [];
      } catch (err) {
        console.error("Failed to parse tool args", err);
      }
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});