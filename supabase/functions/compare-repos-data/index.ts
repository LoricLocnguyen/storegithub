import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function ghFetch(path: string) {
  const headers: Record<string, string> = { "Accept": "application/vnd.github+json" };
  const token = Deno.env.get("GITHUB_TOKEN");
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) return null;
  return res.json();
}

async function fetchOne(fullName: string) {
  const [owner, repo] = fullName.split("/");
  const [info, contributors, pullsOpen, pullsClosed, commitActivity] = await Promise.all([
    ghFetch(`/repos/${owner}/${repo}`),
    ghFetch(`/repos/${owner}/${repo}/contributors?per_page=1&anon=true`),
    ghFetch(`/search/issues?q=repo:${owner}/${repo}+type:pr+state:open&per_page=1`),
    ghFetch(`/search/issues?q=repo:${owner}/${repo}+type:pr+state:closed&per_page=1`),
    ghFetch(`/repos/${owner}/${repo}/stats/commit_activity`),
  ]);

  // Contributors total: read Link header would be ideal, but fallback to len*estimate.
  // Use participation endpoint for commits in last 52 weeks
  const totalCommits52w = Array.isArray(commitActivity)
    ? commitActivity.reduce((s: number, w: any) => s + (w.total || 0), 0)
    : 0;
  const recentCommits4w = Array.isArray(commitActivity)
    ? commitActivity.slice(-4).reduce((s: number, w: any) => s + (w.total || 0), 0)
    : 0;

  return {
    fullName,
    contributors: Array.isArray(contributors) ? contributors.length : 0,
    openPRs: pullsOpen?.total_count ?? 0,
    closedPRs: pullsClosed?.total_count ?? 0,
    totalCommits52w,
    recentCommits4w,
    license: info?.license?.spdx_id || info?.license?.key || "—",
    defaultBranch: info?.default_branch || "main",
    size: info?.size || 0,
    watchers: info?.subscribers_count || 0,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { repos } = await req.json(); // repos: [{ fullName, name, stars, forks, issues, language, description }]
    if (!Array.isArray(repos) || repos.length < 2) {
      return new Response(JSON.stringify({ error: "Need at least 2 repos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const enriched = await Promise.all(repos.map((r: any) => fetchOne(r.fullName)));

    // AI verdict
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let verdict: any = null;

    if (LOVABLE_API_KEY) {
      const summary = repos.map((r: any, i: number) => {
        const e = enriched[i];
        return `- ${r.fullName}: ${r.stars}⭐, ${r.forks} forks, ${r.issues} issues, ${e.contributors}+ contributors, ${e.openPRs} open PRs, ${e.totalCommits52w} commits/year, license ${e.license}, lang ${r.language}. Mô tả: ${r.description || "n/a"}`;
      }).join("\n");

      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Return strict JSON only. Vietnamese content." },
              {
                role: "user",
                content: `So sánh các repo sau và trả JSON:
${summary}

Format:
{
  "summaries": [{ "fullName": "...", "summary": "1-2 câu", "best_for": "tình huống phù hợp nhất" }],
  "winner": "fullName của repo nổi bật nhất",
  "reason": "1-2 câu lý do"
}`,
              },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (aiRes.ok) {
          const data = await aiRes.json();
          try { verdict = JSON.parse(data.choices?.[0]?.message?.content || "{}"); } catch {}
        }
      } catch (e) {
        console.error("AI verdict error:", e);
      }
    }

    return new Response(JSON.stringify({ enriched, verdict }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("compare-repos-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
