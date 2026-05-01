import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { context } = await req.json();
    if (!context || typeof context !== "string") {
      return new Response(JSON.stringify({ error: "Thiếu nội dung" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Bạn là trợ lý sáng tạo cho lập trình viên. Người dùng đang phác thảo ý tưởng/sơ đồ trên canvas. Phân tích nội dung và gợi ý 4-6 repo GitHub, thư viện hoặc công cụ AI nổi tiếng có thể giúp họ. Trả lời bằng tiếng Việt qua tool call.`;

    const tools = [{
      type: "function",
      function: {
        name: "suggest_resources",
        description: "Gợi ý repo/tools",
        parameters: {
          type: "object",
          properties: {
            insights: { type: "string", description: "Markdown tiếng Việt phân tích ngắn về ý tưởng và lý do gợi ý" },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  url: { type: "string" },
                  why: { type: "string", description: "Lý do gợi ý bằng tiếng Việt" },
                  category: { type: "string" },
                },
                required: ["name", "url", "why", "category"],
                additionalProperties: false,
              },
            },
          },
          required: ["insights", "suggestions"],
          additionalProperties: false,
        },
      },
    }];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Nội dung canvas/sơ đồ của người dùng:\n${context}\n\nGợi ý các tài nguyên thực tế giúp họ hiện thực hóa ý tưởng.` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "suggest_resources" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu, thử lại sau." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Hết credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Lỗi AI gateway" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI không trả về kết quả" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("suggest-from-sketch error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
