import { ExternalLink, Calendar, Zap, DollarSign, Shield, Globe, Trash2 } from "lucide-react";

export interface AirdropProject {
  id: string;
  name: string;
  description: string | null;
  website_url: string | null;
  logo_url: string | null;
  status: string;
  blockchain: string | null;
  start_date: string | null;
  end_date: string | null;
  guide: string | null;
  estimated_value: string | null;
  difficulty: string | null;
  funding: string | null;
  twitter_url: string | null;
  discord_url: string | null;
  created_at: string;
}

const chainColors: Record<string, string> = {
  Ethereum: "hsl(210 80% 55%)",
  Solana: "hsl(265 80% 60%)",
  Arbitrum: "hsl(210 90% 50%)",
  Optimism: "hsl(0 80% 55%)",
  Base: "hsl(220 90% 55%)",
  Polygon: "hsl(265 60% 55%)",
  BNB: "hsl(45 90% 50%)",
  Avalanche: "hsl(0 70% 50%)",
  Sui: "hsl(195 80% 55%)",
  Aptos: "hsl(160 60% 50%)",
  zkSync: "hsl(230 70% 55%)",
  Starknet: "hsl(25 80% 55%)",
};

const difficultyLabels: Record<string, { label: string; color: string }> = {
  easy: { label: "Dễ", color: "text-green-400" },
  medium: { label: "Trung bình", color: "text-yellow-400" },
  hard: { label: "Khó", color: "text-red-400" },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  running: { label: "Đang chạy", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  ended: { label: "Đã kết thúc", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  upcoming: { label: "Sắp ra mắt", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

interface AirdropCardProps {
  project: AirdropProject;
  isSelected: boolean;
  onClick: () => void;
}

export function AirdropCard({ project, isSelected, onClick }: AirdropCardProps) {
  const chainColor = project.blockchain ? chainColors[project.blockchain] || "hsl(var(--muted-foreground))" : undefined;
  const statusInfo = statusLabels[project.status] || statusLabels.running;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg transition-all duration-300 glow-card ${
        isSelected ? "neon-border !border-primary/60 !shadow-[0_0_24px_hsl(265_90%_65%/0.2)]" : ""
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <img
          src={project.logo_url || `https://www.google.com/s2/favicons?domain=${project.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.io&sz=128`}
          alt={project.name}
          className="w-8 h-8 rounded-full ring-1 ring-border object-cover bg-muted/50"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{project.name}</p>
          {project.blockchain && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: chainColor }} />
              {project.blockchain}
            </p>
          )}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {project.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{project.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {project.estimated_value && (
          <span className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            {project.estimated_value}
          </span>
        )}
        {project.difficulty && (
          <span className={`flex items-center gap-1 ${difficultyLabels[project.difficulty]?.color || ""}`}>
            <Shield className="w-3 h-3" />
            {difficultyLabels[project.difficulty]?.label || project.difficulty}
          </span>
        )}
      </div>
    </button>
  );
}

interface AirdropDetailProps {
  project: AirdropProject;
}

export function AirdropDetail({ project }: AirdropDetailProps) {
  const chainColor = project.blockchain ? chainColors[project.blockchain] || "hsl(var(--muted-foreground))" : undefined;
  const statusInfo = statusLabels[project.status] || statusLabels.running;
  const diffInfo = project.difficulty ? difficultyLabels[project.difficulty] : null;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        {project.logo_url ? (
          <img src={project.logo_url} alt={project.name} className="w-16 h-16 rounded-xl ring-2 ring-border animate-float object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl ring-2 ring-border bg-primary/20 flex items-center justify-center animate-float">
            <Zap className="w-8 h-8 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold neon-text truncate">{project.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs px-3 py-1 rounded-full border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {project.blockchain && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: chainColor }} />
                {project.blockchain}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {project.website_url && (
            <a href={project.website_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
              <Globe className="w-4 h-4" /> Website
            </a>
          )}
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-foreground/80 text-base leading-relaxed mb-8">{project.description}</p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glow-card rounded-xl p-4 text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-lg font-bold text-foreground">{project.estimated_value || "N/A"}</p>
          <p className="text-xs text-muted-foreground">Ước tính giá trị</p>
        </div>
        <div className="glow-card rounded-xl p-4 text-center">
          <Shield className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className={`text-lg font-bold ${diffInfo?.color || "text-foreground"}`}>
            {diffInfo?.label || "N/A"}
          </p>
          <p className="text-xs text-muted-foreground">Mức độ khó</p>
        </div>
        <div className="glow-card rounded-xl p-4 text-center">
          <Calendar className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-sm font-bold text-foreground">
            {project.start_date ? new Date(project.start_date).toLocaleDateString("vi-VN") : "N/A"}
          </p>
          <p className="text-xs text-muted-foreground">Ngày bắt đầu</p>
        </div>
        <div className="glow-card rounded-xl p-4 text-center">
          <Calendar className="w-5 h-5 mx-auto mb-2 text-primary" />
          <p className="text-sm font-bold text-foreground">
            {project.end_date ? new Date(project.end_date).toLocaleDateString("vi-VN") : "N/A"}
          </p>
          <p className="text-xs text-muted-foreground">Ngày kết thúc</p>
        </div>
      </div>

      {/* Funding */}
      {project.funding && (
        <div className="glow-card rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Funding
          </h3>
          <p className="text-foreground/80 text-sm">{project.funding}</p>
        </div>
      )}

      {/* Guide */}
      {project.guide && (
        <div className="glow-card rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Hướng dẫn tham gia
          </h3>
          <div className="text-foreground/80 text-sm whitespace-pre-wrap leading-relaxed">
            {project.guide}
          </div>
        </div>
      )}

      {/* Social links */}
      <div className="flex flex-wrap gap-3 mb-6">
        {project.twitter_url && (
          <a href={project.twitter_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors text-sm">
            <ExternalLink className="w-4 h-4" /> Twitter
          </a>
        )}
        {project.discord_url && (
          <a href={project.discord_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 text-foreground hover:bg-muted transition-colors text-sm">
            <ExternalLink className="w-4 h-4" /> Discord
          </a>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Thêm vào: {new Date(project.created_at).toLocaleDateString("vi-VN")}
      </p>
    </div>
  );
}
