import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { Pencil, Eraser, Undo2, Redo2, Trash2, Download, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: "pen" | "eraser";
}

interface DrawingCanvasProps {
  initialData?: Stroke[];
  onChange?: (strokes: Stroke[]) => void;
  className?: string;
  overlay?: ReactNode;
}

const COLORS = [
  "hsl(0, 0%, 100%)",
  "hsl(0, 84%, 60%)",
  "hsl(30, 90%, 55%)",
  "hsl(50, 90%, 55%)",
  "hsl(120, 60%, 50%)",
  "hsl(200, 80%, 55%)",
  "hsl(265, 90%, 65%)",
  "hsl(320, 80%, 60%)",
];

const DrawingCanvas = ({ initialData = [], onChange, className = "", overlay }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(3);
  const [strokes, setStrokes] = useState<Stroke[]>(initialData);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [undoneStrokes, setUndoneStrokes] = useState<Stroke[]>([]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

    for (const stroke of allStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === "eraser" ? "hsl(230, 25%, 7%)" : stroke.color;
      ctx.lineWidth = stroke.tool === "eraser" ? stroke.width * 4 : stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width;
      canvas.height = rect.height;
      redraw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [redraw]);

  useEffect(() => { redraw(); }, [redraw]);

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    setIsDrawing(true);
    setCurrentStroke({ points: [pos], color, width: lineWidth, tool });
    setUndoneStrokes([]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();
    const pos = getPos(e);
    setCurrentStroke(prev => prev ? { ...prev, points: [...prev.points, pos] } : null);
  };

  const endDraw = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    if (currentStroke.points.length >= 2) {
      const newStrokes = [...strokes, currentStroke];
      setStrokes(newStrokes);
      onChange?.(newStrokes);
    }
    setCurrentStroke(null);
  };

  const undo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setUndoneStrokes(prev => [...prev, last]);
    const newStrokes = strokes.slice(0, -1);
    setStrokes(newStrokes);
    onChange?.(newStrokes);
  };

  const redo = () => {
    if (undoneStrokes.length === 0) return;
    const last = undoneStrokes[undoneStrokes.length - 1];
    setUndoneStrokes(prev => prev.slice(0, -1));
    const newStrokes = [...strokes, last];
    setStrokes(newStrokes);
    onChange?.(newStrokes);
  };

  const clearAll = () => {
    setStrokes([]);
    setUndoneStrokes([]);
    onChange?.([]);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "note.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 glass border-b border-border/50 flex-wrap">
        <Button
          size="sm"
          variant={tool === "pen" ? "default" : "outline"}
          onClick={() => setTool("pen")}
          className="gap-1.5"
        >
          <Pencil className="w-3.5 h-3.5" /> Bút
        </Button>
        <Button
          size="sm"
          variant={tool === "eraser" ? "default" : "outline"}
          onClick={() => setTool("eraser")}
          className="gap-1.5"
        >
          <Eraser className="w-3.5 h-3.5" /> Tẩy
        </Button>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Colors */}
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool("pen"); }}
              className={`w-6 h-6 rounded-full border-2 transition-all ${
                color === c && tool === "pen" ? "border-primary scale-125" : "border-border/50"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-border/50 mx-1" />

        {/* Line width */}
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setLineWidth(Math.max(1, lineWidth - 1))}>
            <Minus className="w-3 h-3" />
          </Button>
          <span className="text-xs text-muted-foreground w-4 text-center">{lineWidth}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setLineWidth(Math.min(20, lineWidth + 1))}>
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border/50 mx-1" />

        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={undo} disabled={strokes.length === 0}>
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={redo} disabled={undoneStrokes.length === 0}>
          <Redo2 className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={clearAll}>
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={exportImage}>
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative bg-background cursor-crosshair" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {overlay}
      </div>
    </div>
  );
};

export type { Stroke };
export default DrawingCanvas;
