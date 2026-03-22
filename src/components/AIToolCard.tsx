import { ExternalLink, Globe, Sparkles, Tag, DollarSign, Star, Cpu, Github } from "lucide-react";

export interface AITool {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  category: string | null;
  pricing: string | null;
  status: string;
  popularity: string | null;
  features: string | null;
  use_cases: string | null;
  twitter_url: string | null;
  discord_url: string | null;
  github_url: string | null;
  created_at: string;
}

const popularityLabels: Record<string, { label: string; color: string }> = {
  popular: { label: "Phổ biến", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  growing: { label: "Đang phát triển", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  emerging: { label: "Mới nổi", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  active: { label: "Hoạt động", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  beta: { label: "Beta", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  discontinued: { label: "Ngừng", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const getWebsiteOrigin = (url: string | null) => {
  if (!url) return null;
  try { return new URL(url).origin; } catch { return null; }
};

const getWebsiteHostname = (url: string | null) => {
  if (!url) return null;
  try { return new URL(url).hostname; } catch { return null; }
};

const createFallbackLogo = (name: string) => {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "A";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="hsl(195 80% 45%)"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="700" fill="white">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getLogoCandidates = (tool: AITool) => {
  const origin = getWebsiteOrigin(tool.website_url);
  const hostname = getWebsiteHostname(tool.website_url);
  return Array.from(new Set([
    tool.logo_url,
    origin ? `${origin}/apple-touch-icon.png` : null,
    origin ? `${origin}/favicon.ico` : null,
    hostname ? `https://icons.duckduckgo.com/ip3/${hostname}.ico` : null,
    createFallbackLogo(tool.name),
  ].filter((v): v is string => Boolean(v))));
};

const handleLogoError = (tool: AITool) => (e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  const candidates = getLogoCandidates(tool);
  const idx = Number(img.dataset.fallbackIndex ?? "0") + 1;
  if (idx < candidates.length) { img.dataset.fallbackIndex = String(idx); img.src = candidates[idx]; }
};

function ToolLogo({ tool, className }: { tool: AITool; className: string }) {
  const candidates = getLogoCandidates(tool);
  return <img src={candidates[0]} alt={tool.name} className={className} data-fallback-index="0" onError={handleLogoError(tool)} />;
}

interface AIToolCardProps { tool: AITool; isSelected: boolean; onClick: () => void; }

export function AIToolCard({ tool, isSelected, onClick }: AIToolCardProps) {
  const popInfo = tool.popularity ? popularityLabels[tool.popularity] : null;

  return (
    <button onClick={onClick} className={`w-full text-left p-4 rounded-lg transition-all duration-300 glow-card ${isSelected ? "neon-border !border-primary/60 !shadow-[0_0_24px_hsl(195_80%_55%/0.2)]" : ""}`}>
      <div className="flex items-center gap-3 mb-2">
        <ToolLogo tool={tool} className="w-8 h-8 rounded-full ring-1 ring-border object-cover bg-muted/50" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{tool.name}</p>
          {tool.category && <p className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3" />{tool.category}</p>}
        </div>
        {popInfo && <span className={`text-[10px] px-2 py-0.5 rounded-full border ${popInfo.color}`}>{popInfo.label}</span>}
      </div>
      {tool.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{tool.description}</p>}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {tool.pricing && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{tool.pricing}</span>}
      </div>
    </button>
  );
}

export function AIToolDetail({ tool }: { tool: AITool }) {
  const popInfo = tool.popularity ? popularityLabels[tool.popularity] : null;
  const statInfo = statusLabels[tool.status] || statusLabels.active;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-start gap-5 mb-8">
        <ToolLogo tool={tool} className="w-16 h-16 rounded-xl ring-2 ring-border animate-float object-cover bg-muted/50" />
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold neon-text truncate">{tool.name}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-xs px-3 py-1 rounded-full border ${statInfo.color}`}>{statInfo.label}</span>
            {popInfo && <span className={`text-xs px-3 py-1 rounded-full border ${popInfo.color}`}>{popInfo.label}</span>}
            {tool.category && <span className="text-xs px-3 py-1 rounded-full border border-border text-muted-foreground">{tool.category}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {tool.website_url && (
            <a href={tool.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
              <Globe className="w-4 h-4" /> Website
            </a>
          )}
        </div>
      </div>

      {tool.description && <p className="text-foreground/80 text-base leading-relaxed mb-8">{tool.description}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="glow-card rounded-xl p-4 text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-lg font-bold text-foreground">{tool.pricing || "N/A"}</p>
          <p className="text-xs text-muted-foreground">Giá</p>
        </div>
        <div className="glow-card rounded-xl p-4 text-center">
          <Star className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className={`text-lg font-bold ${popInfo?.color.split(" ")[1] || "text-foreground"}`}>{popInfo?.label || "N/A"}</p>
          <p className="text-xs text-muted-foreground">Mức phổ biến</p>
        </div>
        <div className="glow-card rounded-xl p-4 text-center">
          <Cpu className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className={`text-lg font-bold ${statInfo.color.split(" ")[1] || "text-foreground"}`}>{statInfo.label}</p>
          <p className="text-xs text-muted-foreground">Trạng thái</p>
        </div>
      </div>

      {tool.features && (
        <div className="glow-card rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Tính năng chính</h3>
          <div className="text-foreground/80 text-sm whitespace-pre-wrap leading-relaxed">{tool.features}</div>
        </div>
      )}

      {tool.use_cases && (
        <div className="glow-card rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Cpu className="w-4 h-4 text-primary" /> Trường hợp sử dụng</h3>
          <div className="text-foreground/80 text-sm whitespace-pre-wrap leading-relaxed">{tool.use_cases}</div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-6">
        {tool.github_url && (
          <a href={tool.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors text-sm">
            <Github className="w-4 h-4" /> GitHub
          </a>
        )}
        {tool.twitter_url && (
          <a href={tool.twitter_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors text-sm">
            <ExternalLink className="w-4 h-4" /> Twitter
          </a>
        )}
        {tool.discord_url && (
          <a href={tool.discord_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors text-sm">
            <ExternalLink className="w-4 h-4" /> Discord
          </a>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Thêm vào: {new Date(tool.created_at).toLocaleDateString("vi-VN")}</p>
    </div>
  );
}
