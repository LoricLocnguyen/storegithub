import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { existingNames, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const excludeList = (existingNames || []).map((n: string) => n.toLowerCase());

    const prompt = category
      ? `Liệt kê 10 AI tool/phần mềm thuộc danh mục "${category}" đang phổ biến hoặc mới nổi, KHÔNG bao gồm: ${excludeList.join(", ") || "không có"}.`
      : `Liệt kê 15 AI tool và phần mềm công nghệ đáng chú ý nhất hiện nay (2024-2025), bao gồm:
- 5 tool AI phổ biến nhất (ChatGPT, Claude, Midjourney, etc.)
- 5 tool đang phát triển nhanh
- 5 tool mới nổi ít người biết nhưng tiềm năng

KHÔNG bao gồm các tool đã có: ${excludeList.join(", ") || "không có"}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Bạn là chuyên gia về AI tools và phần mềm. Trả về danh sách các tool với thông tin chi tiết bằng tiếng Việt.

QUY TẮC:
- Chỉ trả về các tool/phần mềm THỰC SỰ tồn tại
- website_url: Domain chính thức
- category: AI Chatbot, AI Image, AI Code, AI Video, AI Audio, AI Writing, AI Productivity, Developer Tool, Design Tool, Data Tool, etc.
- pricing: Free, Freemium, Paid, Open Source
- popularity: "popular" nếu phổ biến, "growing" nếu đang phát triển, "emerging" nếu mới nổi
- description: Mô tả ngắn 1-2 câu bằng tiếng Việt
- features: Liệt kê tính năng chính
- use_cases: Trường hợp sử dụng phổ biến`
          },
          { role: "user", content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_tools_list",
            description: "Return a list of AI tools",
            parameters: {
              type: "object",
              properties: {
                tools: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      website_url: { type: "string" },
                      category: { type: "string" },
                      pricing: { type: "string" },
                      popularity: { type: "string", enum: ["popular", "growing", "emerging"] },
                      features: { type: "string" },
                      use_cases: { type: "string" },
                    },
                    required: ["name", "description", "category", "popularity"],
                    additionalProperties: false,
                  }
                }
              },
              required: ["tools"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_tools_list" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu, thử lại sau." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Hết credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI không trả về dữ liệu");

    const result = JSON.parse(toolCall.function.arguments);
    
    // Filter out any that match existing names
    const filtered = (result.tools || []).filter(
      (t: any) => !excludeList.includes(t.name.toLowerCase())
    );

    return new Response(JSON.stringify({ tools: filtered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("discover-ai-tools error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
