import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, Sparkles, Search, Loader2, Copy, Check, Wand2, Cpu, Image as ImageIcon, Video, Code2, PenLine, Megaphone, GraduationCap, Briefcase, ShieldAlert, Drama, BarChart3, Bot, Layers, Star, Play, Download, Upload, Trash2, SortAsc, Share2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

type Prompt = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  target_model?: string;
  tags?: string[];
  createdAt?: number;
  isCustom?: boolean;
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

const SEED: Prompt[] = [
  { id: "s1", title: "Phân tích kiến trúc dự án công nghệ", description: "Đánh giá toàn diện một dự án phần mềm theo nhiều tiêu chí.", content: "Bạn là kiến trúc sư phần mềm cấp cao. Hãy phân tích dự án {tên dự án} theo các khía cạnh: 1) Kiến trúc tổng thể 2) Tech stack & lý do chọn 3) Khả năng mở rộng 4) Bảo mật 5) Hiệu năng 6) Rủi ro kỹ thuật. Trả lời dưới dạng bảng + checklist.", category: "Công nghệ", target_model: "ChatGPT/Claude", tags: ["architecture", "review", "tech"] },
  { id: "s2", title: "Ảnh sản phẩm cinematic", description: "Prompt Midjourney chụp sản phẩm chất lượng studio.", content: "ultra-realistic product shot of {sản phẩm}, cinematic lighting, soft shadows, 85mm lens, shallow depth of field, on a marble surface, moody background, hyper detailed, 8k --ar 4:5 --style raw --v 6", category: "Hình ảnh", target_model: "Midjourney", tags: ["product", "cinematic"] },
  { id: "s3", title: "Code review chuyên nghiệp", description: "Review code chuẩn senior với đề xuất sửa cụ thể.", content: "Đóng vai Senior Engineer. Review đoạn code sau theo: readability, performance, security, edge cases, test coverage. Đưa ra: (1) bugs, (2) refactor đề xuất kèm code, (3) điểm 1-10.\n\n```\n{code}\n```", category: "Code/Lập trình", target_model: "Claude/GPT-5", tags: ["code", "review"] },
  { id: "s4", title: "Cảnh phim 8s Sora", description: "Prompt video điện ảnh ngắn cho Sora/Veo.", content: "A {nhân vật} walking through {bối cảnh}, golden hour, slow dolly-in, anamorphic lens flares, atmospheric haze, shallow DOF, cinematic color grade teal & orange, 24fps, photoreal, 8 seconds", category: "Video", target_model: "Sora/Veo 3", tags: ["video", "cinematic"] },
  { id: "s5", title: "Học chủ đề bằng phương pháp Feynman", description: "Học sâu một chủ đề bất kỳ trong 4 bước.", content: "Dạy tôi về {chủ đề} bằng phương pháp Feynman: 1) Giải thích như cho trẻ 12 tuổi 2) Chỉ ra lỗ hổng kiến thức của tôi qua 5 câu hỏi 3) Đơn giản hóa & dùng ví dụ đời thực 4) Tóm tắt 1 đoạn ngắn.", category: "Học tập", target_model: "ChatGPT", tags: ["learn", "feynman"] },
  { id: "s6", title: "Pentest checklist OWASP", description: "Hướng dẫn test bảo mật web có đạo đức.", content: "Đóng vai chuyên gia bảo mật ethical hacker. Hãy lập kế hoạch pentest cho ứng dụng web {target} theo OWASP Top 10. Liệt kê: lab/môi trường an toàn, công cụ (Burp, ZAP, nmap...), từng bước test, payload mẫu, cách báo cáo. CHỈ dùng cho mục đích học tập / phòng thủ trên hệ thống của tôi.", category: "Hacker/Bảo mật", target_model: "Claude", tags: ["pentest", "owasp"] },
  { id: "s7", title: "Chiến lược content 30 ngày", description: "Lịch content marketing đầy đủ.", content: "Bạn là content strategist. Lập kế hoạch 30 ngày cho thương hiệu {brand}, ngách {niche}, kênh {kênh}. Output: bảng gồm Ngày | Hook | Format | Caption | CTA | Hashtag.", category: "Marketing", target_model: "ChatGPT", tags: ["content", "marketing"] },
  { id: "s8", title: "Tóm tắt & insight dữ liệu", description: "Phân tích nhanh dataset và đưa insight.", content: "Bạn là data analyst. Với dữ liệu sau (CSV/JSON):\n{data}\nHãy: 1) Mô tả schema 2) Top 5 insight quan trọng 3) Bất thường/outlier 4) Đề xuất hành động 5) Code Python/SQL minh họa.", category: "Phân tích dữ liệu", target_model: "Claude", tags: ["data", "analysis"] },
  { id: "s9", title: "Logo tối giản hiện đại", description: "Sinh logo flat minimal.", content: "minimalist logo for {brand name}, flat vector, geometric, monoline, negative space, 2 colors, on white background, professional, behance trending --v 6 --style raw", category: "Hình ảnh", target_model: "Midjourney/DALL-E", tags: ["logo", "branding"] },
  { id: "s10", title: "Sinh component React + Tailwind", description: "Yêu cầu code UI chuẩn shadcn.", content: "Bạn là senior React engineer. Tạo component {tên component} bằng React + TypeScript + TailwindCSS theo design system shadcn/ui. Yêu cầu: accessible (aria), responsive, dark mode, props rõ ràng kèm JSDoc, không dùng màu cứng. Trả về 1 file duy nhất.", category: "Code/Lập trình", target_model: "Claude/GPT-5", tags: ["react", "tailwind", "shadcn"] },
  { id: "s11", title: "Phỏng vấn xin việc giả lập", description: "Mô phỏng phỏng vấn cho vị trí cụ thể.", content: "Đóng vai nhà tuyển dụng cấp senior cho vị trí {vị trí} tại {công ty}. Hãy phỏng vấn tôi gồm: 5 câu kỹ thuật + 3 câu behavioral + 2 case study. Sau mỗi câu trả lời của tôi, đánh giá 1-10 và gợi ý cải thiện.", category: "Năng suất", target_model: "ChatGPT", tags: ["interview", "career"] },
  { id: "s12", title: "Email lạnh chuyên nghiệp", description: "Email outreach B2B tỉ lệ phản hồi cao.", content: "Viết email lạnh B2B gửi tới {chức danh} tại {công ty mục tiêu}, sản phẩm tôi bán: {sản phẩm}. Yêu cầu: dòng tiêu đề <50 ký tự, nội dung <120 từ, có hook cá nhân hóa, value rõ ràng, CTA mềm. Cho 3 phiên bản A/B test.", category: "Marketing", target_model: "ChatGPT", tags: ["email", "sales", "b2b"] },
  { id: "s13", title: "Roleplay nhân vật lịch sử", description: "Trò chuyện học tập với nhân vật lịch sử.", content: "Đóng vai {tên nhân vật lịch sử} đang ở thời kỳ đỉnh cao sự nghiệp. Giữ giọng văn, kiến thức, niềm tin của thời đó. Tôi sẽ đặt câu hỏi và bạn trả lời như chính họ. Bắt đầu bằng lời chào đặc trưng.", category: "Roleplay", target_model: "Claude", tags: ["roleplay", "education"] },
  { id: "s14", title: "Bài blog SEO chuẩn", description: "Bài viết tối ưu SEO 1500 từ.", content: "Viết bài blog SEO 1500 từ về chủ đề: {chủ đề}, từ khóa chính: {keyword}, đối tượng: {audience}. Cấu trúc: H1 + meta description <160 ký tự + intro hook + 5-7 H2 + FAQ + CTA. Giọng văn: chuyên gia thân thiện. Mật độ keyword 1-2%.", category: "Viết lách", target_model: "ChatGPT/Claude", tags: ["seo", "blog"] },
  { id: "s15", title: "Jailbreak detection (defensive)", description: "Phân tích prompt độc hại để phòng thủ.", content: "Đóng vai AI security researcher. Phân tích prompt sau xem có phải jailbreak/prompt injection không, kỹ thuật được dùng (DAN, role-play bypass, encoding...), mức nguy hiểm 1-10 và cách phòng thủ. Mục đích: defensive research.\n\n{prompt cần phân tích}", category: "Hacker/Bảo mật", target_model: "Claude", tags: ["ai-security", "jailbreak"] },
  { id: "s16", title: "Chatbot CSKH theo brand", description: "System prompt cho chatbot doanh nghiệp.", content: "Bạn là chatbot CSKH của {công ty}, sản phẩm: {sản phẩm}. Quy tắc: (1) luôn xưng 'mình', gọi khách 'anh/chị', (2) trả lời <80 từ, (3) nếu không biết phải nói rõ và đề xuất gặp nhân viên, (4) không bịa giá/khuyến mãi, (5) giọng thân thiện chuyên nghiệp. FAQ tham khảo:\n{faq}", category: "Chatbot", target_model: "GPT-5/Claude", tags: ["chatbot", "support"] },
];

const LS_KEY = "prompts_lib_v1";
const FAV_KEY = "prompts_lib_favs_v1";

const Prompts = () => {
  const [prompts, setPrompts] = useState<Prompt[]>(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      const extra: Prompt[] = stored ? JSON.parse(stored) : [];
      const ids = new Set(SEED.map((s) => s.id));
      return [...extra.filter((p) => !ids.has(p.id)), ...SEED];
    } catch { return SEED; }
  });
  const [favs, setFavs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || "[]")); } catch { return new Set(); }
  });
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "title" | "category">("newest");
  const [generating, setGenerating] = useState(false);
  const [genQuery, setGenQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [varValues, setVarValues] = useState<Record<string, string>>({});
  const [testOutput, setTestOutput] = useState("");
  const [testing, setTesting] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customDraft, setCustomDraft] = useState<Partial<Prompt>>({ title: "", content: "", category: "Công nghệ", description: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Persist non-seed prompts
  useEffect(() => {
    const custom = prompts.filter((p) => !SEED.find((s) => s.id === p.id));
    localStorage.setItem(LS_KEY, JSON.stringify(custom));
  }, [prompts]);

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favs)));
  }, [favs]);

  // Reset variable values when switching prompts
  useEffect(() => {
    setVarValues({});
    setTestOutput("");
  }, [selected]);

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
        createdAt: Date.now(),
      }));
      setPrompts((prev) => [...mapped, ...prev]);
      toast({ title: `✅ Đã tạo ${mapped.length} prompt mới!` });
    } catch {
      toast({ title: "Không thể tạo!", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }, [genQuery, toast]);

  const selectedPrompt = prompts.find((p) => p.id === selected);

  // Detect {variables} in selected prompt
  const variables = useMemo(() => {
    if (!selectedPrompt) return [] as string[];
    const matches = selectedPrompt.content.match(/\{([^{}]+)\}/g) || [];
    return Array.from(new Set(matches.map((m) => m.slice(1, -1).trim())));
  }, [selectedPrompt]);

  const filledContent = useMemo(() => {
    if (!selectedPrompt) return "";
    let out = selectedPrompt.content;
    for (const v of variables) {
      const val = varValues[v];
      if (val) out = out.replaceAll(`{${v}}`, val);
    }
    return out;
  }, [selectedPrompt, variables, varValues]);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "📋 Đã copy!" });
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const deletePrompt = (id: string) => {
    if (SEED.find((s) => s.id === id)) {
      toast({ title: "Không thể xóa prompt mẫu", variant: "destructive" });
      return;
    }
    setPrompts((prev) => prev.filter((p) => p.id !== id));
    if (selected === id) setSelected(null);
    toast({ title: "🗑️ Đã xóa" });
  };

  const testPrompt = async () => {
    if (!filledContent) return;
    if (variables.length > 0 && variables.some((v) => !varValues[v])) {
      toast({ title: "Hãy điền đầy đủ biến trước khi test", variant: "destructive" });
      return;
    }
    setTesting(true);
    setTestOutput("");
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ prompt: filledContent }),
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Lỗi" }));
        toast({ title: err.error || "Lỗi test prompt", variant: "destructive" });
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") continue;
          try {
            const p = JSON.parse(j);
            const c = p.choices?.[0]?.delta?.content;
            if (c) { acc += c; setTestOutput(acc); }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch {
      toast({ title: "Lỗi kết nối", variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(prompts, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `prompts-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "📥 Đã export" });
  };

  const importFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(reader.result as string);
        if (!Array.isArray(arr)) throw new Error();
        const added: Prompt[] = arr.map((p: any, i: number) => ({
          id: `imp-${Date.now()}-${i}`,
          title: p.title || "Imported", description: p.description || "", content: p.content || "",
          category: p.category || "Khác", target_model: p.target_model, tags: p.tags || [],
          createdAt: Date.now(),
        }));
        setPrompts((prev) => [...added, ...prev]);
        toast({ title: `📤 Import ${added.length} prompt` });
      } catch { toast({ title: "File không hợp lệ", variant: "destructive" }); }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const saveCustom = () => {
    if (!customDraft.title || !customDraft.content) {
      toast({ title: "Cần tiêu đề và nội dung", variant: "destructive" }); return;
    }
    const p: Prompt = {
      id: `custom-${Date.now()}`,
      title: customDraft.title!, description: customDraft.description || "",
      content: customDraft.content!, category: customDraft.category || "Khác",
      target_model: customDraft.target_model, tags: customDraft.tags || [],
      createdAt: Date.now(), isCustom: true,
    };
    setPrompts((prev) => [p, ...prev]);
    setShowCustomDialog(false);
    setCustomDraft({ title: "", content: "", category: "Công nghệ", description: "" });
    setSelected(p.id);
    toast({ title: "✅ Đã lưu prompt" });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let arr = prompts.filter((p) => {
      const matchCat = activeCat === "all" || p.category === activeCat;
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || (p.tags || []).some((t) => t.toLowerCase().includes(q));
      const matchFav = !showFavOnly || favs.has(p.id);
      return matchCat && matchSearch && matchFav;
    });
    if (sortBy === "title") arr = [...arr].sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "category") arr = [...arr].sort((a, b) => a.category.localeCompare(b.category));
    else arr = [...arr].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return arr;
  }, [prompts, search, activeCat, showFavOnly, favs, sortBy]);

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <Sparkles className="w-7 h-7 text-primary animate-pulse-glow" />
        <h1 className="text-xl font-bold neon-text">Thư Viện Prompt AI</h1>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground font-mono hidden md:inline">{prompts.length} prompt · ⭐ {favs.size}</span>
        <Button onClick={() => setShowCustomDialog(true)} size="sm" variant="outline" className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
          <PenLine className="w-3.5 h-3.5" />Tạo
        </Button>
        <Button onClick={exportAll} size="sm" variant="ghost" className="gap-1.5"><Download className="w-3.5 h-3.5" />Export</Button>
        <Button onClick={() => fileRef.current?.click()} size="sm" variant="ghost" className="gap-1.5"><Upload className="w-3.5 h-3.5" />Import</Button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={importFile} />
      </header>

      {/* Hero search bar */}
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
              <Button key={c.key} onClick={() => generate(c.key)} disabled={generating} variant="outline" size="sm" className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 text-xs">
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <c.icon className="w-3.5 h-3.5" />}
                {c.key}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 min-w-[280px] border-r border-border/50 flex flex-col">
          <div className="px-4 py-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm prompt..." className="pl-9 bg-muted/30 border-border text-sm" />
            </div>
            <div className="flex gap-2 items-center">
              <button onClick={() => setShowFavOnly((v) => !v)} className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1 ${showFavOnly ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-300" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"}`}>
                <Star className={`w-3 h-3 ${showFavOnly ? "fill-current" : ""}`} />Yêu thích ({favs.size})
              </button>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-[11px] px-2 py-1 rounded-md bg-muted/30 border border-border text-muted-foreground">
                <option value="newest">Mới nhất</option>
                <option value="title">A-Z</option>
                <option value="category">Danh mục</option>
              </select>
            </div>
          </div>
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            <button onClick={() => setActiveCat("all")} className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${activeCat === "all" ? "bg-primary/20 border-primary/50 text-primary" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"}`}>
              <Layers className="w-3 h-3 inline mr-1" />Tất cả ({prompts.length})
            </button>
            {CATEGORIES.map((c) => {
              const count = prompts.filter((p) => p.category === c.key).length;
              if (count === 0) return null;
              return (
                <button key={c.key} onClick={() => setActiveCat(c.key)} className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${activeCat === c.key ? "bg-primary/20 border-primary/50 text-primary" : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"}`}>
                  <c.icon className="w-3 h-3 inline mr-1" />{c.key} ({count})
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 scrollbar-thin">
            {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">Không có prompt nào</p>}
            {filtered.map((p) => (
              <div key={p.id} className={`group relative rounded-lg border transition-all ${selected === p.id ? "bg-primary/10 border-primary/50" : "bg-muted/20 border-border hover:bg-muted/40 hover:border-primary/30"}`}>
                <button onClick={() => setSelected(p.id)} className="w-full text-left p-3">
                  <div className="text-sm font-semibold text-foreground line-clamp-1 pr-12">{p.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description}</div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{p.category}</span>
                    {p.target_model && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">{p.target_model}</span>}
                  </div>
                </button>
                <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }} className="p-1.5 rounded hover:bg-muted/60" title="Yêu thích">
                    <Star className={`w-3.5 h-3.5 ${favs.has(p.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                  {!SEED.find((s) => s.id === p.id) && (
                    <button onClick={(e) => { e.stopPropagation(); deletePrompt(p.id); }} className="p-1.5 rounded hover:bg-destructive/20" title="Xóa">
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  )}
                </div>
                {favs.has(p.id) && (
                  <Star className="absolute top-2.5 right-2.5 w-3.5 h-3.5 fill-yellow-400 text-yellow-400 group-hover:opacity-0 transition-opacity" />
                )}
              </div>
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
                  {selectedPrompt.tags?.map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">#{t}</span>)}
                  <button onClick={() => toggleFav(selectedPrompt.id)} className="ml-auto p-1.5 rounded hover:bg-muted/40">
                    <Star className={`w-4 h-4 ${favs.has(selectedPrompt.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  </button>
                </div>
                <h2 className="text-2xl font-bold neon-text">{selectedPrompt.title}</h2>
                <p className="text-sm text-muted-foreground mt-2">{selectedPrompt.description}</p>
              </div>

              {variables.length > 0 && (
                <div className="glass rounded-xl border border-accent/30 p-4">
                  <div className="text-xs font-mono text-accent uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5" />Điền biến ({variables.length})
                  </div>
                  <div className="space-y-2">
                    {variables.map((v) => (
                      <div key={v} className="flex gap-2 items-center">
                        <label className="text-xs text-muted-foreground min-w-[120px] font-mono">{`{${v}}`}</label>
                        <Input value={varValues[v] || ""} onChange={(e) => setVarValues((p) => ({ ...p, [v]: e.target.value }))} placeholder={`Nhập ${v}...`} className="flex-1 bg-muted/30 border-border text-sm h-8" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass rounded-xl border border-border p-5 relative">
                <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Prompt {variables.length > 0 && variables.some((v) => varValues[v]) && <span className="text-primary normal-case">(đã điền)</span>}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{filledContent.length} ký tự · ~{Math.ceil(filledContent.length / 4)} tokens</span>
                  <div className="flex gap-2 ml-auto">
                    <Button onClick={() => copy(filledContent, selectedPrompt.id)} size="sm" variant="outline" className="gap-1.5 h-8">
                      {copiedId === selectedPrompt.id ? <><Check className="w-3.5 h-3.5" />Đã copy</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                    </Button>
                    <Button onClick={testPrompt} disabled={testing} size="sm" className="gap-1.5 h-8 bg-primary hover:bg-primary/80">
                      {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}Thử AI
                    </Button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-sm font-mono text-foreground/90 leading-relaxed">{filledContent}</pre>
              </div>

              {(testOutput || testing) && (
                <div className="glass rounded-xl border border-primary/30 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />Kết quả AI {testing && <Loader2 className="w-3 h-3 animate-spin" />}
                    </span>
                    <button onClick={() => setTestOutput("")} className="p-1 rounded hover:bg-muted/40"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-sm">
                    <ReactMarkdown>{testOutput || "_Đang nghĩ..._"}</ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => generate(undefined, selectedPrompt.content)} disabled={generating} variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/10">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}AI tinh chỉnh prompt này
                </Button>
                <Button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/prompts?p=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify({ t: selectedPrompt.title, c: selectedPrompt.content, cat: selectedPrompt.category })))))}`); toast({ title: "🔗 Đã copy link chia sẻ" }); }} variant="outline" className="gap-2">
                  <Share2 className="w-4 h-4" />Chia sẻ
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-6"><Sparkles className="w-10 h-10 opacity-30" /></div>
              <p className="text-lg font-medium">Chọn một prompt để xem chi tiết</p>
              <p className="text-sm mt-2">Hoặc gõ chủ đề ở trên, AI sẽ tạo bộ prompt mới cho bạn</p>
            </div>
          )}
        </main>
      </div>

      {showCustomDialog && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCustomDialog(false)}>
          <div className="glass rounded-2xl border border-primary/40 p-6 max-w-2xl w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold neon-text">Tạo prompt mới</h3>
              <button onClick={() => setShowCustomDialog(false)} className="p-1.5 rounded hover:bg-muted/40"><X className="w-4 h-4" /></button>
            </div>
            <Input placeholder="Tiêu đề" value={customDraft.title || ""} onChange={(e) => setCustomDraft((d) => ({ ...d, title: e.target.value }))} />
            <Input placeholder="Mô tả ngắn" value={customDraft.description || ""} onChange={(e) => setCustomDraft((d) => ({ ...d, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <select value={customDraft.category} onChange={(e) => setCustomDraft((d) => ({ ...d, category: e.target.value }))} className="px-3 py-2 rounded-md bg-muted/30 border border-border text-sm">
                {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
                <option value="Khác">Khác</option>
              </select>
              <Input placeholder="Model đích (vd: ChatGPT, Claude...)" value={customDraft.target_model || ""} onChange={(e) => setCustomDraft((d) => ({ ...d, target_model: e.target.value }))} />
            </div>
            <Textarea placeholder="Nội dung prompt — dùng {biến} để có thể điền sau" value={customDraft.content || ""} onChange={(e) => setCustomDraft((d) => ({ ...d, content: e.target.value }))} className="min-h-[200px] font-mono text-sm" />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCustomDialog(false)}>Hủy</Button>
              <Button onClick={saveCustom} className="bg-primary hover:bg-primary/80 gap-2"><Check className="w-4 h-4" />Lưu</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Prompts;
