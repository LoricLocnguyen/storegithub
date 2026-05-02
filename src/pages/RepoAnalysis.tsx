import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Loader2, FileText, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import RepoCharts from "@/components/RepoCharts";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-repo`;

const RepoAnalysis = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const repoName = params.get("name") || "";
  const repoDescription = params.get("desc") || "";
  const repoLanguage = params.get("lang") || "";
  const repoUrl = params.get("url") || "";
  const ownerName = params.get("owner") || "";
  const avatarUrl = params.get("avatar") || "";

  useEffect(() => {
    if (!repoName) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setContent("");
      setError(null);

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ repoName, repoDescription, repoLanguage, repoUrl, ownerName }),
        });

        if (!resp.ok || !resp.body) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || `Error ${resp.status}`);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const json = line.slice(6).trim();
            if (json === "[DONE]") break;
            try {
              const parsed = JSON.parse(json);
              const c = parsed.choices?.[0]?.delta?.content;
              if (c && !cancelled) {
                accumulated += c;
                setContent(accumulated);
              }
            } catch {}
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [repoName, repoDescription, repoLanguage, repoUrl, ownerName]);

  return (
    <div className="min-h-screen aurora-bg">
      {/* Header */}
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-foreground gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Button>
        <div className="h-5 w-px bg-border" />
        {avatarUrl && (
          <img src={avatarUrl} alt={ownerName} className="w-7 h-7 rounded-full ring-1 ring-border" />
        )}
        <div>
          <h1 className="text-base font-bold neon-text">{repoName}</h1>
          <p className="text-xs text-muted-foreground">{ownerName}</p>
        </div>
        <div className="flex-1" />
        <Sparkles className="w-5 h-5 text-accent animate-pulse-glow" />
        <span className="text-sm font-medium text-accent">AI Analysis</span>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="glow-card rounded-xl p-6 border-destructive/50 mb-6">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {loading && !content && (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-sm">AI đang phân tích repo...</p>
          </div>
        )}

        {content && (
          <div className="glow-card rounded-xl p-8">
            <div className="prose prose-invert prose-sm max-w-none
              prose-headings:neon-text prose-headings:font-bold
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
              prose-p:text-foreground/80 prose-p:leading-relaxed
              prose-strong:text-foreground
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
              prose-pre:bg-muted prose-pre:rounded-lg prose-pre:border prose-pre:border-border
              prose-li:text-foreground/80
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
            {loading && (
              <div className="flex items-center gap-2 mt-4 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Đang tiếp tục phân tích...</span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default RepoAnalysis;
