import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const imageHeaders = { "User-Agent": "Mozilla/5.0 (compatible; LovableBot/1.0)" };

const getDomainFromUrl = (url?: string | null) => {
  if (!url) return null;
  try { return new URL(url).hostname; } catch { return null; }
};

const getOriginFromUrl = (url?: string | null) => {
  if (!url) return null;
  try { return new URL(url).origin; } catch { return null; }
};

const makeAbsoluteUrl = (value: string, base: string) => {
  try { return new URL(value, base).toString(); } catch { return null; }
};

const looksLikeImageResponse = (ct: string | null, url: string) => {
  const n = (ct || "").toLowerCase();
  return n.includes("image") || n.includes("icon") || /\.(ico|png|jpg|jpeg|svg|webp)$/i.test(url);
};

const isReachableImage = async (url?: string | null) => {
  if (!url || !url.startsWith("http")) return false;
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow", headers: imageHeaders });
    return r.ok && looksLikeImageResponse(r.headers.get("content-type"), url);
  } catch { return false; }
};

const discoverLogoFromWebsite = async (websiteUrl?: string | null) => {
  if (!websiteUrl) return null;
  try {
    const response = await fetch(websiteUrl, { redirect: "follow", headers: imageHeaders });
    if (!response.ok) return null;
    const html = await response.text();
    const origin = getOriginFromUrl(response.url || websiteUrl);
    const candidates = new Set<string>();
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m?.[1]) { const a = makeAbsoluteUrl(m[1], response.url || websiteUrl); if (a) candidates.add(a); }
    }
    if (origin) { candidates.add(`${origin}/apple-touch-icon.png`); candidates.add(`${origin}/favicon.ico`); }
    for (const c of candidates) { if (await isReachableImage(c)) return c; }
  } catch {}
  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { toolName } = await req.json();
    if (!toolName) {
      return new Response(JSON.stringify({ error: "Missing toolName" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Bạn là chuyên gia về AI tools và phần mềm công nghệ. Khi được hỏi về một tool/phần mềm, hãy trả về thông tin chi tiết nhất có thể bằng tiếng Việt.

QUY TẮC:
- website_url: Phải là domain chính thức, KHÔNG phải docs hay blog
- twitter_url: Phải là tài khoản Twitter/X CHÍNH THỨC của tool, KHÔNG phải founder. Rỗng nếu không chắc chắn 100%
- discord_url: Phải là server Discord CHÍNH THỨC. Rỗng nếu không chắc chắn 100%
- github_url: URL GitHub repo chính thức nếu là open source. Rỗng nếu không có
- logo_url: URL logo chính thức, rỗng nếu không chắc chắn
- category: Phân loại chính xác (AI Chatbot, AI Image, AI Code, AI Video, AI Audio, AI Writing, AI Productivity, Developer Tool, Design Tool, Data Tool, etc.)
- pricing: Thông tin giá (Free, Freemium, Paid, Open Source, etc.)
- popularity: "popular" nếu phổ biến rộng rãi, "growing" nếu đang phát triển nhanh, "emerging" nếu mới nổi/chưa được nhiều người biết
- features: Liệt kê các tính năng chính
- use_cases: Các trường hợp sử dụng phổ biến`
          },
          {
            role: "user",
            content: `Phân tích AI tool/phần mềm: "${toolName}". Tìm chính xác thông tin chính thức.`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_tool_info",
            description: "Return structured AI tool information",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Tên chính thức" },
                description: { type: "string", description: "Mô tả chi tiết (2-4 câu)" },
                website_url: { type: "string", description: "URL website chính thức" },
                logo_url: { type: "string", description: "URL logo chính thức" },
                category: { type: "string", description: "Phân loại (AI Chatbot, AI Image, AI Code, etc.)" },
                pricing: { type: "string", description: "Mô hình giá (Free, Freemium, Paid, Open Source)" },
                status: { type: "string", enum: ["active", "beta", "discontinued"], description: "Trạng thái" },
                popularity: { type: "string", enum: ["popular", "growing", "emerging"], description: "Mức độ phổ biến" },
                features: { type: "string", description: "Các tính năng chính (liệt kê)" },
                use_cases: { type: "string", description: "Các trường hợp sử dụng phổ biến" },
                twitter_url: { type: "string", description: "Twitter/X chính thức. Rỗng nếu không chắc chắn" },
                discord_url: { type: "string", description: "Discord chính thức. Rỗng nếu không chắc chắn" },
                github_url: { type: "string", description: "GitHub repo chính thức. Rỗng nếu không có" },
              },
              required: ["name", "description", "category", "status", "popularity"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_tool_info" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Quá nhiều yêu cầu, thử lại sau." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Hết credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Lỗi AI gateway" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return new Response(JSON.stringify({ error: "AI không trả về dữ liệu" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const toolInfo = JSON.parse(toolCall.function.arguments);

    // Verify and find logo
    if (!(await isReachableImage(toolInfo.logo_url))) toolInfo.logo_url = null;
    if (!toolInfo.logo_url && toolInfo.website_url) toolInfo.logo_url = await discoverLogoFromWebsite(toolInfo.website_url);

    const domain = getDomainFromUrl(toolInfo.website_url) || (toolInfo.name ? `${toolInfo.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` : null);
    if (!toolInfo.logo_url && domain) {
      for (const c of [
        `https://img.logo.dev/${domain}?token=pk_anonymous&size=128`,
        `https://logo.clearbit.com/${domain}`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      ]) {
        if (await isReachableImage(c)) { toolInfo.logo_url = c; break; }
      }
    }

    return new Response(JSON.stringify(toolInfo), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-ai-tool error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
