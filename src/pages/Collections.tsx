import { useState, useEffect } from "react";
import { Plus, FolderOpen, Globe, Lock, Trash2, ArrowLeft, Edit2, Save, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import UserMenu from "@/components/UserMenu";

interface Collection {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
  item_count?: number;
  owner_name?: string;
}

const Collections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadCollections = async () => {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Get item counts
      const ids = data.map(c => c.id);
      const { data: items } = await supabase
        .from("collection_items")
        .select("collection_id")
        .in("collection_id", ids);

      const counts = new Map<string, number>();
      items?.forEach(i => counts.set(i.collection_id, (counts.get(i.collection_id) || 0) + 1));

      // Get owner names
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

      setCollections(data.map(c => ({
        ...c,
        item_count: counts.get(c.id) || 0,
        owner_name: nameMap.get(c.user_id) || "Unknown",
      })));
    }
  };

  useEffect(() => { loadCollections(); }, []);

  const createCollection = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase.from("collections").insert({
      name: name.trim(),
      description: description.trim() || null,
      is_public: isPublic,
      user_id: user.id,
    });
    if (error) {
      toast({ title: "Lỗi khi tạo bộ sưu tập!", variant: "destructive" });
    } else {
      toast({ title: "Đã tạo bộ sưu tập!" });
      setName("");
      setDescription("");
      setShowCreate(false);
      loadCollections();
    }
    setLoading(false);
  };

  const deleteCollection = async (id: string) => {
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (!error) {
      setCollections(prev => prev.filter(c => c.id !== id));
      toast({ title: "Đã xóa bộ sưu tập!" });
    }
  };

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => navigate("/")} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <FolderOpen className="w-7 h-7 text-primary animate-pulse-glow" />
        <h1 className="text-xl font-bold neon-text">Bộ Sưu Tập</h1>
        <div className="flex-1" />
        <NotificationBell />
        <UserMenu />
      </header>

      <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
        {user && (
          <div>
            {!showCreate ? (
              <Button onClick={() => setShowCreate(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Tạo bộ sưu tập mới
              </Button>
            ) : (
              <div className="glow-card rounded-xl p-6 space-y-4">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tên bộ sưu tập..." className="bg-muted/30" />
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Mô tả..." className="bg-muted/30" rows={2} />
                <div className="flex items-center gap-3">
                  <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    {isPublic ? <><Globe className="w-4 h-4" /> Công khai</> : <><Lock className="w-4 h-4" /> Riêng tư</>}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={createCollection} disabled={loading || !name.trim()} className="gap-2">
                    <Save className="w-4 h-4" /> Tạo
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreate(false)}><X className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </div>
        )}

        {!user && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Đăng nhập để tạo bộ sưu tập</p>
            <Button variant="outline" onClick={() => navigate("/auth")} className="mt-2">Đăng nhập</Button>
          </div>
        )}

        <div className="grid gap-4">
          {collections.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Chưa có bộ sưu tập nào</p>
            </div>
          )}
          {collections.map(col => (
            <button
              key={col.id}
              onClick={() => navigate(`/collections/${col.id}`)}
              className="w-full text-left glow-card rounded-xl p-5 hover:neon-border transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground truncate">{col.name}</h3>
                    {col.is_public ? <Globe className="w-4 h-4 text-primary shrink-0" /> : <Lock className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </div>
                  {col.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{col.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{col.item_count} repo</span>
                    <span>bởi {col.owner_name}</span>
                    <span>{new Date(col.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
                {user?.id === col.user_id && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteCollection(col.id); }}
                    className="p-2 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Collections;
