import { useState } from "react";
import { Sparkles, Loader2, Zap, ArrowRight, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { CanvasNode, NodeConnection } from "@/components/NodeMapLayer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NodeFeature {
  name: string;
  features: string[];
  category: string;
}

interface Suggestion {
  from: string;
  to: string;
  reason: string;
  potential: string;
  difficulty: string;
}

interface AnalysisResult {
  nodeFeatures: NodeFeature[];
  suggestions: Suggestion[];
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
  const [showFeatures, setShowFeatures] = useState(true);
  const { toast } = useToast();

  const analyze = async () => {
    if (nodes.length < 2) {
      toast({ title: "Cần ít nhất 2 node trên canvas để phân tích", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-nodes", {
        body: { nodes: nodes.map((n) => ({ name: n.name, type: n.type })) },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.suggestions) throw new Error("Invalid response");

      setResult(data as AnalysisResult);
      toast({ title: "🤖 AI đã phân tích xong!" });
    } catch (e: any) {
      toast({ title: e.message || "Lỗi phân tích", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (s: Suggestion) => {
    onAddConnection(s.from, s.to);
    toast({ title: `✅ Đã nối: ${s.from} ↔ ${s.to}` });
  };

  return (
    <div className="absolute top-14 right-[230px] w-80 max-h-[calc(100vh-120px)] z-30 rounded-xl border border-border/60 bg-background/95 backdrop-blur-lg shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold">AI Gợi ý liên kết</span>
        </div>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted/40 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Analyze button */}
          {!result && (
            <div className="text-center space-y-3">
              <p className="text-xs text-muted-foreground">
                AI sẽ phân tích {nodes.length} node trên canvas, phát hiện tính năng của mỗi node và gợi ý các kết hợp tiềm năng.
              </p>
              <Button onClick={analyze} disabled={loading || nodes.length < 2} className="gap-2 w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? "Đang phân tích..." : "Phân tích & Gợi ý"}
              </Button>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Summary */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-foreground leading-relaxed">{result.summary}</p>
              </div>

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

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Gợi ý kết hợp ({result.suggestions.length})
                  </p>
                  <div className="space-y-2">
                    {result.suggestions.map((s, i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/10 border border-border/30 space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-purple-400">{s.from}</span>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-semibold text-cyan-400">{s.to}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ml-auto ${difficultyColors[s.difficulty] || "bg-muted/40 text-muted-foreground"}`}>
                            {s.difficulty}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{s.reason}</p>
                        <div className="p-2 rounded bg-primary/5 border border-primary/10">
                          <p className="text-[11px] text-foreground">💡 {s.potential}</p>
                        </div>
                        <Button size="sm" variant="outline" className="w-full gap-1.5 h-7 text-xs" onClick={() => applySuggestion(s)}>
                          <Zap className="w-3 h-3" /> Áp dụng liên kết
                        </Button>
                      </div>
                    ))}
                  </div>
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
      </ScrollArea>
    </div>
  );
};

export default NodeAIPanel;
