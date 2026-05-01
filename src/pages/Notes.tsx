import { useState, useEffect } from "react";
import { PenTool, Plus, Trash2, ArrowLeft, Save, Loader2, Sparkles, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import DrawingCanvas, { type Stroke } from "@/components/DrawingCanvas";
import NodeMapLayer, { type CanvasNode, type NodeConnection } from "@/components/NodeMapLayer";
import EntityPicker from "@/components/EntityPicker";
import NodeAIPanel from "@/components/NodeAIPanel";
import NodeInfoPanel from "@/components/NodeInfoPanel";
import SmartSketchPanel from "@/components/SmartSketchPanel";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

interface NoteData {
  strokes: Stroke[];
  nodes: CanvasNode[];
  connections: NodeConnection[];
}

interface Note {
  id: string;
  title: string;
  data: NoteData;
  linked_type: string | null;
  linked_id: string | null;
  created_at: string;
  updated_at: string;
}

const emptyData: NoteData = { strokes: [], nodes: [], connections: [] };

const parseDrawingData = (raw: any): NoteData => {
  if (!raw) return emptyData;
  // New format: { strokes, nodes, connections }
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "strokes" in raw) {
    return {
      strokes: Array.isArray(raw.strokes) ? raw.strokes : [],
      nodes: Array.isArray(raw.nodes) ? raw.nodes : [],
      connections: Array.isArray(raw.connections) ? raw.connections : [],
    };
  }
  // Legacy format: Stroke[]
  if (Array.isArray(raw)) {
    return { strokes: raw, nodes: [], connections: [] };
  }
  return emptyData;
};

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentStrokes, setCurrentStrokes] = useState<Stroke[]>([]);
  const [currentNodes, setCurrentNodes] = useState<CanvasNode[]>([]);
  const [currentConnections, setCurrentConnections] = useState<NodeConnection[]>([]);
  const [connectMode, setConnectMode] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("solid");
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [inspectNode, setInspectNode] = useState<CanvasNode | null>(null);
  const [showSmartPanel, setShowSmartPanel] = useState(false);
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
        const mapped: Note[] = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          data: parseDrawingData(n.drawing_data),
          linked_type: n.linked_type,
          linked_id: n.linked_id,
          created_at: n.created_at,
          updated_at: n.updated_at,
        }));
        setNotes(mapped);
        if (mapped.length > 0 && !selected) {
          setSelected(mapped[0].id);
          setCurrentStrokes(mapped[0].data.strokes);
          setCurrentNodes(mapped[0].data.nodes);
          setCurrentConnections(mapped[0].data.connections);
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
        drawing_data: emptyData as any,
        linked_type: linkedType,
        linked_id: linkedId,
      })
      .select()
      .single();

    if (error || !data) {
      toast({ title: "Lỗi tạo note!", variant: "destructive" });
      return;
    }

    const newNote: Note = { id: data.id, title: data.title, data: emptyData, linked_type: data.linked_type, linked_id: data.linked_id, created_at: data.created_at, updated_at: data.updated_at };
    setNotes((prev) => [newNote, ...prev]);
    setSelected(newNote.id);
    setCurrentStrokes([]);
    setCurrentNodes([]);
    setCurrentConnections([]);
    toast({ title: "✏️ Đã tạo note mới!" });
  };

  const saveNote = async () => {
    if (!selected) return;
    setSaving(true);
    const drawingData: NoteData = { strokes: currentStrokes, nodes: currentNodes, connections: currentConnections };
    const { error } = await supabase
      .from("notes")
      .update({ drawing_data: drawingData as any, updated_at: new Date().toISOString() })
      .eq("id", selected);
    setSaving(false);

    if (error) {
      toast({ title: "Lỗi lưu!", variant: "destructive" });
      return;
    }
    setNotes((prev) => prev.map((n) => (n.id === selected ? { ...n, data: drawingData, updated_at: new Date().toISOString() } : n)));
    toast({ title: "💾 Đã lưu!" });
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selected === id) {
      setSelected(null);
      setCurrentStrokes([]);
      setCurrentNodes([]);
      setCurrentConnections([]);
    }
  };

  const renameNote = async (id: string, title: string) => {
    await supabase.from("notes").update({ title }).eq("id", id);
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, title } : n)));
  };

  const selectNote = (note: Note) => {
    setSelected(note.id);
    setCurrentStrokes(note.data.strokes);
    setCurrentNodes(note.data.nodes);
    setCurrentConnections(note.data.connections);
    setConnectMode(false);
  };

  const addNodeFromEntity = (entity: { id: string; name: string; type: "repo" | "airdrop" | "ai_tool"; avatarUrl?: string }) => {
    const newNode: CanvasNode = {
      id: crypto.randomUUID(),
      type: entity.type,
      entityId: entity.id,
      name: entity.name,
      x: 200 + Math.random() * 300,
      y: 150 + Math.random() * 200,
      avatarUrl: entity.avatarUrl,
    };
    setCurrentNodes((prev) => [...prev, newNode]);
  };

  const handleAIAddConnection = (fromName: string, toName: string) => {
    const fromNode = currentNodes.find((n) => n.name === fromName);
    const toNode = currentNodes.find((n) => n.name === toName);
    if (!fromNode || !toNode) return;
    const exists = currentConnections.some(
      (c) => (c.fromId === fromNode.id && c.toId === toNode.id) || (c.fromId === toNode.id && c.toId === fromNode.id)
    );
    if (!exists) {
      setCurrentConnections((prev) => [...prev, { id: crypto.randomUUID(), fromId: fromNode.id, toId: toNode.id, style: "glow-cyan" }]);
    }
  };

  const selectedNote = notes.find((n) => n.id === selected);

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
          <>
            <Button onClick={saveNote} disabled={saving} size="sm" className="gap-1.5">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Lưu
            </Button>
            <Button
              onClick={() => setShowAIPanel((p) => !p)}
              size="sm"
              variant={showAIPanel ? "default" : "outline"}
              className="gap-1.5"
              disabled={currentNodes.length < 2}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Yêu cầu AI
            </Button>
            <Button
              onClick={() => setShowSmartPanel((p) => !p)}
              size="sm"
              variant={showSmartPanel ? "default" : "outline"}
              className="gap-1.5"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Gợi ý thông minh
            </Button>
          </>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Note list */}
        <aside className="w-56 min-w-[200px] border-r border-border/50 flex flex-col">
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
                  selected === note.id ? "bg-primary/20 border border-primary/40" : "bg-muted/20 border border-transparent hover:bg-muted/40"
                }`}
              >
                <input
                  className="bg-transparent text-sm font-medium w-full outline-none text-foreground"
                  value={note.title}
                  onChange={(e) => renameNote(note.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-xs text-muted-foreground">{new Date(note.updated_at).toLocaleDateString("vi-VN")}</p>
                  {note.data.nodes.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{note.data.nodes.length} node</span>
                  )}
                </div>
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
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {selectedNote ? (
            <DrawingCanvas
              key={selected}
              initialData={currentStrokes}
              onChange={setCurrentStrokes}
              className="flex-1"
              overlay={
                <NodeMapLayer
                  nodes={currentNodes}
                  connections={currentConnections}
                  onNodesChange={setCurrentNodes}
                  onConnectionsChange={setCurrentConnections}
                  connectMode={connectMode}
                  selectedStyle={selectedStyle}
                  onNodeClick={(node) => setInspectNode(node)}
                />
              }
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <PenTool className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Chọn hoặc tạo note mới để bắt đầu vẽ</p>
              </div>
            </div>
          )}
          {/* AI Panel */}
          {showAIPanel && selectedNote && (
            <NodeAIPanel
              nodes={currentNodes}
              connections={currentConnections}
              onAddConnection={handleAIAddConnection}
              onClose={() => setShowAIPanel(false)}
            />
          )}
          {/* Node Info Panel */}
          {inspectNode && (
            <NodeInfoPanel
              node={inspectNode}
              onClose={() => setInspectNode(null)}
            />
          )}
          {/* Smart Sketchbook AI suggestions */}
          {showSmartPanel && selectedNote && (
            <SmartSketchPanel
              noteTitle={selectedNote.title}
              nodes={currentNodes}
              strokeCount={currentStrokes.length}
              onClose={() => setShowSmartPanel(false)}
            />
          )}
        </main>

        {/* Entity Picker - right panel */}
        {selectedNote && (
          <EntityPicker
            onAddNode={addNodeFromEntity}
            connectMode={connectMode}
            onToggleConnectMode={() => setConnectMode((p) => !p)}
            selectedStyle={selectedStyle}
            onStyleChange={setSelectedStyle}
          />
        )}
      </div>
    </div>
  );
};

export default Notes;
