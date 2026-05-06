import { useState, useCallback, useMemo } from "react";
import { ArrowLeft, Sparkles, Search, Loader2, Copy, Check, Wand2, Cpu, Image as ImageIcon, Video, Code2, PenLine, Megaphone, GraduationCap, Briefcase, ShieldAlert, Drama, BarChart3, Bot, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type Prompt = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  target_model?: string;
  tags?: string[];
};

const CATEGORIES = [
  { key: "Công nghệ", icon: Cpu },
  { key: "Hình ảnh", icon: ImageIcon },
  { key: "Video", icon: Video },
  { key: "Code/Lập trình", icon: Code2 },
  { key: "Viết lách", icon: PenLine },
  { key: "Marketing", icon: Megaphone },
  { key: "Học tập", icon: GraduationCap },
  { key: "Năng suất", icon: Briefcase },
  { key: "Hacker/Bảo mật", icon: ShieldAlert },
  { key: "Roleplay", icon: Drama },
  { key: "Phân tích dữ liệu", icon: BarChart3 },
  { key: "Chatbot", icon: Bot },
] as const;

// Curated starter prompts (always visible, no DB needed)
const SEED: Prompt[] = [
  { id: "s1", title: "Phân tích kiến trúc dự án công nghệ", description: "Đánh giá toàn diện một dự án phần mềm theo nhiều tiêu chí.", content: "Bạn là kiến trúc sư phần mềm cấp cao. Hãy phân tích dự án {tên dự án} theo các khía cạnh: 1) Kiến trúc tổng thể 2) Tech stack & lý do chọn 3) Khả năng mở rộng 4) Bảo mật 5) Hiệu năng 6) Rủi ro kỹ thuật. Trả lời dưới dạng bảng + checklist.", category: "Công nghệ", target_model: "ChatGPT/Claude", tags: ["architecture", "review", "tech"] },
  { id: "s2", title: "Ảnh sản phẩm cinematic", description: "Prompt Midjourney chụp sản phẩm chất lượng studio.", content: "ultra-realistic product shot of {sản phẩm}, cinematic lighting, soft shadows, 85mm lens, shallow depth of field, on a marble surface, moody background, hyper detailed, 8k --ar 4:5 --style raw --v 6", category: "Hình ảnh", target_model: "Midjourney", tags: ["product", "cinematic", "midjourney"] },
  { id: "s3", title: "Code review chuyên nghiệp", description: "Review code chuẩn senior với đề xuất sửa cụ thể.", content: "Đóng vai Senior Engineer. Review đoạn code sau theo: readability, performance, security, edge cases, test coverage. Đưa ra: (1) bugs, (2) refactor đề xuất kèm code, (3) điểm 1-10.\n\n```\n{code}\n```", category: "Code/Lập trình", target_model: "Claude/GPT-5", tags: ["code", "review"] },
  { id: "s4", title: "Cảnh phim 8s Sora", description: "Prompt video điện ảnh ngắn cho Sora/Veo.", content: "A {nhân vật} walking through {bối cảnh}, golden hour, slow dolly-in, anamorphic lens flares, atmospheric haze, shallow DOF, cinematic color grade teal & orange, 24fps, photoreal, 8 seconds", category: "Video", target_model: "Sora/Veo 3", tags: ["video", "cinematic"] },
  { id: "s5", title: "Học chủ đề bằng phương pháp Feynman", description: "Học sâu một chủ đề bất kỳ trong 4 bước.", content: "Dạy tôi về {chủ đề} bằng phương pháp Feynman: 1) Giải thích như cho trẻ 12 tuổi 2) Chỉ ra lỗ hổng kiến thức của tôi qua 5 câu hỏi 3) Đơn giản hóa & dùng ví dụ đời thực 4) Tóm tắt 1 đoạn ngắn.", category: "Học tập", target_model: "ChatGPT", tags: ["learn", "feynman"] },
  { id: "s6", title: "Pentest checklist OWASP", description: "Hướng dẫn test bảo mật web có đạo đức.", content: "Đóng vai chuyên gia bảo mật ethical hacker. Hãy lập kế hoạch pentest cho ứng dụng web {target} theo OWASP Top 10. Liệt kê: lab/môi trường an toàn, công cụ (Burp, ZAP, nmap...), từng bước test, payload mẫu, cách báo cáo. CHỈ dùng cho mục đích học tập / phòng thủ trên hệ thống của tôi.", category: "Hacker/Bảo mật", target_model: "Claude", tags: ["pentest", "owasp", "security"] },
  { id: "s7", title: "Chiến lược content 30 ngày", description: "Lịch content marketing đầy đủ.", content: "Bạn là content strategist. Lập kế hoạch 30 ngày cho thương hiệu {brand}, ngách {niche}, kênh {kênh}. Output: bảng gồm Ngày | Hook | Format | Caption | CTA | Hashtag.", category: "Marketing", target_model: "ChatGPT", tags: ["content", "marketing"] },
  { id: "s8", title: "Tóm tắt & insight dữ liệu", description: "Phân tích nhanh dataset và đưa insight.", content: "Bạn là data analyst. Với dữ liệu sau (CSV/JSON):\n{data}\nHãy: 1) Mô tả schema 2) Top 5 insight quan trọng 3) Bất thường/outlier 4) Đề xuất hành động 5) Code Python/SQL minh họa.", category: "Phân tích dữ liệu", target_model: "Claude", tags: ["data", "analysis"] },
];

const Prompts = () => {
  const [prompts, setPrompts] = useState<Prompt[]>(SEED);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [generating, setGenerating] = useState(false);
  const [genQuery, setGenQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const generate = useCallback(async (category?: string, refineText?: string) => {
    setGenerating(true);
    toast({ title: "✨ AI đang tạo prompt...", description: refineText ? "Đang tinh chỉnh" : (category || genQuery || "Đang tạo bộ prompt mới") });
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prompt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          query: refineText || genQuery.trim() || undefined,
          category,
          mode: refineText ? "refine" : "generate",
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Lỗi" }));
        toast({ title: err.error || "Lỗi tạo prompt!", variant: "destructive" });
        return;
      }
      const { prompts: newOnes } = await resp.json();
      const mapped: Prompt[] = (newOnes || []).map((p: any, i: number) => ({
        id: `gen-${Date.now()}-${i}`,
        title: p.title,
        description: p.description,
        content: p.content,
        category: p.category || category || "Khác",
        target_model: p.target_model,
        tags: p.tags || [],
      }));
      setPrompts((prev) => [...mapped, ...prev]);
      toast({ title: `✅ Đã tạo ${mapped.length} prompt mới!` });
    } catch {
      toast({ title: "Không thể tạo!", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [genQuery, toast]);

  const copy = (p: Prompt) => {
    navigator.clipboard.writeText(p.content);
    setCopiedId(p.id);
    toast({ title: "📋 Đã copy!" });
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return prompts.filter((p) => {
      const matchCat = activeCat === "all" || p.category === activeCat;
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || (p.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [prompts, search, activeCat]);

  const selectedPrompt = prompts.find((p) => p.id === selected);

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <Sparkles className="w-7 h-7 text-primary animate-pulse-glow" />
        <h1 className="text-xl font-bold neon-text">Thư Viện Prompt AI</h1>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground font-mono">{prompts.length} prompt</span>
      </header>

      {/* Hero search bar - chatgpt-like */}
      <div className="px-6 py-6 max-w-5xl w-full mx-auto">
        <div className="glass rounded-2xl border border-primary/30 p-5 shadow-xl shadow-primary/10">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Wand2 className="w-4 h-4 text-primary" />
            <span>Mô tả chủ đề bạn cần prompt — AI sẽ tạo bộ prompt chất lượng cao cho bạn</span>
          </div>
          <div className="flex gap-3">
            <Input
              value={genQuery}
              onChange={(e) => setGenQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !generating && generate()}
              placeholder="Ví dụ: prompt làm logo tối giản, prompt phỏng vấn xin việc, prompt sinh code React..."
              className="flex-1 bg-muted/50 border-border focus-visible:ring-primary/50 text-sm h-11"
              disabled={generating}
            />
            <Button onClick={() => generate()} disabled={generating} className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2 h-11 px-6">
              {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Đang tạo...</> : <><Sparkles className="w-4 h-4" />Tạo prompt</>}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {CATEGORIES.map((c) => (
              <Button
                key={c.key}
                onClick={() => generate(c.key)}
                disabled={generating}
                variant="outline"
                size="sm"
                className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 text-xs"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <c.icon className="w-3.5 h-3.5" />}
                {c.key}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 min-w-[280px] border-r border-border/50 flex flex-col">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm prompt..." className="pl-9 bg-muted/30 border-border text-sm" />
            </div>
          </div>
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCat("all")}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${activeCat === "all" ? "bg-primary/20 border-primary/50 text-primary" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"}`}
            >
              <Layers className="w-3 h-3 inline mr-1" />Tất cả ({prompts.length})
            </button>
            {CATEGORIES.map((c) => {
              const count = prompts.filter((p) => p.category === c.key).length;
              if (count === 0) return null;
              return (
                <button
                  key={c.key}
                  onClick={() => setActiveCat(c.key)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${activeCat === c.key ? "bg-primary/20 border-primary/50 text-primary" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"}`}
                >
                  <c.icon className="w-3 h-3 inline mr-1" />{c.key} ({count})
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 scrollbar-thin">
            {filtered.length === 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">Không có prompt nào</p>
            )}
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${selected === p.id ? "bg-primary/10 border-primary/50" : "bg-muted/20 border-border hover:bg-muted/40 hover:border-primary/30"}`}
              >
                <div className="text-sm font-semibold text-foreground line-clamp-1">{p.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{p.category}</span>
                  {p.target_model && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">{p.target_model}</span>}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          {selectedPrompt ? (
            <div className="max-w-3xl mx-auto space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{selectedPrompt.category}</span>
                  {selectedPrompt.target_model && <span className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">{selectedPrompt.target_model}</span>}
                  {selectedPrompt.tags?.map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">#{t}</span>
                  ))}
                </div>
                <h2 className="text-2xl font-bold neon-text">{selectedPrompt.title}</h2>
                <p className="text-sm text-muted-foreground mt-2">{selectedPrompt.description}</p>
              </div>

              <div className="glass rounded-xl border border-border p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Prompt</span>
                  <Button onClick={() => copy(selectedPrompt)} size="sm" variant="outline" className="gap-1.5 h-8">
                    {copiedId === selectedPrompt.id ? <><Check className="w-3.5 h-3.5" />Đã copy</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap text-sm font-mono text-foreground/90 leading-relaxed">{selectedPrompt.content}</pre>
              </div>

              <Button
                onClick={() => generate(undefined, selectedPrompt.content)}
                disabled={generating}
                variant="outline"
                className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
              >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                AI tinh chỉnh prompt này
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 opacity-30" />
              </div>
              <p className="text-lg font-medium">Chọn một prompt để xem chi tiết</p>
              <p className="text-sm mt-2">Hoặc gõ chủ đề ở trên, AI sẽ tạo bộ prompt mới cho bạn</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Prompts;
