import { useState, useEffect } from "react";
import { PenTool, Plus, Trash2, ArrowLeft, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DrawingCanvas, { type Stroke } from "@/components/DrawingCanvas";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

interface Note {
  id: string;
  title: string;
  drawing_data: Stroke[];
  linked_type: string | null;
  linked_id: string | null;
  created_at: string;
  updated_at: string;
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentStrokes, setCurrentStrokes] = useState<Stroke[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const linkedType = searchParams.get("type");
  const linkedId = searchParams.get("id");

  useEffect(() => {
    const load = async () => {
      let query = supabase.from("notes").select("*").order("updated_at", { ascending: false });
      if (linkedType && linkedId) {
        query = query.eq("linked_type", linkedType).eq("linked_id", linkedId);
      }
      const { data } = await query;
      if (data) {
        const mapped = data.map((n: any) => ({
          ...n,
          drawing_data: Array.isArray(n.drawing_data) ? n.drawing_data : [],
        }));
        setNotes(mapped);
        if (mapped.length > 0 && !selected) {
          setSelected(mapped[0].id);
          setCurrentStrokes(mapped[0].drawing_data);
        }
      }
    };
    load();
  }, [linkedType, linkedId]);

  const createNote = async () => {
    const { data, error } = await supabase
      .from("notes")
      .insert({
        title: "Note mới",
        drawing_data: [],
        linked_type: linkedType,
        linked_id: linkedId,
      })
      .select()
      .single();

    if (error || !data) {
      toast({ title: "Lỗi tạo note!", variant: "destructive" });
      return;
    }

    const newNote: Note = { ...data, drawing_data: [] };
    setNotes(prev => [newNote, ...prev]);
    setSelected(newNote.id);
    setCurrentStrokes([]);
    toast({ title: "✏️ Đã tạo note mới!" });
  };

  const saveNote = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("notes")
      .update({ drawing_data: currentStrokes as any, updated_at: new Date().toISOString() })
      .eq("id", selected);
    setSaving(false);

    if (error) {
      toast({ title: "Lỗi lưu!", variant: "destructive" });
      return;
    }
    setNotes(prev => prev.map(n => n.id === selected ? { ...n, drawing_data: currentStrokes, updated_at: new Date().toISOString() } : n));
    toast({ title: "💾 Đã lưu!" });
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selected === id) {
      setSelected(null);
      setCurrentStrokes([]);
    }
  };

  const renameNote = async (id: string, title: string) => {
    await supabase.from("notes").update({ title }).eq("id", id);
    setNotes(prev => prev.map(n => n.id === id ? { ...n, title } : n));
  };

  const selectNote = (note: Note) => {
    setSelected(note.id);
    setCurrentStrokes(note.drawing_data);
  };

  const selectedNote = notes.find(n => n.id === selected);

  return (
    <div className="min-h-screen aurora-bg flex flex-col">
      {/* Header */}
      <header className="glass border-b border-border/50 px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-muted/30 flex items-center justify-center hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <PenTool className="w-7 h-7 text-secondary animate-pulse-glow" />
        <h1 className="text-xl font-bold neon-text">
          {linkedType ? `Notes - ${linkedType === "repo" ? "Repo" : linkedType === "airdrop" ? "Airdrop" : "AI Tool"}` : "Sổ Vẽ"}
        </h1>
        <div className="flex-1" />
        {selected && (
          <Button onClick={saveNote} disabled={saving} size="sm" className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Lưu
          </Button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 min-w-[220px] border-r border-border/50 flex flex-col">
          <div className="p-3">
            <Button onClick={createNote} className="w-full gap-2" size="sm">
              <Plus className="w-4 h-4" /> Tạo Note
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1.5 scrollbar-thin">
            {notes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <PenTool className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chưa có note</p>
              </div>
            )}
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`group relative p-3 rounded-lg cursor-pointer transition-all ${
                  selected === note.id
                    ? "bg-primary/20 border border-primary/40"
                    : "bg-muted/20 border border-transparent hover:bg-muted/40"
                }`}
              >
                <input
                  className="bg-transparent text-sm font-medium w-full outline-none text-foreground"
                  value={note.title}
                  onChange={(e) => renameNote(note.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(note.updated_at).toLocaleDateString("vi-VN")}
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="absolute top-2 right-2 p-1 rounded bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {selectedNote ? (
            <DrawingCanvas
              key={selected}
              initialData={selectedNote.drawing_data}
              onChange={setCurrentStrokes}
              className="flex-1"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <PenTool className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Chọn hoặc tạo note mới để bắt đầu vẽ</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Notes;
