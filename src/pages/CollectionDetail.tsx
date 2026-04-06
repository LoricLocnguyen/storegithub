import { useState, useEffect } from "react";
import { ArrowLeft, Plus, Trash2, GripVertical, Globe, Lock, Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RepoCard } from "@/components/RepoCard";
import type { RepoInfo } from "@/lib/github";

interface CollectionInfo {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
}

const CollectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<CollectionInfo | null>(null);
  const [repos, setRepos] = useState<(RepoInfo & { uuid?: string; item_id?: string })[]>([]);
  const [allRepos, setAllRepos] = useState<{ id: string; name: string; full_name: string }[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      // Load collection
      const { data: col } = await supabase.from("collections").select("*").eq("id", id).single();
      if (!col) { navigate("/collections"); return; }
      setCollection(col);

      // Load items with repo data
      const { data: items } = await supabase
        .from("collection_items")
        .select("id, repo_id, position")
        .eq("collection_id", id)
        .order("position");

      if (items && items.length > 0) {
        const repoIds = items.map(i => i.repo_id);
        const { data: repoData } = await supabase
          .from("saved_repos")
          .select("*")
          .in("id", repoIds);

        if (repoData) {
          const itemMap = new Map(items.map(i => [i.repo_id, i]));
          const mapped = repoData
            .map(r => ({
              id: r.github_id,
              uuid: r.id,
              item_id: itemMap.get(r.id)?.id,
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
            }))
            .sort((a, b) => {
              const posA = itemMap.get(a.uuid!)?.position || 0;
              const posB = itemMap.get(b.uuid!)?.position || 0;
              return posA - posB;
            });
          setRepos(mapped);
        }
      } else {
        setRepos([]);
      }

      // Load all available repos for adding
      const { data: allR } = await supabase.from("saved_repos").select("id, name, full_name");
      if (allR) setAllRepos(allR);
      setLoading(false);
    };
    load();
  }, [id, navigate]);

  const isOwner = user?.id === collection?.user_id;

  const addRepo = async () => {
    if (!selectedRepoId || !id) return;
    const { error } = await supabase.from("collection_items").insert({
      collection_id: id,
      repo_id: selectedRepoId,
      position: repos.length,
    });
    if (error) {
      toast({ title: error.message.includes("duplicate") ? "Repo đã có trong bộ sưu tập!" : "Lỗi!", variant: "destructive" });
      return;
    }
    toast({ title: "Đã thêm repo!" });
    setSelectedRepoId("");
    // Reload
    window.location.reload();
  };

  const removeItem = async (itemId: string) => {
    await supabase.from("collection_items").delete().eq("id", itemId);
    setRepos(prev => prev.filter(r => r.item_id !== itemId));
    toast({ title: "Đã xóa khỏi bộ sưu tập!" });
  };

  const shareCollection = () => {
    const url = `${window.location.origin}/collections/${id}`;
    if (navigator.share) {
      navigator.share({ title: collection?.name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Đã copy link!" });
    }
  };

  if (loading) return <div className="min-h-screen aurora-bg flex items-center justify-center text-muted-foreground">Đang tải...</div>;
  if (!collection) return null;

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate("/collections")} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold neon-text truncate">{collection.name}</h1>
            {collection.is_public ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
          </div>
          {collection.description && <p className="text-sm text-muted-foreground truncate">{collection.description}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={shareCollection} className="gap-1.5">
          <Share2 className="w-4 h-4" /> Chia sẻ
        </Button>
      </header>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
        {isOwner && (
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select value={selectedRepoId} onValueChange={setSelectedRepoId}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Chọn repo để thêm..." />
                </SelectTrigger>
                <SelectContent>
                  {allRepos
                    .filter(r => !repos.find(er => er.uuid === r.id))
                    .map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.full_name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addRepo} disabled={!selectedRepoId} className="gap-2">
              <Plus className="w-4 h-4" /> Thêm
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {repos.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">Bộ sưu tập trống</p>
            </div>
          )}
          {repos.map((repo, idx) => (
            <div key={repo.id} className="relative group flex items-start gap-3">
              <div className="flex items-center gap-2 pt-4 text-muted-foreground">
                <span className="text-xs font-mono w-6 text-right">{idx + 1}.</span>
              </div>
              <div className="flex-1">
                <RepoCard repo={repo} isSelected={false} onClick={() => navigate(`/?select=${repo.id}`)} />
              </div>
              {isOwner && (
                <button
                  onClick={() => repo.item_id && removeItem(repo.item_id)}
                  className="absolute top-3 right-3 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollectionDetail;
