import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const imageHeaders = {
  "User-Agent": "Mozilla/5.0 (compatible; LovableBot/1.0)",
};

const getDomainFromUrl = (url?: string | null) => {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};

const getOriginFromUrl = (url?: string | null) => {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

const makeAbsoluteUrl = (value: string, base: string) => {
  try {
    return new URL(value, base).toString();
  } catch {
    return null;
  }
};

const looksLikeImageResponse = (contentType: string | null, url: string) => {
  const normalized = (contentType || "").toLowerCase();
  return normalized.includes("image") || normalized.includes("icon") || url.endsWith(".ico") || url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".svg") || url.endsWith(".webp");
};

const isReachableImage = async (url?: string | null) => {
  if (!url || !url.startsWith("http")) return false;

  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: imageHeaders,
    });

    if (!response.ok) return false;
    return looksLikeImageResponse(response.headers.get("content-type"), url);
  } catch {
    return false;
  }
};

const discoverLogoFromWebsite = async (websiteUrl?: string | null) => {
  if (!websiteUrl) return null;

  try {
    const response = await fetch(websiteUrl, {
      redirect: "follow",
      headers: imageHeaders,
    });

    if (!response.ok) return null;

    const html = await response.text();
    const origin = getOriginFromUrl(response.url || websiteUrl);
    const candidates = new Set<string>();

    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
      /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) {
        const absolute = makeAbsoluteUrl(match[1], response.url || websiteUrl);
        if (absolute) candidates.add(absolute);
      }
    }

    if (origin) {
      candidates.add(`${origin}/apple-touch-icon.png`);
      candidates.add(`${origin}/favicon.ico`);
    }

    for (const candidate of candidates) {
      if (await isReachableImage(candidate)) {
        return candidate;
      }
    }
  } catch {
    return null;
  }

  return null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectName } = await req.json();
    if (!projectName) {
      return new Response(JSON.stringify({ error: "Missing projectName" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Bạn là chuyên gia phân tích dự án crypto/airdrop với kiến thức sâu rộng về hệ sinh thái Web3. Khi được hỏi về một dự án, hãy trả về thông tin chi tiết nhất có thể bằng tiếng Việt.

QUY TẮC QUAN TRỌNG VỀ TWITTER VÀ DISCORD:
- Twitter/X: Phải là tài khoản CHÍNH THỨC của dự án, KHÔNG phải tài khoản cá nhân của founder hay team member. Format: https://x.com/TenDuAn hoặc https://twitter.com/TenDuAn
- Discord: Phải là server Discord CHÍNH THỨC của dự án, KHÔNG phải server chung hay server khác. Format: https://discord.gg/invite-code
- Nếu KHÔNG CHẮC CHẮN 100% đó là link chính thức → để trống (rỗng), KHÔNG được đoán hay bịa link
- KHÔNG trả về link Twitter/Discord của blockchain (ví dụ: đừng trả về Twitter của Ethereum khi hỏi về một dự án trên Ethereum)

QUY TẮC VỀ LOGO:
- Nếu không chắc logo chính thức thì để trống logo_url

QUY TẮC VỀ WEBSITE:
- Phải là domain chính thức của dự án, KHÔNG phải trang docs hay blog`
          },
          {
            role: "user",
            content: `Phân tích dự án airdrop/crypto: "${projectName}"

Lưu ý: Tìm chính xác tài khoản Twitter/X và Discord CHÍNH THỨC của dự án "${projectName}". Nếu không chắc chắn thì để trống.
`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_airdrop_info",
              description: "Return structured airdrop project information with verified official links only",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Tên chính thức của dự án" },
                  description: { type: "string", description: "Mô tả chi tiết về dự án (2-4 câu)" },
                  website_url: { type: "string", description: "URL website chính thức của dự án (không phải docs hay blog). Rỗng nếu không chắc chắn" },
                  logo_url: { type: "string", description: "URL logo chính thức, rỗng nếu không chắc chắn" },
                  status: { type: "string", enum: ["running", "upcoming", "ended"], description: "Trạng thái hiện tại" },
                  blockchain: { type: "string", description: "Blockchain chính (Ethereum, Solana, Arbitrum, Base, etc.)" },
                  start_date: { type: "string", description: "Ngày bắt đầu (YYYY-MM-DD) hoặc rỗng" },
                  end_date: { type: "string", description: "Ngày kết thúc (YYYY-MM-DD) hoặc rỗng" },
                  guide: { type: "string", description: "Hướng dẫn tham gia airdrop chi tiết, từng bước, bằng tiếng Việt" },
                  estimated_value: { type: "string", description: "Ước tính giá trị airdrop (ví dụ: $100-$500)" },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"], description: "Mức độ khó để tham gia" },
                  funding: { type: "string", description: "Thông tin về vòng gọi vốn (ví dụ: $10M Series A từ a16z)" },
                  twitter_url: { type: "string", description: "URL Twitter/X CHÍNH THỨC của dự án (ví dụ: https://x.com/layerzero_labs). PHẢI là tài khoản của dự án, KHÔNG phải founder hay blockchain. Rỗng nếu không chắc chắn 100%" },
                  discord_url: { type: "string", description: "URL Discord CHÍNH THỨC của dự án (ví dụ: https://discord.gg/layerzero). PHẢI là server của dự án. Rỗng nếu không chắc chắn 100%" },
                },
                required: ["name", "description", "status", "blockchain", "guide", "difficulty"],
                additionalProperties: false,
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_airdrop_info" } },
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
      return new Response(JSON.stringify({ error: "Lỗi AI gateway" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI không trả về dữ liệu" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectInfo = JSON.parse(toolCall.function.arguments);

    const currentLogoValid = await isReachableImage(projectInfo.logo_url);
    if (!currentLogoValid) {
      projectInfo.logo_url = null;
    }

    if (!projectInfo.logo_url && projectInfo.website_url) {
      projectInfo.logo_url = await discoverLogoFromWebsite(projectInfo.website_url);
    }

    const domain = getDomainFromUrl(projectInfo.website_url) || (projectInfo.name ? `${projectInfo.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.io` : null);
    const fallbackSources = domain
      ? [
          `https://img.logo.dev/${domain}?token=pk_anonymous&size=128`,
          `https://logo.clearbit.com/${domain}`,
          `https://icons.duckduckgo.com/ip3/${domain}.ico`,
          `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        ]
      : [];

    if (!projectInfo.logo_url) {
      for (const candidate of fallbackSources) {
        if (await isReachableImage(candidate)) {
          projectInfo.logo_url = candidate;
          break;
        }
      }
    }

    return new Response(JSON.stringify(projectInfo), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-airdrop error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
