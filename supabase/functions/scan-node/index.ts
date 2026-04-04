import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { name, type } = await req.json();
    if (!name || !type) {
      return new Response(JSON.stringify({ error: "Missing name or type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const typeLabel = type === "repo" ? "GitHub Repository" : type === "airdrop" ? "Dự án Airdrop/Crypto" : "Công cụ AI";

    const prompt = `Phân tích CHI TIẾT về "${name}" (loại: ${typeLabel}).

Trả về JSON thuần túy (KHÔNG markdown, KHÔNG backticks) với cấu trúc sau:
{
  "name": "Tên chính thức",
  "type": "${type}",
  "summary": "Mô tả tổng quan 2-3 câu",
  "keyFeatures": ["tính năng 1", "tính năng 2", "tính năng 3", "tính năng 4", "tính năng 5"],
  "useCases": ["use case 1", "use case 2", "use case 3"],
  "techStack": ["công nghệ 1", "công nghệ 2", "công nghệ 3"],
  "strengths": ["điểm mạnh 1", "điểm mạnh 2", "điểm mạnh 3"],
  "weaknesses": ["điểm yếu 1", "điểm yếu 2"],
  "competitors": ["đối thủ 1", "đối thủ 2", "đối thủ 3"],
  "ecosystem": "Thuộc hệ sinh thái nào (VD: Web3, AI, DevOps...)",
  "maturity": "early|growing|mature|declining",
  "communitySize": "small|medium|large|massive",
  "pricing": "Mô tả giá",
  "website": "URL website chính thức hoặc rỗng",
  "rating": 8.5,
  "verdict": "Đánh giá tổng kết 1-2 câu, nên dùng hay không, phù hợp với ai"
}

Quy tắc:
- Phân tích thực tế, khách quan dựa trên kiến thức thực
- Rating từ 1-10 (số thập phân)
- Liệt kê đầy đủ tính năng chính
- Nếu không biết thì ghi "Không rõ", KHÔNG bịa`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Bạn là chuyên gia phân tích công nghệ. Luôn trả lời bằng JSON thuần túy tiếng Việt, không markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu, thử lại sau." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Hết credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Lỗi AI gateway" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { error: "Could not parse AI response", raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-node error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
