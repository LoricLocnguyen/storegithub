import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query, category, mode } = await req.json();
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY missing");

    const sys = `Bạn là chuyên gia Prompt Engineering. Nhiệm vụ: tạo các prompt CHẤT LƯỢNG CAO bằng tiếng Việt (hoặc tiếng Anh nếu phù hợp với mô hình AI đích) cho người dùng.
QUY TẮC:
- Mỗi prompt phải cụ thể, có cấu trúc rõ ràng, nêu rõ vai trò - bối cảnh - nhiệm vụ - định dạng đầu ra.
- Phân loại đúng category: "Công nghệ", "Hình ảnh", "Video", "Code/Lập trình", "Viết lách", "Marketing", "Học tập", "Năng suất", "Hacker/Bảo mật", "Roleplay", "Phân tích dữ liệu", "Chatbot", "Khác".
- target_model: model AI phù hợp nhất ("ChatGPT", "Claude", "Gemini", "Midjourney", "DALL-E", "Sora", "Suno", "Cursor", v.v.)
- title ngắn gọn, description 1 câu giải thích prompt làm gì, content là prompt thực tế người dùng có thể copy dùng ngay.
- tags: 3-6 từ khóa.`;

    const user = mode === "refine"
      ? `Tinh chỉnh / nâng cấp prompt sau thành 3 phiên bản tốt hơn (rõ ràng, có cấu trúc, ép định dạng output):\n\n"${query}"`
      : query
      ? `Tạo 6 prompt chất lượng cao về chủ đề: "${query}"${category ? ` thuộc danh mục "${category}"` : ""}.`
      : `Tạo 8 prompt chất lượng cao đa dạng thuộc danh mục "${category || "Công nghệ"}".`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        tools: [{
          type: "function",
          function: {
            name: "return_prompts",
            parameters: {
              type: "object",
              properties: {
                prompts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      content: { type: "string" },
                      category: { type: "string" },
                      target_model: { type: "string" },
                      tags: { type: "array", items: { type: "string" } },
                    },
                    required: ["title", "description", "content", "category"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["prompts"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_prompts" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Hết credits" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("AI gateway error");
    }
    const data = await resp.json();
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) throw new Error("No data");
    const parsed = JSON.parse(tc.function.arguments);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
