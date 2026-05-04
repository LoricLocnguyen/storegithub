import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ThumbsUp, Check, X, Sparkles, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface Suggestion {
  id: string;
  user_id: string;
  target_type: "airdrop" | "tool";
  target_id: string;
  target_name: string | null;
  proposed_changes: Record<string, any>;
  reason: string | null;
  status: string;
  created_at: string;
  applied_at: string | null;
}

const Suggestions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"pending" | "applied" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("edit_suggestions")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (data || []) as Suggestion[];
    setItems(list);

    const { data: votes } = await supabase.from("edit_suggestion_votes").select("suggestion_id, user_id");
    const counts: Record<string, number> = {};
    const mine = new Set<string>();
    (votes || []).forEach((v: any) => {
      counts[v.suggestion_id] = (counts[v.suggestion_id] || 0) + 1;
      if (user && v.user_id === user.id) mine.add(v.suggestion_id);
    });
    setVoteCounts(counts);
    setMyVotes(mine);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const toggleVote = async (id: string) => {
    if (!user) { navigate("/auth"); return; }
    if (myVotes.has(id)) {
      await supabase.from("edit_suggestion_votes").delete().eq("suggestion_id", id).eq("user_id", user.id);
      setMyVotes((p) => { const n = new Set(p); n.delete(id); return n; });
      setVoteCounts((p) => ({ ...p, [id]: Math.max(0, (p[id] || 1) - 1) }));
    } else {
      await supabase.from("edit_suggestion_votes").insert({ suggestion_id: id, user_id: user.id });
      setMyVotes((p) => new Set(p).add(id));
      setVoteCounts((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
    }
  };

  const apply = async (s: Suggestion) => {
    if (!user) { navigate("/auth"); return; }
    const table = s.target_type === "airdrop" ? "airdrop_projects" : "ai_tools";
    const { error: e1 } = await (supabase.from(table) as any).update(s.proposed_changes).eq("id", s.target_id);
    if (e1) { toast({ title: "Lỗi áp dụng", description: e1.message, variant: "destructive" }); return; }
    await supabase.from("edit_suggestions").update({
      status: "applied", applied_by: user.id, applied_at: new Date().toISOString(),
    }).eq("id", s.id);
    toast({ title: "Đã áp dụng đề xuất ✨" });
    load();
  };

  const reject = async (s: Suggestion) => {
    if (!user) { navigate("/auth"); return; }
    await supabase.from("edit_suggestions").update({ status: "rejected" }).eq("id", s.id);
    load();
  };

  const filtered = items.filter((s) => filter === "all" || s.status === filter);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <Sparkles className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold neon-text">Đề xuất Cộng đồng</h1>
        <div className="flex-1" />
        <div className="flex gap-1 text-xs">
          {(["pending", "applied", "rejected", "all"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full border transition-colors ${filter === k ? "bg-primary/20 border-primary/50 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"}`}>
              {k === "pending" ? "Đang chờ" : k === "applied" ? "Đã áp dụng" : k === "rejected" ? "Từ chối" : "Tất cả"}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm text-foreground/80">
          <p className="font-semibold mb-1 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Crowdsourcing</p>
          <p className="text-xs text-muted-foreground">
            Cộng đồng có thể đề xuất chỉnh sửa thông tin Airdrop & AI Tool để dữ liệu luôn cập nhật. Vote ủng hộ và áp dụng những thay đổi chính xác.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-8">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">Chưa có đề xuất nào.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <div key={s.id} className="glow-card rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                        s.target_type === "airdrop" ? "border-primary/40 text-primary bg-primary/10" : "border-secondary/40 text-secondary bg-secondary/10"
                      }`}>{s.target_type === "airdrop" ? "Airdrop" : "AI Tool"}</span>
                      <h3 className="font-semibold text-foreground truncate">{s.target_name || s.target_id.slice(0, 8)}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        s.status === "applied" ? "border-green-500/40 text-green-400 bg-green-500/10" :
                        s.status === "rejected" ? "border-red-500/40 text-red-400 bg-red-500/10" :
                        "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
                      }`}>{s.status === "applied" ? "Đã áp dụng" : s.status === "rejected" ? "Từ chối" : "Đang chờ"}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(s.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <button onClick={() => toggleVote(s.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                      myVotes.has(s.id) ? "bg-primary/20 border-primary/50 text-primary" : "border-border hover:bg-muted/50"
                    }`}>
                    <ThumbsUp className="w-3 h-3" /> {voteCounts[s.id] || 0}
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 mb-3">
                  {Object.entries(s.proposed_changes).map(([k, v]) => (
                    <div key={k} className="text-xs bg-muted/30 rounded-lg p-2 border border-border/40">
                      <p className="text-[10px] font-mono text-primary uppercase mb-0.5">{k}</p>
                      <p className="text-foreground/80 line-clamp-3 break-words">{v ? String(v) : <em className="text-muted-foreground">— xóa —</em>}</p>
                    </div>
                  ))}
                </div>

                {s.reason && (
                  <p className="text-xs text-muted-foreground mb-3 italic border-l-2 border-primary/40 pl-3">{s.reason}</p>
                )}

                {s.status === "pending" && user && (
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => reject(s)}><X className="w-3 h-3 mr-1" /> Từ chối</Button>
                    <Button size="sm" onClick={() => apply(s)} className="bg-primary"><Check className="w-3 h-3 mr-1" /> Áp dụng</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Suggestions;
