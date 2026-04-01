import { useState, useEffect } from "react";
import { GitFork, Cpu, Coins, Search, Plus, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONNECTION_STYLES } from "@/components/NodeMapLayer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Entity {
  id: string;
  name: string;
  type: "repo" | "airdrop" | "ai_tool";
  avatarUrl?: string;
}

interface EntityPickerProps {
  onAddNode: (entity: Entity) => void;
  connectMode: boolean;
  onToggleConnectMode: () => void;
  selectedStyle: string;
  onStyleChange: (style: string) => void;
}

const tabs = [
  { key: "repo" as const, label: "Repo", icon: GitFork },
  { key: "airdrop" as const, label: "Airdrop", icon: Coins },
  { key: "ai_tool" as const, label: "AI Tool", icon: Cpu },
];

const EntityPicker = ({ onAddNode, connectMode, onToggleConnectMode, selectedStyle, onStyleChange }: EntityPickerProps) => {
  const [tab, setTab] = useState<"repo" | "airdrop" | "ai_tool">("repo");
  const [search, setSearch] = useState("");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showStyles, setShowStyles] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (tab === "repo") {
        const { data } = await supabase.from("saved_repos").select("id, name, owner_avatar_url").limit(50);
        setEntities((data || []).map((r: any) => ({ id: r.id, name: r.name, type: "repo", avatarUrl: r.owner_avatar_url })));
      } else if (tab === "airdrop") {
        const { data } = await supabase.from("airdrop_projects").select("id, name, logo_url").limit(50);
        setEntities((data || []).map((a: any) => ({ id: a.id, name: a.name, type: "airdrop", avatarUrl: a.logo_url })));
      } else {
        const { data } = await supabase.from("ai_tools").select("id, name, logo_url").limit(50);
        setEntities((data || []).map((t: any) => ({ id: t.id, name: t.name, type: "ai_tool", avatarUrl: t.logo_url })));
      }
      setLoading(false);
    };
    load();
  }, [tab]);

  const filtered = entities.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
  const typeColors = { repo: "text-purple-400", airdrop: "text-amber-400", ai_tool: "text-cyan-400" };
  const currentStyleObj = CONNECTION_STYLES.find((s) => s.key === selectedStyle) || CONNECTION_STYLES[0];

  return (
    <div className="w-56 border-l border-border/50 flex flex-col bg-background/50">
      <div className="p-2 border-b border-border/50 space-y-2">
        <Button
          size="sm"
          variant={connectMode ? "default" : "outline"}
          className="w-full gap-2"
          onClick={onToggleConnectMode}
        >
          <Link2 className="w-3.5 h-3.5" />
          {connectMode ? "Đang nối…" : "Nối liên kết"}
        </Button>

        {/* Style selector toggle */}
        <button
          onClick={() => setShowStyles((p) => !p)}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs text-muted-foreground hover:bg-muted/40 transition-colors"
        >
          <span>Kiểu nối: <span className="text-foreground font-medium">{currentStyleObj.emoji} {currentStyleObj.label}</span></span>
          <span className="text-[10px]">{showStyles ? "▲" : "▼"}</span>
        </button>

        {showStyles && (
          <ScrollArea className="max-h-48">
            <div className="grid grid-cols-2 gap-1 pr-2">
              {CONNECTION_STYLES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => { onStyleChange(s.key); setShowStyles(false); }}
                  className={`flex items-center gap-1 px-1.5 py-1 rounded text-[10px] transition-colors ${
                    selectedStyle === s.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/30"
                  }`}
                >
                  <span className="text-xs">{s.emoji}</span>
                  <span className="truncate">{s.label}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(""); }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors ${
                tab === t.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <t.icon className="w-3 h-3" />
            </button>
          ))}
        </div>
      </div>

      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm..."
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 scrollbar-thin">
        {loading && <p className="text-xs text-muted-foreground text-center py-4">Đang tải...</p>}
        {!loading && filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Không có dữ liệu</p>}
        {filtered.map((entity) => (
          <button
            key={entity.id}
            onClick={() => onAddNode(entity)}
            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors text-left group"
          >
            {entity.avatarUrl ? (
              <img src={entity.avatarUrl} alt="" className="w-6 h-6 rounded-full ring-1 ring-border object-cover" />
            ) : (
              <div className={`w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center ${typeColors[entity.type]}`}>
                {entity.type === "repo" ? <GitFork className="w-3 h-3" /> : entity.type === "airdrop" ? <Coins className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
              </div>
            )}
            <span className="text-xs text-foreground truncate flex-1">{entity.name}</span>
            <Plus className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default EntityPicker;
