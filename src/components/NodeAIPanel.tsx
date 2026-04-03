import { useState } from "react";
import { Sparkles, Loader2, Zap, Lightbulb, X, ChevronDown, ChevronUp, Clock, Users, Rocket, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CanvasNode, NodeConnection } from "@/components/NodeMapLayer";
import ReactMarkdown from "react-markdown";

interface NodeFeature {
  name: string;
  features: string[];
  category: string;
}

interface ProjectIdea {
  title: string;
  nodes: string[];
  description: string;
  howToBuild: string;
  targetUsers: string;
  potential: string;
  difficulty: string;
  timeline: string;
}

interface AnalysisResult {
  nodeFeatures: NodeFeature[];
  projectIdeas: ProjectIdea[];
  summary: string;
}

interface NodeAIPanelProps {
  nodes: CanvasNode[];
  connections: NodeConnection[];
  onAddConnection: (fromName: string, toName: string) => void;
  onClose: () => void;
}

const difficultyColors: Record<string, string> = {
  "dễ": "bg-green-500/20 text-green-400",
  "trung bình": "bg-amber-500/20 text-amber-400",
  "khó": "bg-red-500/20 text-red-400",
};

const NodeAIPanel = ({ nodes, connections, onAddConnection, onClose }: NodeAIPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showFeatures, setShowFeatures] = useState(false);
  const [expandedIdea, setExpandedIdea] = useState<number | null>(0);
  const [guideLoading, setGuideLoading] = useState<number | null>(null);
  const [guideContent, setGuideContent] = useState<string | null>(null);
  const [guideTitle, setGuideTitle] = useState<string>("");
  const { toast } = useToast();

  const analyze = async () => {
    if (nodes.length < 2) {
      toast({ title: "Cần ít nhất 2 node trên canvas để phân tích", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    setGuideContent(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-nodes", {
        body: { nodes: nodes.map((n) => ({ name: n.name, type: n.type })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.projectIdeas && !data?.suggestions) throw new Error("Invalid response");
      setResult(data as AnalysisResult);
      setExpandedIdea(0);
      toast({ title: "🤖 AI đã phân tích xong!" });
    } catch (e: any) {
      toast({ title: e.message || "Lỗi phân tích", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const applyIdea = (idea: ProjectIdea) => {
    for (let i = 0; i < idea.nodes.length - 1; i++) {
      onAddConnection(idea.nodes[i], idea.nodes[i + 1]);
    }
    toast({ title: `✅ Đã nối các node cho: ${idea.title}` });
  };

  const requestGuide = async (idea: ProjectIdea, index: number) => {
    setGuideLoading(index);
    try {
      const { data, error } = await supabase.functions.invoke("guide-project", {
        body: {
          idea: {
            title: idea.title,
            description: idea.description,
            targetUsers: idea.targetUsers,
            timeline: idea.timeline,
            difficulty: idea.difficulty,
            howToBuild: idea.howToBuild,
            potential: idea.potential,
          },
          nodes: nodes.map((n) => ({ name: n.name, type: n.type })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGuideTitle(idea.title);
      setGuideContent(data.guide);
      toast({ title: "📖 Hướng dẫn chi tiết đã sẵn sàng!" });
    } catch (e: any) {
      toast({ title: e.message || "Lỗi tạo hướng dẫn", variant: "destructive" });
    } finally {
      setGuideLoading(null);
    }
  };

  // Guide detail view
  if (guideContent) {
    return (
      <div className="absolute top-2 right-2 w-[560px] max-h-[calc(100vh-120px)] z-30 rounded-xl border border-border/60 bg-background/95 backdrop-blur-lg shadow-2xl flex flex-col" style={{ overflow: "hidden" }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <button onClick={() => setGuideContent(null)} className="p-1 rounded hover:bg-muted/40 transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300 truncate max-w-[400px]">{guideTitle}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/40 transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          <div className="prose prose-sm prose-invert max-w-none
            prose-headings:text-cyan-300 prose-headings:font-bold
            prose-h1:text-lg prose-h1:mb-4 prose-h1:mt-0 prose-h1:text-cyan-200
            prose-h2:text-base prose-h2:mb-3 prose-h2:mt-5 prose-h2:text-amber-300
            prose-h3:text-sm prose-h3:mb-2 prose-h3:mt-4 prose-h3:text-purple-300
            prose-p:text-sm prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-3
            prose-li:text-sm prose-li:text-muted-foreground
            prose-strong:text-emerald-300
            prose-code:text-xs prose-code:bg-primary/10 prose-code:text-cyan-300 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-muted/20 prose-pre:border prose-pre:border-border/30 prose-pre:rounded-lg prose-pre:text-xs
            prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
          ">
            <ReactMarkdown>{guideContent}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-2 right-2 w-[480px] max-h-[calc(100vh-120px)] z-30 rounded-xl border border-border/60 bg-background/95 backdrop-blur-lg shadow-2xl flex flex-col" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-300">Ý tưởng dự án AI</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted/40 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 space-y-4">
          {/* Analyze button */}
          {!result && (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center">
                <Rocket className="w-6 h-6 text-amber-400" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI sẽ phân tích <strong>{nodes.length} node</strong> trên canvas và đề xuất ý tưởng dự án cụ thể có thể xây dựng trong tương lai.
              </p>
              <Button onClick={analyze} disabled={loading || nodes.length < 2} className="gap-2 w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Đang phân tích..." : "Gợi ý ý tưởng dự án"}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Summary */}
              <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-xs text-amber-200/80 leading-relaxed">{result.summary}</p>
              </div>

              {/* Project Ideas */}
              {result.projectIdeas?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    Ý tưởng dự án ({result.projectIdeas.length})
                  </p>
                  <div className="space-y-2">
                    {result.projectIdeas.map((idea, i) => {
                      const isExpanded = expandedIdea === i;
                      const isLoadingGuide = guideLoading === i;
                      return (
                        <div key={i} className="rounded-lg bg-muted/10 border border-border/30 overflow-hidden">
                          <button
                            onClick={() => setExpandedIdea(isExpanded ? null : i)}
                            className="w-full p-3 text-left flex items-start gap-2"
                          >
                            <span className="text-sm mt-0.5">💡</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground">{idea.title}</p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {idea.nodes.map((n, j) => (
                                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{n}</span>
                                ))}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ml-auto ${difficultyColors[idea.difficulty] || "bg-muted/40 text-muted-foreground"}`}>
                                  {idea.difficulty}
                                </span>
                              </div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-3 h-3 text-muted-foreground mt-1" /> : <ChevronDown className="w-3 h-3 text-muted-foreground mt-1" />}
                          </button>

                          {isExpanded && (
                            <div className="px-3 pb-3 space-y-2.5">
                              <p className="text-[11px] text-muted-foreground leading-relaxed">{idea.description}</p>

                              <div className="p-2 rounded bg-primary/5 border border-primary/10 space-y-1.5">
                                <div className="flex items-start gap-1.5">
                                  <Zap className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                                  <p className="text-[11px] text-foreground"><strong>Cách bắt đầu:</strong> {idea.howToBuild}</p>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <Users className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                                  <p className="text-[11px] text-foreground"><strong>Đối tượng:</strong> {idea.targetUsers}</p>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <Rocket className="w-3 h-3 text-purple-400 mt-0.5 shrink-0" />
                                  <p className="text-[11px] text-foreground"><strong>Tiềm năng:</strong> {idea.potential}</p>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <Clock className="w-3 h-3 text-green-400 mt-0.5 shrink-0" />
                                  <p className="text-[11px] text-foreground"><strong>Timeline:</strong> {idea.timeline}</p>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1 gap-1.5 h-7 text-xs" onClick={() => applyIdea(idea)}>
                                  <Zap className="w-3 h-3" /> Áp dụng liên kết
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 gap-1.5 h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => requestGuide(idea, i)}
                                  disabled={isLoadingGuide}
                                >
                                  {isLoadingGuide ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />}
                                  {isLoadingGuide ? "Đang tạo..." : "Hướng dẫn chi tiết"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Node Features */}
              {result.nodeFeatures?.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowFeatures((p) => !p)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2 hover:text-foreground transition-colors"
                  >
                    {showFeatures ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Tính năng các node ({result.nodeFeatures.length})
                  </button>
                  {showFeatures && (
                    <div className="space-y-2">
                      {result.nodeFeatures.map((nf, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-muted/20 border border-border/30">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-foreground">{nf.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-secondary">{nf.category}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {nf.features.map((f, j) => (
                              <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/40 text-muted-foreground">{f}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Re-analyze */}
              <Button onClick={analyze} disabled={loading} variant="outline" size="sm" className="w-full gap-2 mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Phân tích lại
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeAIPanel;
