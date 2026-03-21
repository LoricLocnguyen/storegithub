import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Bạn là chuyên gia phân tích dự án crypto/airdrop. Khi được hỏi về một dự án, hãy trả về thông tin chi tiết nhất có thể bằng tiếng Việt. Bạn PHẢI trả lời theo đúng format được yêu cầu.`
          },
          {
            role: "user",
            content: `Phân tích dự án airdrop/crypto: "${projectName}"

Trả về thông tin theo ĐÚNG format sau (giữ nguyên tên field):
`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_airdrop_info",
              description: "Return structured airdrop project information",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Tên chính thức của dự án" },
                  description: { type: "string", description: "Mô tả chi tiết về dự án (2-4 câu)" },
                  website_url: { type: "string", description: "URL website chính thức, hoặc rỗng nếu không biết" },
                  logo_url: { type: "string", description: "URL logo chính thức, hoặc rỗng nếu không biết" },
                  status: { type: "string", enum: ["running", "upcoming", "ended"], description: "Trạng thái hiện tại" },
                  blockchain: { type: "string", description: "Blockchain chính (Ethereum, Solana, Arbitrum, Base, etc.)" },
                  start_date: { type: "string", description: "Ngày bắt đầu (YYYY-MM-DD) hoặc rỗng" },
                  end_date: { type: "string", description: "Ngày kết thúc (YYYY-MM-DD) hoặc rỗng" },
                  guide: { type: "string", description: "Hướng dẫn tham gia airdrop chi tiết, từng bước, bằng tiếng Việt" },
                  estimated_value: { type: "string", description: "Ước tính giá trị airdrop (ví dụ: $100-$500)" },
                  difficulty: { type: "string", enum: ["easy", "medium", "hard"], description: "Mức độ khó để tham gia" },
                  funding: { type: "string", description: "Thông tin về vòng gọi vốn (ví dụ: $10M Series A từ a16z)" },
                  twitter_url: { type: "string", description: "URL Twitter/X chính thức" },
                  discord_url: { type: "string", description: "URL Discord chính thức" },
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

    // Try to find a working logo URL
    let domain = "";
    if (projectInfo.website_url) {
      try { domain = new URL(projectInfo.website_url).hostname; } catch { /* ignore */ }
    }
    if (!domain && projectInfo.name) {
      domain = projectInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '') + ".io";
    }

    // Try multiple logo sources to find one that works
    if (domain) {
      const logoSources = [
        `https://img.logo.dev/${domain}?token=pk_anonymous&size=128`,
        `https://logo.clearbit.com/${domain}`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      ];

      // Check if AI already provided a valid logo_url
      if (projectInfo.logo_url && projectInfo.logo_url.startsWith("http")) {
        // Keep AI's logo, add fallbacks
      } else {
        // Try each source, use the first one that responds
        for (const url of logoSources) {
          try {
            const check = await fetch(url, { method: "HEAD", redirect: "follow" });
            const ct = check.headers.get("content-type") || "";
            if (check.ok && (ct.includes("image") || ct.includes("icon"))) {
              projectInfo.logo_url = url;
              break;
            }
          } catch { /* try next */ }
        }
        // Ultimate fallback
        if (!projectInfo.logo_url) {
          projectInfo.logo_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(projectInfo.name)}&background=6d28d9&color=fff&size=128&bold=true`;
        }
      }
    } else if (!projectInfo.logo_url) {
      projectInfo.logo_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(projectInfo.name)}&background=6d28d9&color=fff&size=128&bold=true`;
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
