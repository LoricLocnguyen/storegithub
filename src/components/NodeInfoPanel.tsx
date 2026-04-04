import { useState } from "react";
import { X, Loader2, Star, Zap, Shield, AlertTriangle, Users, Globe, Layers, Target, Award, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { CanvasNode } from "@/components/NodeMapLayer";

interface NodeInfo {
  name: string;
  type: string;
  summary: string;
  keyFeatures: string[];
  useCases: string[];
  techStack: string[];
  strengths: string[];
  weaknesses: string[];
  competitors: string[];
  ecosystem: string;
  maturity: string;
  communitySize: string;
  pricing: string;
  website: string;
  rating: number;
  verdict: string;
}

interface NodeInfoPanelProps {
  node: CanvasNode;
  onClose: () => void;
}

const maturityLabels: Record<string, { label: string; color: string }> = {
  early: { label: "Giai đoạn đầu", color: "text-amber-400" },
  growing: { label: "Đang phát triển", color: "text-emerald-400" },
  mature: { label: "Trưởng thành", color: "text-cyan-400" },
  declining: { label: "Đang giảm", color: "text-red-400" },
};

const communityLabels: Record<string, string> = {
  small: "Nhỏ",
  medium: "Trung bình",
  large: "Lớn",
  massive: "Rất lớn",
};

const NodeInfoPanel = ({ node, onClose }: NodeInfoPanelProps) => {
  const [info, setInfo] = useState<NodeInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);

  const scanNode = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("scan-node", {
        body: { name: node.name, type: node.type },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setInfo(data as NodeInfo);
      setScanned(true);
    } catch (e: any) {
      setError(e.message || "Lỗi khi quét node");
    } finally {
      setLoading(false);
    }
  };

  const renderRating = (rating: number) => {
    const stars = Math.round(rating / 2);
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} size={14} className={i <= stars ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"} />
          ))}
        </div>
        <span className="text-amber-300 font-bold text-sm">{rating}/10</span>
      </div>
    );
  };

  const Section = ({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Icon size={14} className={color} />
        <h4 className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{title}</h4>
      </div>
      {children}
    </div>
  );

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[420px] bg-background/95 backdrop-blur-xl border-l border-border/50 flex flex-col z-30 shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        {node.avatarUrl && <img src={node.avatarUrl} className="w-8 h-8 rounded-full" alt="" />}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-cyan-300 truncate">{node.name}</h3>
          <p className="text-[10px] text-muted-foreground">
            {node.type === "repo" ? "GitHub Repository" : node.type === "airdrop" ? "Airdrop / Crypto" : "AI Tool"}
          </p>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted/30 transition-colors">
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
        {!scanned && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target size={40} className="text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">Bấm để AI quét và phân tích thông tin chi tiết</p>
            <button
              onClick={scanNode}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Zap size={14} />
              Quét Node
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 size={32} className="text-cyan-400 animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">AI đang quét "{node.name}"...</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
            <p className="text-sm text-destructive">{error}</p>
            <button onClick={scanNode} className="text-xs text-cyan-400 mt-2 hover:underline">Thử lại</button>
          </div>
        )}

        {info && (
          <>
            {/* Summary & Rating */}
            <div className="p-3 rounded-lg bg-muted/20 border border-border/30 space-y-2">
              <p className="text-sm text-foreground/90 leading-relaxed">{info.summary}</p>
              {info.rating && renderRating(info.rating)}
            </div>

            {/* Verdict */}
            {info.verdict && (
              <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/30">
                <div className="flex items-center gap-2 mb-1">
                  <Award size={14} className="text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-300">Kết luận</span>
                </div>
                <p className="text-sm text-foreground/80">{info.verdict}</p>
              </div>
            )}

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2">
              {info.ecosystem && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20">
                  🌐 {info.ecosystem}
                </span>
              )}
              {info.maturity && (
                <span className={`text-[10px] px-2 py-1 rounded-full bg-muted/20 border border-border/30 ${maturityLabels[info.maturity]?.color || "text-muted-foreground"}`}>
                  📈 {maturityLabels[info.maturity]?.label || info.maturity}
                </span>
              )}
              {info.communitySize && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-muted/20 border border-border/30 text-emerald-300">
                  👥 {communityLabels[info.communitySize] || info.communitySize}
                </span>
              )}
              {info.pricing && (
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">
                  💰 {info.pricing}
                </span>
              )}
            </div>

            {/* Key Features */}
            {info.keyFeatures?.length > 0 && (
              <Section icon={Zap} title="Tính năng chính" color="text-amber-300">
                <div className="space-y-1">
                  {info.keyFeatures.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <span className="text-amber-400 mt-0.5">▸</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Use Cases */}
            {info.useCases?.length > 0 && (
              <Section icon={Target} title="Ứng dụng thực tế" color="text-emerald-300">
                <div className="space-y-1">
                  {info.useCases.map((u, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <span className="text-emerald-400 mt-0.5">◆</span>
                      <span>{u}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Tech Stack */}
            {info.techStack?.length > 0 && (
              <Section icon={Layers} title="Tech Stack" color="text-cyan-300">
                <div className="flex flex-wrap gap-1.5">
                  {info.techStack.map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      {t}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Strengths */}
            {info.strengths?.length > 0 && (
              <Section icon={Shield} title="Điểm mạnh" color="text-green-300">
                <div className="space-y-1">
                  {info.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Weaknesses */}
            {info.weaknesses?.length > 0 && (
              <Section icon={AlertTriangle} title="Điểm yếu" color="text-orange-300">
                <div className="space-y-1">
                  {info.weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <span className="text-orange-400 mt-0.5">⚠</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Competitors */}
            {info.competitors?.length > 0 && (
              <Section icon={Users} title="Đối thủ cạnh tranh" color="text-purple-300">
                <div className="flex flex-wrap gap-1.5">
                  {info.competitors.map((c, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {c}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Website */}
            {info.website && (
              <Section icon={Globe} title="Website" color="text-blue-300">
                <a href={info.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline break-all">
                  {info.website}
                </a>
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NodeInfoPanel;
