import { useState, useCallback } from "react";
import { Plus, Archive, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RepoCard, RepoDetail } from "@/components/RepoCard";
import { fetchRepoInfo, type RepoInfo } from "@/lib/github";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const addRepo = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const repo = await fetchRepoInfo(url.trim());
      if (repos.find((r) => r.id === repo.id)) {
        toast({ title: "Repo đã tồn tại trong kho!", variant: "destructive" });
        return;
      }
      setRepos((prev) => [repo, ...prev]);
      setSelected(repo.id);
      setUrl("");
      toast({ title: "Đã thêm repo thành công!" });
    } catch {
      toast({ title: "Không thể tải repo. Kiểm tra lại link!", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [url, repos, toast]);

  const removeRepo = (id: number) => {
    setRepos((prev) => prev.filter((r) => r.id !== id));
    if (selected === id) setSelected(null);
  };

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.login.toLowerCase().includes(search.toLowerCase())
  );

  const selectedRepo = repos.find((r) => r.id === selected);

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <Archive className="w-7 h-7 text-primary animate-pulse-glow" />
        <h1 className="text-xl font-bold neon-text">Kho Đồ GitHub</h1>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground font-mono">
          {repos.length} repo{repos.length !== 1 && "s"}
        </span>
      </header>

      {/* Add repo bar */}
      <div className="px-6 py-4 flex gap-3">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addRepo()}
          placeholder="Dán link GitHub repo vào đây..."
          className="flex-1 bg-muted/50 border-border focus-visible:ring-primary/50 font-mono text-sm"
        />
        <Button
          onClick={addRepo}
          disabled={loading || !url.trim()}
          className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2"
        >
          <Plus className="w-4 h-4" />
          {loading ? "Đang tải..." : "Thêm"}
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 min-w-[280px] border-r border-border/50 flex flex-col">
          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm repo..."
                className="pl-9 bg-muted/30 border-border text-sm"
              />
            </div>
          </div>

          {/* Repo list */}
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 scrollbar-thin">
            {filtered.length === 0 && repos.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Archive className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Kho đồ trống</p>
                <p className="text-xs mt-1">Dán link GitHub để bắt đầu</p>
              </div>
            )}
            {filtered.length === 0 && repos.length > 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">Không tìm thấy repo</p>
            )}
            {filtered.map((repo) => (
              <div key={repo.id} className="relative group">
                <RepoCard
                  repo={repo}
                  isSelected={selected === repo.id}
                  onClick={() => setSelected(repo.id)}
                />
                <button
                  onClick={() => removeRepo(repo.id)}
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
          {selectedRepo ? (
            <RepoDetail repo={selectedRepo} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mb-6">
                <Archive className="w-10 h-10 opacity-30" />
              </div>
              <p className="text-lg font-medium">Chọn một repo để xem chi tiết</p>
              <p className="text-sm mt-2">Hoặc thêm repo mới bằng link GitHub</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
