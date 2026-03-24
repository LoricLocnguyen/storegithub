import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { existingRepos, category } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const categoryPrompts: Record<string, string> = {
      learning: "các repo GitHub phổ biến nhất để HỌC TẬP lập trình, khoa học máy tính, thuật toán, cấu trúc dữ liệu, và tài liệu giáo dục (ví dụ: freeCodeCamp, coding-interview-university, cs-video-courses, project-based-learning...)",
      ai: "các repo GitHub phổ biến nhất về AI, Machine Learning, Deep Learning, LLM, và các công cụ AI (ví dụ: transformers, langchain, stable-diffusion, ollama, open-interpreter...)",
      programming: "các repo GitHub phổ biến nhất về công cụ lập trình, framework, thư viện hữu ích cho developer (ví dụ: next.js, react, rust, go, deno, bun, shadcn-ui...)",
      trending: "các repo GitHub đang trending và nổi bật gần đây trên GitHub, đặc biệt là các dự án mới và đang phát triển nhanh",
    };

    const catDesc = categoryPrompts[category] || categoryPrompts.learning;
    const existingList = (existingRepos || []).join(", ");

    const prompt = `Tìm 10 ${catDesc}.

${existingList ? `KHÔNG bao gồm các repo đã có: ${existingList}` : ""}

Trả về JSON array, mỗi phần tử có format:
{
  "owner": "tên owner trên GitHub (chính xác)",
  "repo": "tên repo trên GitHub (chính xác)", 
  "reason": "lý do nên theo dõi repo này (1-2 câu tiếng Việt)"
}

CHỈ trả về JSON array, không có text khác. Đảm bảo owner/repo là tên CHÍNH XÁC trên GitHub.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a GitHub expert. Return only valid JSON arrays. No markdown, no code blocks." },
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
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    let suggestions;
    try {
      suggestions = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response");
    }

    // Fetch real GitHub data for each suggestion
    const repos = [];
    for (const s of suggestions) {
      try {
        const ghResp = await fetch(`https://api.github.com/repos/${s.owner}/${s.repo}`, {
          headers: { "User-Agent": "Lovable-App" },
        });
        if (!ghResp.ok) continue;
        const repo = await ghResp.json();
        repos.push({
          id: repo.id,
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          html_url: repo.html_url,
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          language: repo.language,
          owner: { login: repo.owner.login, avatar_url: repo.owner.avatar_url },
          topics: repo.topics || [],
          updated_at: repo.updated_at,
          open_issues_count: repo.open_issues_count,
          reason: s.reason,
        });
      } catch (e) {
        console.error(`Failed to fetch ${s.owner}/${s.repo}:`, e);
      }
    }

    return new Response(JSON.stringify({ repos }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("discover-repos error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
