import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { query, history } = await req.json();
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY missing");
    if (!query?.trim()) throw new Error("Empty query");

    const sys = `Bạn là trợ lý AI chuyên TÌM TÀI LIỆU & FILE HỌC TẬP MIỄN PHÍ trên internet. Nhiệm vụ:
- Lắng nghe yêu cầu của người dùng (ví dụ: "tìm file code học React", "ebook Python miễn phí", "tài liệu OWASP", "khóa học machine learning")
- Trả về DANH SÁCH NGUỒN HỌC TẬP CHẤT LƯỢNG: repo GitHub, ebook PDF công khai, khóa học miễn phí, cheatsheet, video, bài viết.
- Mỗi item PHẢI có link THẬT (ưu tiên github.com, freecodecamp.org, mdn, w3schools, coursera, edx, youtube, archive.org, ocw.mit.edu, github raw PDF, awesome-* lists).
- KHÔNG bịa link. Nếu không chắc, ưu tiên link trang chủ chính thức của dự án.
- Trả lời ngắn gọn bằng tiếng Việt: 1 câu reply giới thiệu + 5-10 file/tài liệu.

Phân loại type: "github" | "pdf" | "course" | "video" | "article" | "cheatsheet" | "ebook" | "tool".`;

    const messages: any[] = [{ role: "system", content: sys }];
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h?.role && h?.content) messages.push({ role: h.role, content: String(h.content).slice(0, 2000) });
      }
    }
    messages.push({ role: "user", content: query });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [{
          type: "function",
          function: {
            name: "return_resources",
            parameters: {
              type: "object",
              properties: {
                reply: { type: "string", description: "1-2 câu trả lời tiếng Việt giới thiệu kết quả" },
                resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      url: { type: "string" },
                      type: { type: "string" },
                      tags: { type: "array", items: { type: "string" } },
                      level: { type: "string", description: "Cơ bản | Trung bình | Nâng cao" },
                    },
                    required: ["title", "description", "url", "type"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["reply", "resources"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_resources" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu, thử lại sau" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Hết credits AI" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
