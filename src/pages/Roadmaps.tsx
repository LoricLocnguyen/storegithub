import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Map as MapIcon, Sparkles, Loader2, ThumbsUp, Lock, Globe2, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Roadmap {
  id: string;
  title: string;
  description: string | null;
  topic: string | null;
  tags: string[] | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
  vote_count?: number;
  item_count?: number;
}

const Roadmaps = () => {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("roadmaps").select("*").order("created_at", { ascending: false });
      if (!data) return;
      const ids = data.map((r) => r.id);
      const [{ data: votes }, { data: items }] = await Promise.all([
        supabase.from("roadmap_votes").select("roadmap_id").in("roadmap_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
        supabase.from("roadmap_items").select("roadmap_id").in("roadmap_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      ]);
      const voteMap = new Map<string, number>();
      votes?.forEach((v) => voteMap.set(v.roadmap_id, (voteMap.get(v.roadmap_id) || 0) + 1));
      const itemMap = new Map<string, number>();
      items?.forEach((it) => itemMap.set(it.roadmap_id, (itemMap.get(it.roadmap_id) || 0) + 1));
      setRoadmaps(data.map((r) => ({ ...r, vote_count: voteMap.get(r.id) || 0, item_count: itemMap.get(r.id) || 0 })));
    };
    load();
  }, []);

  const generateRoadmap = async () => {
    if (!user) {
      toast({ title: "Bạn cần đăng nhập", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (!topic.trim()) {
      toast({ title: "Nhập chủ đề lộ trình", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ topic, description }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Lỗi AI" }));
        toast({ title: err.error || "Lỗi AI", variant: "destructive" });
        return;
      }
      const ai = await resp.json();
      const { data: rm, error } = await supabase
        .from("roadmaps")
        .insert({ user_id: user.id, title: topic, description: description || null, topic, ai_markdown: ai.markdown_summary, is_public: isPublic })
        .select()
        .single();
      if (error || !rm) {
        toast({ title: "Lỗi lưu lộ trình", variant: "destructive" });
        return;
      }
      const items = (ai.items || []).map((it: any, idx: number) => ({
        roadmap_id: rm.id, position: idx, item_type: it.item_type, title: it.title, description: it.description, url: it.url || null,
      }));
      if (items.length) await supabase.from("roadmap_items").insert(items);
      toast({ title: "✨ Đã tạo lộ trình!" });
      setOpen(false); setTopic(""); setDescription("");
      navigate(`/roadmaps/${rm.id}`);
    } catch {
      toast({ title: "Không kết nối được AI", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const deleteRoadmap = async (id: string) => {
    const { error } = await supabase.from("roadmaps").delete().eq("id", id);
    if (error) { toast({ title: "Lỗi xóa", variant: "destructive" }); return; }
    setRoadmaps((p) => p.filter((r) => r.id !== id));
  };

  const filtered = roadmaps.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) || r.topic?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <MapIcon className="w-7 h-7 text-primary animate-pulse-glow" />
        <h1 className="text-xl font-bold neon-text">Lộ Trình Cộng Đồng</h1>
        <div className="flex-1" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Tạo lộ trình</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Tạo lộ trình bằng AI</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-xs">Chủ đề / Mục tiêu</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="VD: Trở thành kỹ sư Machine Learning" />
              </div>
              <div>
                <Label className="text-xs">Mô tả thêm (tùy chọn)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Trình độ hiện tại, định hướng cụ thể..." rows={3} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-2">
                  {isPublic ? <Globe2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {isPublic ? "Công khai" : "Riêng tư"}
                </Label>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={generateRoadmap} disabled={creating} className="gap-2 w-full">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {creating ? "AI đang tạo..." : "Tạo bằng AI"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="px-6 py-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm lộ trình..." className="pl-9" />
        </div>
      </div>

      <main className="flex-1 px-6 pb-8 overflow-y-auto scrollbar-thin">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <MapIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>Chưa có lộ trình nào. Hãy tạo lộ trình đầu tiên!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((r) => (
              <div key={r.id} className="group glass rounded-xl p-5 border border-border/50 hover:border-primary/50 transition-all cursor-pointer relative" onClick={() => navigate(`/roadmaps/${r.id}`)}>
                <div className="flex items-start gap-2 mb-2">
                  <MapIcon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <h3 className="font-bold flex-1 leading-snug">{r.title}</h3>
                  {!r.is_public && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                {r.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{r.description}</p>}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> {r.vote_count}</span>
                  <span>{r.item_count} bước</span>
                  <span className="ml-auto">{new Date(r.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
                {user?.id === r.user_id && (
                  <button onClick={(e) => { e.stopPropagation(); deleteRoadmap(r.id); }} className="absolute top-3 right-3 p-1.5 rounded bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Roadmaps;
