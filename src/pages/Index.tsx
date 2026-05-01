import { useState, useCallback, useEffect, useMemo } from "react";
import { Plus, Archive, Trash2, Search, Zap, Compass, PenTool, Wand2, Loader2, BookOpen, Bot, Code, TrendingUp, ChevronLeft, ChevronRight, FolderOpen, BarChart3, Cpu, Workflow, ShieldCheck, Gamepad2, Boxes, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RepoCard, RepoDetail } from "@/components/RepoCard";
import { fetchRepoInfo, type RepoInfo } from "@/lib/github";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import RepoFilters, { type SortField, type SortOrder } from "@/components/RepoFilters";
import NotificationBell from "@/components/NotificationBell";
import UserMenu from "@/components/UserMenu";

const DISCOVER_CATEGORIES = [
  { key: "learning", label: "Học tập", icon: BookOpen },
  { key: "ai", label: "AI & ML", icon: Bot },
  { key: "programming", label: "Lập trình", icon: Code },
  { key: "trending", label: "Trending", icon: TrendingUp },
] as const;

const ITEMS_PER_PAGE = 20;

const Index = () => {
  const [repos, setRepos] = useState<(RepoInfo & { uuid?: string })[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("stars");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadRepos = async () => {
      const { data, error } = await supabase
        .from("saved_repos")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped = data.map((r) => ({
          id: r.github_id,
          uuid: r.id,
          name: r.name,
          full_name: r.full_name,
          description: r.description,
          html_url: r.html_url,
          stargazers_count: r.stargazers_count,
          forks_count: r.forks_count,
          language: r.language,
          owner: { login: r.owner_login, avatar_url: r.owner_avatar_url },
          topics: r.topics || [],
          updated_at: r.updated_at,
          open_issues_count: r.open_issues_count,
        }));
        setRepos(mapped);
      }
    };
    loadRepos();
  }, []);

  const addRepo = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const repo = await fetchRepoInfo(url.trim());
      if (repos.find((r) => r.id === repo.id)) {
        toast({ title: "Repo đã tồn tại trong kho!", variant: "destructive" });
        return;
      }
      const { data, error } = await supabase.from("saved_repos").insert({
        github_id: repo.id, name: repo.name, full_name: repo.full_name,
        description: repo.description, html_url: repo.html_url,
        stargazers_count: repo.stargazers_count, forks_count: repo.forks_count,
        language: repo.language, owner_login: repo.owner.login,
        owner_avatar_url: repo.owner.avatar_url, topics: repo.topics || [],
        updated_at: repo.updated_at, open_issues_count: repo.open_issues_count,
      }).select().single();
      if (error) { toast({ title: "Lỗi khi lưu repo!", variant: "destructive" }); return; }
      setRepos((prev) => [{ ...repo, uuid: data.id }, ...prev]);
      setSelected(repo.id);
      setUrl("");
      toast({ title: "Đã thêm và lưu repo thành công!" });
    } catch {
      toast({ title: "Không thể tải repo. Kiểm tra lại link!", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [url, repos, toast]);

  const discoverRepos = useCallback(async (category: string) => {
    setDiscovering(true);
    const catLabel = DISCOVER_CATEGORIES.find(c => c.key === category)?.label || category;
    toast({ title: `🔍 Đang tìm repo ${catLabel}...` });
    try {
      const existingRepos = repos.map(r => r.full_name);
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discover-repos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ existingRepos, category }),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({ error: "Lỗi" })); toast({ title: err.error || "Lỗi!", variant: "destructive" }); return; }
      const { repos: discovered } = await resp.json();
      if (!discovered?.length) { toast({ title: "Không tìm thấy repo mới!" }); return; }
      const newRepos = discovered.filter((r: any) => !repos.find(e => e.id === r.id));
      const inserts = newRepos.map((r: any) => ({
        github_id: r.id, name: r.name, full_name: r.full_name,
        description: r.description, html_url: r.html_url,
        stargazers_count: r.stargazers_count, forks_count: r.forks_count,
        language: r.language, owner_login: r.owner.login,
        owner_avatar_url: r.owner.avatar_url, topics: r.topics || [],
        updated_at: r.updated_at, open_issues_count: r.open_issues_count,
      }));
      if (inserts.length > 0) {
        const { data, error } = await supabase.from("saved_repos").insert(inserts).select();
        if (error) { toast({ title: "Lỗi khi lưu!", variant: "destructive" }); return; }
        const uuidMap = new Map(data?.map(d => [d.github_id, d.id]) || []);
        setRepos(prev => [...newRepos.map((r: any) => ({
          id: r.id, uuid: uuidMap.get(r.id), name: r.name, full_name: r.full_name,
          description: r.description, html_url: r.html_url,
          stargazers_count: r.stargazers_count, forks_count: r.forks_count,
          language: r.language, owner: r.owner,
          topics: r.topics || [], updated_at: r.updated_at, open_issues_count: r.open_issues_count,
        })), ...prev]);
      }
      toast({ title: `✅ Đã thêm ${newRepos.length} repo ${catLabel}!` });
    } catch { toast({ title: "Không thể tìm kiếm!", variant: "destructive" }); }
    finally { setDiscovering(false); }
  }, [repos, toast]);

  const removeRepo = async (id: number) => {
    const { error } = await supabase.from("saved_repos").delete().eq("github_id", id);
    if (error) { toast({ title: "Lỗi khi xóa!", variant: "destructive" }); return; }
    setRepos((prev) => prev.filter((r) => r.id !== id));
    if (selected === id) setSelected(null);
  };

  // Get unique languages
  const languages = useMemo(() => {
    const langs = repos.map(r => r.language).filter(Boolean) as string[];
    return [...new Set(langs)].sort();
  }, [repos]);

  // Filter + sort
  const filteredAndSorted = useMemo(() => {
    let result = repos.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.owner.login.toLowerCase().includes(search.toLowerCase())
    );
    if (selectedLanguage) result = result.filter(r => r.language === selectedLanguage);
    if (selectedLicense) result = result.filter(r => (r as any).license === selectedLicense);

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "stars": cmp = a.stargazers_count - b.stargazers_count; break;
        case "forks": cmp = a.forks_count - b.forks_count; break;
        case "updated": cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(); break;
        case "name": cmp = a.name.localeCompare(b.name); break;
      }
      return sortOrder === "desc" ? -cmp : cmp;
    });
    return result;
  }, [repos, search, selectedLanguage, selectedLicense, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / ITEMS_PER_PAGE);
  const paginatedRepos = filteredAndSorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [search, selectedLanguage, selectedLicense, sortField, sortOrder]);

  const selectedRepo = repos.find((r) => r.id === selected);

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <Archive className="w-7 h-7 text-primary animate-pulse-glow" />
        <h1 className="text-xl font-bold neon-text">Kho Đồ GitHub</h1>
        <button onClick={() => navigate("/airdrop")} className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center hover:bg-accent/30 hover:scale-110 transition-all duration-300 group" title="Kho Airdrop">
          <Zap className="w-5 h-5 text-accent group-hover:animate-pulse" />
        </button>
        <button onClick={() => navigate("/explore")} className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center hover:bg-primary/30 hover:scale-110 transition-all duration-300 group" title="Khám phá AI">
          <Compass className="w-5 h-5 text-primary group-hover:animate-pulse" />
        </button>
        <button onClick={() => navigate("/notes")} className="w-10 h-10 rounded-full bg-secondary/20 border border-secondary/40 flex items-center justify-center hover:bg-secondary/30 hover:scale-110 transition-all duration-300 group" title="Sổ Vẽ">
          <PenTool className="w-5 h-5 text-secondary group-hover:animate-pulse" />
        </button>
        <button onClick={() => navigate("/collections")} className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center hover:bg-primary/30 hover:scale-110 transition-all duration-300 group" title="Bộ Sưu Tập">
          <FolderOpen className="w-5 h-5 text-primary group-hover:animate-pulse" />
        </button>
        <button onClick={() => navigate("/compare")} className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center hover:bg-accent/30 hover:scale-110 transition-all duration-300 group" title="So Sánh Repo">
          <BarChart3 className="w-5 h-5 text-accent group-hover:animate-pulse" />
        </button>
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground font-mono">{repos.length} repo{repos.length !== 1 && "s"}</span>
        <NotificationBell />
        <UserMenu />
      </header>

      <div className="px-6 py-4 flex flex-col gap-3">
        <div className="flex gap-3">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRepo()} placeholder="Dán link GitHub repo vào đây..." className="flex-1 bg-muted/50 border-border focus-visible:ring-primary/50 font-mono text-sm" />
          <Button onClick={addRepo} disabled={loading || !url.trim()} className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />{loading ? "Đang tải..." : "Thêm"}
          </Button>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-muted-foreground flex items-center gap-1 mr-1">
            <Wand2 className="w-3.5 h-3.5" /> Khám phá:
          </span>
          {DISCOVER_CATEGORIES.map(cat => (
            <Button key={cat.key} onClick={() => discoverRepos(cat.key)} disabled={discovering} variant="outline" size="sm" className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 text-xs">
              {discovering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <cat.icon className="w-3.5 h-3.5" />}
              {cat.label}
            </Button>
          ))}
          <div className="ml-auto">
            <RepoFilters
              languages={languages}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={(f, o) => { setSortField(f); setSortOrder(o); }}
              selectedLicense={selectedLicense}
              onLicenseChange={setSelectedLicense}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 min-w-[280px] border-r border-border/50 flex flex-col">
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm repo..." className="pl-9 bg-muted/30 border-border text-sm" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-2 scrollbar-thin">
            {paginatedRepos.length === 0 && repos.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Archive className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Kho đồ trống</p>
                <p className="text-xs mt-1">Dán link GitHub để bắt đầu</p>
              </div>
            )}
            {paginatedRepos.length === 0 && repos.length > 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm">Không tìm thấy repo</p>
            )}
            {paginatedRepos.map((repo) => (
              <div key={repo.id} className="relative group">
                <RepoCard repo={repo} isSelected={selected === repo.id} onClick={() => setSelected(repo.id)} />
                <button onClick={() => removeRepo(repo.id)} className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-3 py-2 border-t border-border/50 flex items-center justify-between">
              <Button variant="ghost" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="h-7 w-7 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentPage} / {totalPages} <span className="text-[10px]">({filteredAndSorted.length})</span>
              </span>
              <Button variant="ghost" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-7 w-7 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </aside>

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
