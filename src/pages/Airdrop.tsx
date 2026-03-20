import { useState, useCallback, useEffect } from "react";
import { Plus, Zap, Trash2, Search, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AirdropCard, AirdropDetail, type AirdropProject } from "@/components/AirdropCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Airdrop = () => {
  const [projects, setProjects] = useState<AirdropProject[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("airdrop_projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setProjects(data as AirdropProject[]);
    };
    load();
  }, []);

  const addProject = useCallback(async () => {
    if (!projectName.trim()) return;
    setLoading(true);
    toast({ title: `🔍 Đang phân tích "${projectName}"...`, description: "AI đang tìm thông tin dự án" });

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-airdrop`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ projectName: projectName.trim() }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Lỗi không xác định" }));
        toast({ title: err.error || "Lỗi khi phân tích!", variant: "destructive" });
        return;
      }

      const info = await resp.json();

      // Save to database
      const insert = {
        name: info.name || projectName.trim(),
        description: info.description || null,
        website_url: info.website_url || null,
        logo_url: info.logo_url || null,
        status: info.status || "running",
        blockchain: info.blockchain || null,
        start_date: info.start_date || null,
        end_date: info.end_date || null,
        guide: info.guide || null,
        estimated_value: info.estimated_value || null,
        difficulty: info.difficulty || "medium",
        funding: info.funding || null,
        twitter_url: info.twitter_url || null,
        discord_url: info.discord_url || null,
      };

      const { data, error } = await supabase
        .from("airdrop_projects")
        .insert(insert)
        .select()
        .single();

      if (error) {
        toast({ title: "Lỗi khi lưu dự án!", variant: "destructive" });
        return;
      }

      setProjects((prev) => [data as AirdropProject, ...prev]);
      setSelected((data as AirdropProject).id);
      setProjectName("");
      toast({ title: `✅ Đã thêm "${info.name || projectName}"!`, description: "AI đã tự động điền thông tin" });
    } catch {
      toast({ title: "Không thể phân tích dự án!", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [projectName, toast]);

  const removeProject = async (id: string) => {
    const { error } = await supabase.from("airdrop_projects").delete().eq("id", id);
    if (error) {
      toast({ title: "Lỗi khi xóa!", variant: "destructive" });
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selected === id) setSelected(null);
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.blockchain || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedProject = projects.find((p) => p.id === selected);

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <Zap className="w-7 h-7 text-accent animate-pulse-glow" />
        <h1 className="text-xl font-bold neon-text">Kho Airdrop</h1>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground font-mono">{projects.length} dự án</span>
      </header>

      {/* Add project bar */}
      <div className="px-6 py-4 flex gap-3">
        <Input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && addProject()}
          placeholder="Nhập tên dự án Airdrop (ví dụ: LayerZero, Starknet, ZkSync...)"
          className="flex-1 bg-muted/50 border-border focus-visible:ring-accent/50 font-mono text-sm"
          disabled={loading}
        />
        <Button
          onClick={addProject}
          disabled={loading || !projectName.trim()}
          className="bg-accent hover:bg-accent/80 text-accent-foreground gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              AI đang phân tích...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Thêm
            </>
          )}
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 min-w-[280px] border-r border-border/50 flex flex-col">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm dự án..."
                className="pl-9 bg-muted/30 border-border text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 scrollbar-thin">
            {filtered.length === 0 && projects.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Chưa có dự án Airdrop</p>
                <p className="text-xs mt-1">Nhập tên dự án, AI sẽ tự tìm thông tin</p>
              </div>
            )}
            {filtered.length === 0 && projects.length > 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">Không tìm thấy</p>
            )}
            {filtered.map((project) => (
              <div key={project.id} className="relative group">
                <AirdropCard
                  project={project}
                  isSelected={selected === project.id}
                  onClick={() => setSelected(project.id)}
                />
                <button
                  onClick={() => removeProject(project.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Detail panel */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          {selectedProject ? (
            <AirdropDetail project={selectedProject} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-6">
                <Zap className="w-10 h-10 opacity-30" />
              </div>
              <p className="text-lg font-medium">Chọn một dự án để xem chi tiết</p>
              <p className="text-sm mt-2">Nhập tên dự án, AI sẽ tự động phân tích & điền thông tin</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Airdrop;
