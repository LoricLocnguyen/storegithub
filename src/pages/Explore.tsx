import { useState, useCallback, useEffect } from "react";
import { Plus, Compass, Trash2, Search, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AIToolCard, AIToolDetail, type AITool } from "@/components/AIToolCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Explore = () => {
  const [tools, setTools] = useState<AITool[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toolName, setToolName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("ai_tools")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setTools(data as AITool[]);
    };
    load();
  }, []);

  const addTool = useCallback(async () => {
    if (!toolName.trim()) return;
    setLoading(true);
    toast({ title: `🔍 Đang phân tích "${toolName}"...`, description: "AI đang tìm thông tin" });

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ai-tool`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ toolName: toolName.trim() }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Lỗi không xác định" }));
        toast({ title: err.error || "Lỗi khi phân tích!", variant: "destructive" });
        return;
      }

      const info = await resp.json();

      const insert = {
        name: info.name || toolName.trim(),
        description: info.description || null,
        website_url: info.website_url || null,
        logo_url: info.logo_url || null,
        category: info.category || null,
        pricing: info.pricing || null,
        status: info.status || "active",
        popularity: info.popularity || "emerging",
        features: info.features || null,
        use_cases: info.use_cases || null,
        twitter_url: info.twitter_url || null,
        discord_url: info.discord_url || null,
        github_url: info.github_url || null,
      };

      const { data, error } = await supabase
        .from("ai_tools")
        .insert(insert)
        .select()
        .single();

      if (error) {
        toast({ title: "Lỗi khi lưu!", variant: "destructive" });
        return;
      }

      setTools((prev) => [data as AITool, ...prev]);
      setSelected((data as AITool).id);
      setToolName("");
      toast({ title: `✅ Đã thêm "${info.name || toolName}"!`, description: "AI đã tự động điền thông tin" });
    } catch {
      toast({ title: "Không thể phân tích!", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toolName, toast]);

  const removeTool = async (id: string) => {
    const { error } = await supabase.from("ai_tools").delete().eq("id", id);
    if (error) { toast({ title: "Lỗi khi xóa!", variant: "destructive" }); return; }
    setTools((prev) => prev.filter((t) => t.id !== id));
    if (selected === id) setSelected(null);
  };

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedTool = tools.find((t) => t.id === selected);

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <Compass className="w-7 h-7 text-primary animate-pulse-glow" />
        <h1 className="text-xl font-bold neon-text">Khám Phá AI & Phần Mềm</h1>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground font-mono">{tools.length} tool</span>
      </header>

      <div className="px-6 py-4 flex gap-3">
        <Input
          value={toolName}
          onChange={(e) => setToolName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && addTool()}
          placeholder="Nhập tên AI tool hoặc phần mềm (ví dụ: ChatGPT, Midjourney, Cursor...)"
          className="flex-1 bg-muted/50 border-border focus-visible:ring-primary/50 font-mono text-sm"
          disabled={loading}
        />
        <Button onClick={addTool} disabled={loading || !toolName.trim()} className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />AI đang phân tích...</> : <><Plus className="w-4 h-4" />Thêm</>}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 min-w-[280px] border-r border-border/50 flex flex-col">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tool..." className="pl-9 bg-muted/30 border-border text-sm" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 scrollbar-thin">
            {filtered.length === 0 && tools.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Compass className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Chưa có AI tool nào</p>
                <p className="text-xs mt-1">Nhập tên tool, AI sẽ tự tìm thông tin</p>
              </div>
            )}
            {filtered.length === 0 && tools.length > 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">Không tìm thấy</p>
            )}
            {filtered.map((tool) => (
              <div key={tool.id} className="relative group">
                <AIToolCard tool={tool} isSelected={selected === tool.id} onClick={() => setSelected(tool.id)} />
                <button onClick={() => removeTool(tool.id)} className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          {selectedTool ? (
            <AIToolDetail tool={selectedTool} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-6">
                <Compass className="w-10 h-10 opacity-30" />
              </div>
              <p className="text-lg font-medium">Chọn một tool để xem chi tiết</p>
              <p className="text-sm mt-2">Nhập tên AI tool hoặc phần mềm, AI sẽ tự động phân tích</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Explore;
