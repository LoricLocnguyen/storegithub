import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, description } = await req.json();
    if (!topic || typeof topic !== "string") {
      return new Response(JSON.stringify({ error: "Thiếu chủ đề" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Bạn là một mentor lập trình giàu kinh nghiệm. Khi nhận chủ đề, hãy tạo một LỘ TRÌNH HỌC TẬP có cấu trúc bằng tiếng Việt. LUÔN trả về bằng tool call generate_roadmap với đầy đủ markdown_summary và mảng items theo thứ tự logic từ cơ bản đến nâng cao.`;

    const userPrompt = `Chủ đề: ${topic}\n${description ? `Mô tả thêm: ${description}\n` : ""}\nTạo lộ trình 6-10 bước, mỗi bước có tài nguyên thực tế (repo GitHub nổi tiếng, công cụ AI, bài viết, khóa học). Markdown summary bao gồm tổng quan, mục tiêu, kỹ năng cần có và lời khuyên.`;

    const tools = [{
      type: "function",
      function: {
        name: "generate_roadmap",
        description: "Trả về lộ trình học tập có cấu trúc",
        parameters: {
          type: "object",
          properties: {
            markdown_summary: { type: "string", description: "Markdown tiếng Việt mô tả tổng quan lộ trình, mục tiêu, kỹ năng" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  item_type: { type: "string", enum: ["repo", "tool", "article", "course", "video"] },
                  url: { type: "string", description: "URL tài nguyên (GitHub repo, website, v.v.)" },
                },
                required: ["title", "description", "item_type"],
                additionalProperties: false,
              },
            },
          },
          required: ["markdown_summary", "items"],
          additionalProperties: false,
        },
      },
    }];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "generate_roadmap" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu, thử lại sau." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Hết credits, vui lòng nạp thêm." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI error:", resp.status, t);
      return new Response(JSON.stringify({ error: "Lỗi AI gateway" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI không trả về kết quả hợp lệ" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-roadmap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
