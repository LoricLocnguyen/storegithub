import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RepoMeta {
  full_name: string;
  description?: string;
  language?: string;
  stargazers_count?: number;
  forks_count?: number;
  open_issues_count?: number;
  updated_at?: string;
  topics?: string[];
}

async function ghFetch(path: string) {
  const headers: Record<string, string> = { "Accept": "application/vnd.github+json" };
  const token = Deno.env.get("GITHUB_TOKEN");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub ${path} -> ${res.status}`);
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fullName } = await req.json();
    if (!fullName || typeof fullName !== "string" || !fullName.includes("/")) {
      return new Response(JSON.stringify({ error: "fullName required (owner/repo)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [owner, repo] = fullName.split("/");

    // Fetch GitHub data in parallel (graceful failure)
    const [repoData, languages, commitActivity, contributors, pulls] = await Promise.all([
      ghFetch(`/repos/${owner}/${repo}`).catch(() => null),
      ghFetch(`/repos/${owner}/${repo}/languages`).catch(() => ({})),
      ghFetch(`/repos/${owner}/${repo}/stats/commit_activity`).catch(() => []),
      ghFetch(`/repos/${owner}/${repo}/contributors?per_page=10`).catch(() => []),
      ghFetch(`/repos/${owner}/${repo}/pulls?state=all&per_page=1`).catch(() => []),
    ]);

    // Languages -> percentage
    const totalBytes = Object.values(languages || {}).reduce((s: number, v: any) => s + (v as number), 0) || 1;
    const languageBreakdown = Object.entries(languages || {})
      .map(([name, bytes]) => ({ name, value: Math.round(((bytes as number) / totalBytes) * 1000) / 10 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Commit activity -> last 12 weeks
    const activity = Array.isArray(commitActivity) ? commitActivity.slice(-12).map((w: any, i: number) => ({
      week: `T${i + 1}`,
      commits: w.total || 0,
    })) : [];

    const contributorsCount = Array.isArray(contributors) ? contributors.length : 0;
    const topContributors = Array.isArray(contributors)
      ? contributors.slice(0, 5).map((c: any) => ({ name: c.login, commits: c.contributions, avatar: c.avatar_url }))
      : [];

    const meta: RepoMeta = repoData || { full_name: fullName };

    // AI insights — structured JSON
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiInsights: any = null;

    if (LOVABLE_API_KEY) {
      const aiPrompt = `Analyze this GitHub repository and return STRICT JSON in Vietnamese (no markdown, no code fences):
Repo: ${meta.full_name}
Language: ${meta.language || "?"}
Stars: ${meta.stargazers_count}
Forks: ${meta.forks_count}
Open issues: ${meta.open_issues_count}
Contributors: ${contributorsCount}
Recent commits (12w): ${activity.reduce((s, a) => s + a.commits, 0)}
Topics: ${(meta.topics || []).join(", ")}
Description: ${meta.description || "?"}

Return JSON with this exact shape:
{
  "health": { "score": number 0-100, "label": "Xuất sắc|Tốt|Khá|Yếu" },
  "complexity": { "score": number 0-100, "label": "Đơn giản|Trung bình|Phức tạp|Rất phức tạp" },
  "activity": { "score": number 0-100, "label": "Sôi động|Ổn định|Chậm|Đình trệ" },
  "community": { "score": number 0-100, "label": "Lớn mạnh|Đang phát triển|Nhỏ|Hạn chế" },
  "maintenance": { "score": number 0-100, "label": "Tích cực|Đều đặn|Ít|Không bảo trì" },
  "strengths": ["3 điểm mạnh ngắn"],
  "concerns": ["3 vấn đề tiềm ẩn ngắn"],
  "trend": "tăng trưởng mạnh|ổn định|chững lại|suy giảm",
  "trend_reason": "1 câu giải thích bằng tiếng Việt",
  "future_prediction": "2-3 câu dự đoán tương lai dự án bằng tiếng Việt",
  "use_cases": ["3 use case ngắn"],
  "code_quality": { "score": number 0-100, "notes": "1-2 câu nhận xét bằng tiếng Việt" }
}`;

      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Return strict JSON only. No prose, no code fences." },
              { role: "user", content: aiPrompt },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (aiRes.ok) {
          const data = await aiRes.json();
          const txt = data.choices?.[0]?.message?.content || "{}";
          try { aiInsights = JSON.parse(txt); } catch { aiInsights = null; }
        }
      } catch (e) {
        console.error("AI insights error:", e);
      }
    }

    return new Response(JSON.stringify({
      languageBreakdown,
      activity,
      contributorsCount,
      topContributors,
      pullRequests: Array.isArray(pulls) ? pulls.length : 0,
      stats: {
        stars: meta.stargazers_count || 0,
        forks: meta.forks_count || 0,
        issues: meta.open_issues_count || 0,
      },
      ai: aiInsights,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-repo-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
