import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { nodes } = await req.json();

    if (!nodes || !Array.isArray(nodes) || nodes.length < 2) {
      return new Response(JSON.stringify({ error: "Cần ít nhất 2 node để phân tích" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const nodeDescriptions = nodes.map((n: any, i: number) => 
      `${i + 1}. "${n.name}" (Loại: ${n.type === "repo" ? "GitHub Repository" : n.type === "airdrop" ? "Dự án Airdrop/Crypto" : "Công cụ AI"})`
    ).join("\n");

    const prompt = `Bạn là chuyên gia phân tích công nghệ và tư vấn startup. Hãy phân tích các node trên canvas và ĐỀ XUẤT Ý TƯỞNG DỰ ÁN cụ thể có thể xây dựng trong tương lai:

Danh sách node:
${nodeDescriptions}

Hãy trả lời bằng tiếng Việt theo đúng format JSON sau (KHÔNG có markdown, KHÔNG có backticks):
{
  "nodeFeatures": [
    { "name": "tên node", "features": ["tính năng 1", "tính năng 2", "tính năng 3"], "category": "phân loại ngắn" }
  ],
  "projectIdeas": [
    {
      "title": "Tên dự án gợi ý",
      "nodes": ["tên node 1", "tên node 2"],
      "description": "Mô tả chi tiết dự án có thể tạo ra",
      "howToBuild": "Hướng dẫn ngắn gọn cách bắt đầu xây dựng",
      "targetUsers": "Đối tượng người dùng mục tiêu",
      "potential": "Tiềm năng thị trường / giá trị mang lại",
      "difficulty": "dễ|trung bình|khó",
      "timeline": "thời gian ước tính (VD: 2-4 tuần)"
    }
  ],
  "summary": "tóm tắt tổng quan và lời khuyên chiến lược"
}

Quy tắc:
- Phân tích tính năng thực tế dựa trên tên và loại của mỗi node
- Đề xuất 2-5 ý tưởng dự án CỤ THỂ có thể xây dựng bằng cách kết hợp các node
- Ví dụ: Claude + Ollama = AI assistant chạy local, LangChain + Supabase = RAG chatbot với database
- Mỗi ý tưởng phải có tên dự án hấp dẫn, mô tả rõ ràng, và hướng dẫn bắt đầu
- Ưu tiên các ý tưởng có giá trị thực tiễn cao và khả thi`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Bạn là chuyên gia phân tích công nghệ. Luôn trả lời bằng JSON thuần túy, không markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu, vui lòng thử lại sau." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Hết credits, vui lòng nạp thêm." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from AI response, handling possible markdown wrapping
    let parsed;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { raw: content, error: "Could not parse AI response as JSON" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-nodes error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
