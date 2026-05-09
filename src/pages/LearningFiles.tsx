import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2, ExternalLink, BookOpen, Github, FileText, Video, Wrench, GraduationCap, Sparkles, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  title: string;
  description: string;
  url: string;
  type: string;
  tags?: string[];
  level?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  resources?: Resource[];
}

const SUGGESTIONS = [
  "Tìm file code học React từ cơ bản đến nâng cao",
  "Ebook Python miễn phí PDF",
  "Khóa học Machine Learning miễn phí",
  "Tài liệu OWASP cho người mới",
  "Repo GitHub awesome về DevOps",
  "Cheatsheet Linux command",
];

const typeIcon = (t: string) => {
  const s = t.toLowerCase();
  if (s.includes("github")) return <Github className="w-4 h-4" />;
  if (s.includes("pdf") || s.includes("ebook")) return <BookOpen className="w-4 h-4" />;
  if (s.includes("course")) return <GraduationCap className="w-4 h-4" />;
  if (s.includes("video")) return <Video className="w-4 h-4" />;
  if (s.includes("tool")) return <Wrench className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

const LearningFiles = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    const newMsgs: Message[] = [...messages, { role: "user", content: q }];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/find-learning-files`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          query: q,
          history: newMsgs.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast({ title: data.error || "Lỗi tìm kiếm", variant: "destructive" });
        setMessages(prev => [...prev, { role: "assistant", content: `❌ ${data.error || "Có lỗi xảy ra"}` }]);
        return;
      }
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Đây là kết quả:", resources: data.resources || [] }]);
    } catch {
      toast({ title: "Không kết nối được AI", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Đã copy link!" });
  };

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-3 sticky top-0 z-20">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Button>
        <div className="flex items-center gap-2 ml-2">
          <GraduationCap className="w-6 h-6 text-primary animate-pulse-glow" />
          <h1 className="text-xl font-bold neon-text">Tìm File Học Tập</h1>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">AI tự động tìm tài liệu, repo, ebook, khóa học</span>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold neon-text mb-2">Bạn muốn học gì hôm nay?</h2>
              <p className="text-muted-foreground mb-6">Mô tả chủ đề, AI sẽ tìm file, repo, ebook, khóa học cho bạn.</p>
              <div className="grid sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left p-3 rounded-lg glass border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition text-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[90%] ${m.role === "user" ? "bg-primary/20 border-primary/40" : "glass border-border/50"} border rounded-2xl px-4 py-3`}>
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                {m.resources && m.resources.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {m.resources.map((r, j) => (
                      <div key={j} className="p-3 rounded-lg bg-background/60 border border-border/50 hover:border-primary/40 transition group">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 text-primary">{typeIcon(r.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm hover:text-primary truncate">
                                {r.title}
                              </a>
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5">{r.type}</Badge>
                              {r.level && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{r.level}</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                            {r.tags && r.tags.length > 0 && (
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {r.tags.map(t => <span key={t} className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">#{t}</span>)}
                              </div>
                            )}
                            <div className="flex gap-2 mt-2">
                              <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                <ExternalLink className="w-3 h-3" /> Mở link
                              </a>
                              <button onClick={() => copyLink(r.url)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                                <Copy className="w-3 h-3" /> Copy
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="glass border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">AI đang tìm tài liệu...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/50 glass px-4 md:px-8 py-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ví dụ: tìm file code học Next.js, ebook Rust miễn phí..."
            className="flex-1 bg-muted/30 border-border focus-visible:ring-primary/50"
            disabled={loading}
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()} className="gap-2 bg-primary hover:bg-primary/80">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gửi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LearningFiles;
