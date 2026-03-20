import { useState, useCallback, useEffect } from "react";
import { Plus, Zap, Trash2, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AirdropCard, AirdropDetail, type AirdropProject } from "@/components/AirdropCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Airdrop = () => {
  const [projects, setProjects] = useState<AirdropProject[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    name: "", description: "", website_url: "", logo_url: "",
    status: "running", blockchain: "", start_date: "", end_date: "",
    guide: "", estimated_value: "", difficulty: "medium",
    funding: "", twitter_url: "", discord_url: "",
  });

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
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const insert = {
        name: form.name,
        description: form.description || null,
        website_url: form.website_url || null,
        logo_url: form.logo_url || null,
        status: form.status,
        blockchain: form.blockchain || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        guide: form.guide || null,
        estimated_value: form.estimated_value || null,
        difficulty: form.difficulty || null,
        funding: form.funding || null,
        twitter_url: form.twitter_url || null,
        discord_url: form.discord_url || null,
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
      setShowForm(false);
      setForm({
        name: "", description: "", website_url: "", logo_url: "",
        status: "running", blockchain: "", start_date: "", end_date: "",
        guide: "", estimated_value: "", difficulty: "medium",
        funding: "", twitter_url: "", discord_url: "",
      });
      toast({ title: "Đã thêm dự án Airdrop!" });
    } finally {
      setLoading(false);
    }
  }, [form, toast]);

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
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) ||
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
        <span className="text-xs text-muted-foreground font-mono">
          {projects.length} dự án
        </span>
      </header>

      {/* Add button */}
      <div className="px-6 py-4 flex gap-3">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-accent hover:bg-accent/80 text-accent-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Đóng form" : "Thêm dự án Airdrop"}
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-6 pb-4">
          <div className="glow-card rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input placeholder="Tên dự án *" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-muted/50 border-border" />
              <Input placeholder="Blockchain (ETH, SOL...)" value={form.blockchain}
                onChange={(e) => setForm({ ...form, blockchain: e.target.value })}
                className="bg-muted/50 border-border" />
              <Input placeholder="Website URL" value={form.website_url}
                onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                className="bg-muted/50 border-border" />
              <Input placeholder="Logo URL" value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                className="bg-muted/50 border-border" />
              <Input placeholder="Ước tính giá trị" value={form.estimated_value}
                onChange={(e) => setForm({ ...form, estimated_value: e.target.value })}
                className="bg-muted/50 border-border" />
              <Input placeholder="Funding (ví dụ: $10M Series A)" value={form.funding}
                onChange={(e) => setForm({ ...form, funding: e.target.value })}
                className="bg-muted/50 border-border" />
              <Input type="date" placeholder="Ngày bắt đầu" value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="bg-muted/50 border-border" />
              <Input type="date" placeholder="Ngày kết thúc" value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="bg-muted/50 border-border" />
              <Input placeholder="Twitter URL" value={form.twitter_url}
                onChange={(e) => setForm({ ...form, twitter_url: e.target.value })}
                className="bg-muted/50 border-border" />
              <Input placeholder="Discord URL" value={form.discord_url}
                onChange={(e) => setForm({ ...form, discord_url: e.target.value })}
                className="bg-muted/50 border-border" />
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="running">Đang chạy</SelectItem>
                  <SelectItem value="upcoming">Sắp ra mắt</SelectItem>
                  <SelectItem value="ended">Đã kết thúc</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                <SelectTrigger className="bg-muted/50 border-border">
                  <SelectValue placeholder="Mức độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Mô tả dự án" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-muted/50 border-border" />
            <Textarea placeholder="Hướng dẫn tham gia (từng bước)" value={form.guide}
              onChange={(e) => setForm({ ...form, guide: e.target.value })}
              className="bg-muted/50 border-border min-h-[120px]" />
            <Button onClick={addProject} disabled={loading || !form.name.trim()}
              className="bg-accent hover:bg-accent/80 text-accent-foreground gap-2">
              {loading ? "Đang lưu..." : "Lưu dự án"}
            </Button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 min-w-[280px] border-r border-border/50 flex flex-col">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm dự án..." className="pl-9 bg-muted/30 border-border text-sm" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 scrollbar-thin">
            {filtered.length === 0 && projects.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Chưa có dự án Airdrop</p>
                <p className="text-xs mt-1">Bấm "Thêm dự án" để bắt đầu</p>
              </div>
            )}
            {filtered.length === 0 && projects.length > 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">Không tìm thấy</p>
            )}
            {filtered.map((project) => (
              <div key={project.id} className="relative group">
                <AirdropCard project={project} isSelected={selected === project.id}
                  onClick={() => setSelected(project.id)} />
                <button onClick={() => removeProject(project.id)}
                  className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20">
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
              <p className="text-sm mt-2">Hoặc thêm dự án Airdrop mới</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Airdrop;
