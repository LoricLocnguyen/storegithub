import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Star, Share2, Send, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

interface RepoCommunityProps {
  repoId: string; // UUID from saved_repos
  repoName: string;
  repoUrl: string;
}

const RepoCommunity = ({ repoId, repoName, repoUrl }: RepoCommunityProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userRating, setUserRating] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const loadData = useCallback(async () => {
    // Load comments with profiles
    const { data: commentsData } = await supabase
      .from("repo_comments")
      .select("id, content, created_at, user_id")
      .eq("repo_id", repoId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (commentsData) {
      // Fetch profiles for comment authors
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      setComments(
        commentsData.map((c) => ({
          ...c,
          profile: profileMap.get(c.user_id) || { display_name: null, avatar_url: null },
        }))
      );
    }

    // Load ratings
    const { data: ratings } = await supabase
      .from("repo_ratings")
      .select("rating, user_id")
      .eq("repo_id", repoId);

    if (ratings && ratings.length > 0) {
      const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      setAvgRating(Math.round(avg * 10) / 10);
      setRatingCount(ratings.length);
      if (user) {
        const mine = ratings.find((r) => r.user_id === user.id);
        if (mine) setUserRating(mine.rating);
      }
    }
  }, [repoId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const submitComment = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!newComment.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("repo_comments").insert({
      user_id: user.id,
      repo_id: repoId,
      content: newComment.trim(),
    });
    if (error) {
      toast({ title: "Lỗi khi gửi bình luận!", variant: "destructive" });
    } else {
      setNewComment("");
      loadData();
    }
    setLoading(false);
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("repo_comments").delete().eq("id", commentId);
    loadData();
  };

  const submitRating = async (rating: number) => {
    if (!user) { navigate("/auth"); return; }
    const { error } = await supabase.from("repo_ratings").upsert(
      { user_id: user.id, repo_id: repoId, rating },
      { onConflict: "user_id,repo_id" }
    );
    if (!error) {
      setUserRating(rating);
      loadData();
      toast({ title: `Đã đánh giá ${rating} ⭐` });
    }
  };

  const shareRepo = () => {
    const text = `Check out ${repoName} on GitHub!`;
    if (navigator.share) {
      navigator.share({ title: repoName, text, url: repoUrl });
    } else {
      navigator.clipboard.writeText(repoUrl);
      toast({ title: "Đã sao chép link!" });
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {/* Rating & Share */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => submitRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-125"
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    s <= (hoverRating || userRating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {avgRating > 0 ? `${avgRating}/5` : "Chưa có đánh giá"} ({ratingCount})
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={shareRepo} className="gap-1.5 text-xs">
          <Share2 className="w-3.5 h-3.5" />
          Chia sẻ
        </Button>
      </div>

      {/* Comments */}
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-primary" />
          Bình luận ({comments.length})
        </h3>

        {/* Comment input */}
        <div className="flex gap-2 mb-4">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitComment()}
            placeholder={user ? "Viết bình luận..." : "Đăng nhập để bình luận"}
            className="flex-1 bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            disabled={loading}
          />
          <Button size="sm" onClick={submitComment} disabled={loading || !newComment.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>

        {/* Comment list */}
        <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">Chưa có bình luận nào</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3 p-3 rounded-lg bg-muted/20 group">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                {c.profile?.display_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {c.profile?.display_name || "Ẩn danh"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mt-1">{c.content}</p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => deleteComment(c.id)}
                  className="p-1 rounded text-destructive/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
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

export default RepoCommunity;
