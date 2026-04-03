import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea, nodes } = await req.json();

    if (!idea || !idea.title) {
      return new Response(JSON.stringify({ error: "Thiếu thông tin ý tưởng dự án" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const nodeList = (nodes || []).map((n: any) => `- ${n.name} (${n.type})`).join("\n");

    const prompt = `Bạn là kiến trúc sư phần mềm cấp cao và mentor công nghệ. Hãy tạo HƯỚNG DẪN TRIỂN KHAI CHI TIẾT cho dự án sau:

📌 Tên dự án: ${idea.title}
📝 Mô tả: ${idea.description}
🛠️ Công nghệ/Node liên quan:
${nodeList}
👥 Đối tượng: ${idea.targetUsers || "Chưa xác định"}
⏱️ Timeline dự kiến: ${idea.timeline || "Chưa xác định"}
📊 Độ khó: ${idea.difficulty || "Chưa xác định"}

Hãy trả lời bằng tiếng Việt, chi tiết và thực tế. Dùng format Markdown:

# 🚀 Hướng dẫn triển khai: ${idea.title}

## 1. Tổng quan kiến trúc
- Mô tả kiến trúc hệ thống (frontend, backend, API, database...)
- Sơ đồ luồng dữ liệu chính

## 2. Tech Stack đề xuất
- Liệt kê cụ thể framework, library, service cần dùng
- Giải thích lý do chọn từng công nghệ

## 3. Các bước triển khai chi tiết
### Bước 1: Setup dự án
### Bước 2: Xây dựng core feature
### Bước 3: Tích hợp các node/công cụ
### Bước 4: UI/UX
### Bước 5: Testing & Deploy

## 4. Code mẫu / Pseudocode
- Đoạn code mẫu cho phần quan trọng nhất

## 5. Thách thức & Giải pháp
- Những khó khăn có thể gặp và cách xử lý

## 6. Roadmap phát triển
- Phase 1 (MVP): ...
- Phase 2 (Growth): ...
- Phase 3 (Scale): ...

## 7. Tài nguyên học tập
- Link documentation, tutorial liên quan

Hãy viết chi tiết, thực tế và có thể hành động được ngay.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Bạn là kiến trúc sư phần mềm cấp cao, chuyên tư vấn và hướng dẫn triển khai dự án công nghệ. Trả lời chi tiết bằng Markdown." },
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

    return new Response(JSON.stringify({ guide: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("guide-project error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
