import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Map as MapIcon, ThumbsUp, ExternalLink, MessageSquare, Send, Loader2, GitBranch, BookOpen, Wrench, Video, FileText, Lock, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Item {
  id: string;
  position: number;
  item_type: string;
  title: string;
  description: string | null;
  url: string | null;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name?: string;
  avatar_url?: string;
}

const typeIcon: Record<string, any> = {
  repo: GitBranch, tool: Wrench, course: BookOpen, article: FileText, video: Video,
};

const RoadmapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [{ data: rm }, { data: its }, { data: vts }, { data: cms }] = await Promise.all([
        supabase.from("roadmaps").select("*").eq("id", id).maybeSingle(),
        supabase.from("roadmap_items").select("*").eq("roadmap_id", id).order("position"),
        supabase.from("roadmap_votes").select("user_id").eq("roadmap_id", id),
        supabase.from("roadmap_comments").select("*").eq("roadmap_id", id).order("created_at", { ascending: false }),
      ]);
      setRoadmap(rm);
      setItems(its || []);
      setVoteCount((vts || []).length);
      setHasVoted(!!vts?.find((v) => v.user_id === user?.id));
      const userIds = [...new Set((cms || []).map((c) => c.user_id))];
      const profileMap = new Map<string, any>();
      if (userIds.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, display_name, avatar_url").in("user_id", userIds);
        profs?.forEach((p) => profileMap.set(p.user_id, p));
      }
      setComments((cms || []).map((c) => ({ ...c, display_name: profileMap.get(c.user_id)?.display_name, avatar_url: profileMap.get(c.user_id)?.avatar_url })));
    };
    load();
  }, [id, user?.id]);

  const toggleVote = async () => {
    if (!user) { navigate("/auth"); return; }
    if (hasVoted) {
      await supabase.from("roadmap_votes").delete().eq("roadmap_id", id!).eq("user_id", user.id);
      setHasVoted(false); setVoteCount((c) => c - 1);
    } else {
      const { error } = await supabase.from("roadmap_votes").insert({ roadmap_id: id, user_id: user.id });
      if (!error) { setHasVoted(true); setVoteCount((c) => c + 1); }
    }
  };

  const postComment = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!newComment.trim()) return;
    setPosting(true);
    const { data, error } = await supabase.from("roadmap_comments").insert({ roadmap_id: id, user_id: user.id, content: newComment.trim() }).select().single();
    setPosting(false);
    if (error || !data) { toast({ title: "Lỗi gửi bình luận", variant: "destructive" }); return; }
    const { data: prof } = await supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle();
    setComments((p) => [{ ...data, display_name: prof?.display_name, avatar_url: prof?.avatar_url } as Comment, ...p]);
    setNewComment("");
  };

  if (!roadmap) {
    return <div className="min-h-screen aurora-bg flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate("/roadmaps")} className="w-9 h-9 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <MapIcon className="w-7 h-7 text-primary animate-pulse-glow" />
        <h1 className="text-xl font-bold neon-text flex-1 truncate">{roadmap.title}</h1>
        {roadmap.is_public ? <Globe2 className="w-4 h-4 text-muted-foreground" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
        <Button onClick={toggleVote} variant={hasVoted ? "default" : "outline"} size="sm" className="gap-2">
          <ThumbsUp className="w-3.5 h-3.5" /> {voteCount}
        </Button>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-8">
        {roadmap.description && <p className="text-muted-foreground">{roadmap.description}</p>}

        {roadmap.ai_markdown && (
          <div className="glass rounded-xl p-6 border border-primary/30">
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{roadmap.ai_markdown}</ReactMarkdown>
            </div>
          </div>
        )}

        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MapIcon className="w-5 h-5 text-primary" /> Các bước ({items.length})</h2>
          <div className="space-y-3">
            {items.map((it, idx) => {
              const Icon = typeIcon[it.item_type] || FileText;
              return (
                <div key={it.id} className="glass rounded-xl p-4 border border-border/50 hover:border-primary/40 transition-all flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center font-bold text-primary">{idx + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-accent" />
                      <h3 className="font-semibold">{it.title}</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent uppercase">{it.item_type}</span>
                    </div>
                    {it.description && <p className="text-sm text-muted-foreground mb-2">{it.description}</p>}
                    {it.url && (
                      <a href={it.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="w-3 h-3" /> {it.url}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary" /> Bình luận ({comments.length})</h2>
          {user ? (
            <div className="flex gap-2 mb-4">
              <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Chia sẻ ý kiến của bạn..." rows={2} className="flex-1" />
              <Button onClick={postComment} disabled={posting || !newComment.trim()} className="gap-2">
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4"><button onClick={() => navigate("/auth")} className="text-primary hover:underline">Đăng nhập</button> để bình luận</p>
          )}
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="glass rounded-lg p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  {c.avatar_url ? <img src={c.avatar_url} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-muted" />}
                  <span className="text-sm font-medium">{c.display_name || "Ẩn danh"}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(c.created_at).toLocaleString("vi-VN")}</span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap">{c.content}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default RoadmapDetail;
