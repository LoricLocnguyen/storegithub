import { useState } from "react";
import { Sparkles, X, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import type { CanvasNode } from "@/components/NodeMapLayer";
import type { Stroke } from "@/components/DrawingCanvas";

interface Suggestion {
  name: string;
  url: string;
  why: string;
  category: string;
}

interface Props {
  noteTitle: string;
  nodes: CanvasNode[];
  strokeCount: number;
  onClose: () => void;
}

const SmartSketchPanel = ({ noteTitle, nodes, strokeCount, onClose }: Props) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { toast } = useToast();

  const generate = async () => {
    setLoading(true);
    setInsights("");
    setSuggestions([]);
    try {
      const context = `Tiêu đề note: ${noteTitle}\nSố nét vẽ: ${strokeCount}\nCác thành phần (nodes) trên canvas:\n${nodes.map((n, i) => `${i + 1}. [${n.type}] ${n.name}`).join("\n") || "(chưa có node nào)"}`;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-from-sketch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ context }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Lỗi" }));
        toast({ title: err.error || "Lỗi AI", variant: "destructive" });
        return;
      }
      const data = await resp.json();
      setInsights(data.insights || "");
      setSuggestions(data.suggestions || []);
    } catch {
      toast({ title: "Không thể kết nối AI", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute right-4 top-4 bottom-4 w-96 glass border border-primary/40 rounded-xl shadow-2xl flex flex-col z-30">
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm flex-1">Sổ Vẽ Thông Minh</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted/50">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-4">
        {!insights && !loading && (
          <div className="text-center py-6">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-primary/40" />
            <p className="text-sm text-muted-foreground mb-4">
              AI sẽ phân tích nội dung canvas và gợi ý các repo, công cụ phù hợp với ý tưởng của bạn.
            </p>
            <Button onClick={generate} className="gap-2">
              <Sparkles className="w-4 h-4" /> Phân tích & Gợi ý
            </Button>
          </div>
        )}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {insights && (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{insights}</ReactMarkdown>
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Gợi ý</h4>
            {suggestions.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer" className="block p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all group">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-semibold text-sm text-primary group-hover:underline">{s.name}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                </div>
                <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent mb-1">{s.category}</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.why}</p>
              </a>
            ))}
            <Button variant="outline" size="sm" onClick={generate} className="w-full mt-2 gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Phân tích lại
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSketchPanel;
