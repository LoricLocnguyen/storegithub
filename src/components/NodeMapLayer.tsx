import { useState, useRef, useCallback } from "react";
import { GitFork, Cpu, Coins, X, Palette } from "lucide-react";

export interface CanvasNode {
  id: string;
  type: "repo" | "airdrop" | "ai_tool";
  entityId: string;
  name: string;
  x: number;
  y: number;
  avatarUrl?: string;
  color?: string;
}

const NODE_COLORS = [
  { key: "default", color: "hsl(230 25% 12%)", border: "hsl(var(--border))", label: "Mặc định" },
  { key: "purple", color: "hsl(265 40% 18%)", border: "hsl(265 90% 65%)", label: "Tím" },
  { key: "cyan", color: "hsl(195 40% 15%)", border: "hsl(195 80% 55%)", label: "Xanh dương" },
  { key: "amber", color: "hsl(40 40% 15%)", border: "hsl(40 90% 55%)", label: "Vàng" },
  { key: "green", color: "hsl(140 30% 14%)", border: "hsl(140 60% 50%)", label: "Xanh lá" },
  { key: "red", color: "hsl(0 35% 16%)", border: "hsl(0 70% 55%)", label: "Đỏ" },
  { key: "pink", color: "hsl(320 35% 16%)", border: "hsl(320 70% 60%)", label: "Hồng" },
  { key: "blue", color: "hsl(220 40% 16%)", border: "hsl(220 70% 55%)", label: "Xanh" },
  { key: "orange", color: "hsl(25 40% 16%)", border: "hsl(25 80% 55%)", label: "Cam" },
  { key: "teal", color: "hsl(170 35% 14%)", border: "hsl(170 60% 45%)", label: "Ngọc" },
  { key: "lime", color: "hsl(80 35% 14%)", border: "hsl(80 60% 50%)", label: "Chanh" },
  { key: "indigo", color: "hsl(240 35% 18%)", border: "hsl(240 60% 60%)", label: "Chàm" },
  { key: "rose", color: "hsl(350 35% 17%)", border: "hsl(350 70% 55%)", label: "Hoa hồng" },
];

const getNodeColor = (key?: string) => NODE_COLORS.find(c => c.key === key) || NODE_COLORS[0];

export interface NodeConnection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  style?: string; // key into CONNECTION_STYLES
}

export interface ConnectionStyle {
  key: string;
  label: string;
  emoji: string;
  color: string;
  strokeWidth: number;
  dasharray?: string;
  animated?: boolean;
  arrow?: boolean;
  curveType?: "straight" | "curve" | "step";
}

export const CONNECTION_STYLES: ConnectionStyle[] = [
  { key: "solid", label: "Nối thẳng", emoji: "━", color: "hsl(265 90% 65% / 0.5)", strokeWidth: 2, curveType: "straight" },
  { key: "dashed", label: "Nét đứt", emoji: "┄", color: "hsl(265 90% 65% / 0.5)", strokeWidth: 2, dasharray: "8 4", curveType: "straight" },
  { key: "dotted", label: "Chấm chấm", emoji: "···", color: "hsl(265 90% 65% / 0.5)", strokeWidth: 2, dasharray: "2 4", curveType: "straight" },
  { key: "arrow", label: "Mũi tên", emoji: "→", color: "hsl(265 90% 65% / 0.6)", strokeWidth: 2, arrow: true, curveType: "straight" },
  { key: "arrow-dash", label: "Mũi tên đứt", emoji: "⇢", color: "hsl(265 90% 65% / 0.5)", strokeWidth: 2, dasharray: "8 4", arrow: true, curveType: "straight" },
  { key: "curve", label: "Cong", emoji: "⌢", color: "hsl(195 80% 55% / 0.5)", strokeWidth: 2, curveType: "curve" },
  { key: "curve-arrow", label: "Cong mũi tên", emoji: "↷", color: "hsl(195 80% 55% / 0.6)", strokeWidth: 2, arrow: true, curveType: "curve" },
  { key: "step", label: "Bậc thang", emoji: "⌐", color: "hsl(160 60% 50% / 0.5)", strokeWidth: 2, curveType: "step" },
  { key: "thick", label: "Dày", emoji: "▬", color: "hsl(265 90% 65% / 0.4)", strokeWidth: 4, curveType: "straight" },
  { key: "thin", label: "Mảnh", emoji: "─", color: "hsl(265 90% 65% / 0.6)", strokeWidth: 1, curveType: "straight" },
  { key: "glow-purple", label: "Phát sáng tím", emoji: "🟣", color: "hsl(265 90% 65% / 0.7)", strokeWidth: 3, animated: true, curveType: "straight" },
  { key: "glow-cyan", label: "Phát sáng xanh", emoji: "🔵", color: "hsl(195 80% 55% / 0.7)", strokeWidth: 3, animated: true, curveType: "straight" },
  { key: "glow-amber", label: "Phát sáng vàng", emoji: "🟡", color: "hsl(40 90% 55% / 0.7)", strokeWidth: 3, animated: true, curveType: "straight" },
  { key: "glow-green", label: "Phát sáng xanh lá", emoji: "🟢", color: "hsl(140 60% 50% / 0.7)", strokeWidth: 3, animated: true, curveType: "straight" },
  { key: "glow-red", label: "Phát sáng đỏ", emoji: "🔴", color: "hsl(0 70% 55% / 0.7)", strokeWidth: 3, animated: true, curveType: "straight" },
  { key: "double", label: "Đôi", emoji: "═", color: "hsl(265 90% 65% / 0.4)", strokeWidth: 1, curveType: "straight" },
  { key: "zigzag", label: "Zích zắc", emoji: "⚡", color: "hsl(50 90% 55% / 0.6)", strokeWidth: 2, curveType: "straight" },
  { key: "wave", label: "Sóng", emoji: "〰", color: "hsl(195 80% 55% / 0.5)", strokeWidth: 2, curveType: "curve" },
  { key: "fade", label: "Mờ dần", emoji: "░", color: "hsl(265 90% 65% / 0.3)", strokeWidth: 3, curveType: "straight" },
  { key: "bold-arrow", label: "Mũi tên đậm", emoji: "➤", color: "hsl(0 0% 80% / 0.7)", strokeWidth: 4, arrow: true, curveType: "straight" },
  { key: "curve-dash", label: "Cong đứt", emoji: "⌒", color: "hsl(320 70% 55% / 0.5)", strokeWidth: 2, dasharray: "6 4", curveType: "curve" },
  { key: "step-arrow", label: "Bậc thang mũi tên", emoji: "⇲", color: "hsl(160 60% 50% / 0.6)", strokeWidth: 2, arrow: true, curveType: "step" },
  { key: "rainbow", label: "Cầu vồng", emoji: "🌈", color: "url(#rainbowGrad)", strokeWidth: 3, curveType: "curve" },
  { key: "dotted-arrow", label: "Chấm mũi tên", emoji: "⤳", color: "hsl(265 90% 65% / 0.5)", strokeWidth: 2, dasharray: "2 4", arrow: true, curveType: "straight" },
];

const getStyleByKey = (key?: string): ConnectionStyle => CONNECTION_STYLES.find((s) => s.key === key) || CONNECTION_STYLES[0];

const typeConfig: Record<string, { icon: typeof GitFork; color: string }> = {
  repo: { icon: GitFork, color: "text-purple-400" },
  airdrop: { icon: Coins, color: "text-amber-400" },
  ai_tool: { icon: Cpu, color: "text-cyan-400" },
};

interface NodeMapLayerProps {
  nodes: CanvasNode[];
  connections: NodeConnection[];
  onNodesChange: (nodes: CanvasNode[]) => void;
  onConnectionsChange: (connections: NodeConnection[]) => void;
  connectMode: boolean;
  selectedStyle: string;
}

const buildPath = (from: CanvasNode, to: CanvasNode, curveType: string) => {
  if (curveType === "curve") {
    const cx = (from.x + to.x) / 2;
    const cy = Math.min(from.y, to.y) - 60;
    return `M${from.x},${from.y} Q${cx},${cy} ${to.x},${to.y}`;
  }
  if (curveType === "step") {
    const mx = (from.x + to.x) / 2;
    return `M${from.x},${from.y} L${mx},${from.y} L${mx},${to.y} L${to.x},${to.y}`;
  }
  return `M${from.x},${from.y} L${to.x},${to.y}`;
};

const buildZigzag = (from: CanvasNode, to: CanvasNode) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(4, Math.floor(dist / 20));
  const amp = 8;
  let d = `M${from.x},${from.y}`;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + dx * t;
    const y = from.y + dy * t;
    const perpX = -dy / dist * amp * (i % 2 === 0 ? 1 : -1);
    const perpY = dx / dist * amp * (i % 2 === 0 ? 1 : -1);
    if (i < steps) {
      d += ` L${x + perpX},${y + perpY}`;
    } else {
      d += ` L${x},${y}`;
    }
  }
  return d;
};

const buildDoublePath = (from: CanvasNode, to: CanvasNode, offset: number) => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const px = (-dy / dist) * offset;
  const py = (dx / dist) * offset;
  return `M${from.x + px},${from.y + py} L${to.x + px},${to.y + py}`;
};

const NodeMapLayer = ({ nodes, connections, onNodesChange, onConnectionsChange, connectMode, selectedStyle }: NodeMapLayerProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [colorPickerNode, setColorPickerNode] = useState<string | null>(null);

  const getSvgPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleDoubleClick = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    setEditingNode(node.id);
    setEditName(node.name);
  };

  const commitRename = () => {
    if (editingNode && editName.trim()) {
      onNodesChange(nodes.map(n => n.id === editingNode ? { ...n, name: editName.trim() } : n));
    }
    setEditingNode(null);
  };

  const changeNodeColor = (nodeId: string, colorKey: string) => {
    onNodesChange(nodes.map(n => n.id === nodeId ? { ...n, color: colorKey } : n));
    setColorPickerNode(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    if (connectMode) {
      if (connectFrom && connectFrom !== node.id) {
        const exists = connections.some(
          (c) => (c.fromId === connectFrom && c.toId === node.id) || (c.fromId === node.id && c.toId === connectFrom)
        );
        if (!exists) {
          onConnectionsChange([...connections, { id: crypto.randomUUID(), fromId: connectFrom, toId: node.id, style: selectedStyle }]);
        }
        setConnectFrom(null);
      } else {
        setConnectFrom(node.id);
      }
      return;
    }
    const pt = getSvgPoint(e);
    setDragging(node.id);
    setDragOffset({ x: pt.x - node.x, y: pt.y - node.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const pt = getSvgPoint(e);
    onNodesChange(nodes.map((n) => (n.id === dragging ? { ...n, x: pt.x - dragOffset.x, y: pt.y - dragOffset.y } : n)));
  };

  const handleMouseUp = () => setDragging(null);

  const removeNode = (id: string) => {
    onNodesChange(nodes.filter((n) => n.id !== id));
    onConnectionsChange(connections.filter((c) => c.fromId !== id && c.toId !== id));
  };

  const removeConnection = (id: string) => {
    onConnectionsChange(connections.filter((c) => c.id !== id));
  };

  const getNode = (id: string) => nodes.find((n) => n.id === id);

  const renderConnection = (conn: NodeConnection) => {
    const from = getNode(conn.fromId);
    const to = getNode(conn.toId);
    if (!from || !to) return null;

    const style = getStyleByKey(conn.style);
    const markerId = style.arrow ? `arrow-${conn.id}` : undefined;

    // Special: zigzag
    if (conn.style === "zigzag") {
      return (
        <g key={conn.id}>
          <path
            d={buildZigzag(from, to)}
            fill="none"
            stroke={style.color}
            strokeWidth={style.strokeWidth}
            className="pointer-events-auto cursor-pointer"
            onClick={() => removeConnection(conn.id)}
          />
        </g>
      );
    }

    // Special: double line
    if (conn.style === "double") {
      return (
        <g key={conn.id}>
          <path d={buildDoublePath(from, to, 3)} fill="none" stroke={style.color} strokeWidth={style.strokeWidth} className="pointer-events-auto cursor-pointer" onClick={() => removeConnection(conn.id)} />
          <path d={buildDoublePath(from, to, -3)} fill="none" stroke={style.color} strokeWidth={style.strokeWidth} className="pointer-events-auto cursor-pointer" onClick={() => removeConnection(conn.id)} />
        </g>
      );
    }

    const pathD = buildPath(from, to, style.curveType || "straight");

    return (
      <g key={conn.id}>
        {/* Glow effect for animated styles */}
        {style.animated && (
          <path d={pathD} fill="none" stroke={style.color} strokeWidth={style.strokeWidth + 4} opacity={0.15} filter="url(#glow)" />
        )}
        {/* Arrow marker */}
        {style.arrow && (
          <defs>
            <marker id={markerId} viewBox="0 0 10 7" refX="9" refY="3.5" markerWidth={8} markerHeight={6} orient="auto-start-reverse">
              <polygon points="0 0, 10 3.5, 0 7" fill={style.color} />
            </marker>
          </defs>
        )}
        {/* Fade: gradient opacity */}
        {conn.style === "fade" && (
          <defs>
            <linearGradient id={`fade-${conn.id}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={style.color} stopOpacity={0.8} />
              <stop offset="100%" stopColor={style.color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
        )}
        <path
          d={pathD}
          fill="none"
          stroke={conn.style === "fade" ? `url(#fade-${conn.id})` : style.color}
          strokeWidth={style.strokeWidth}
          strokeDasharray={style.dasharray}
          strokeLinecap="round"
          markerEnd={markerId ? `url(#${markerId})` : undefined}
          className="pointer-events-auto cursor-pointer"
          onClick={() => removeConnection(conn.id)}
        />
        {/* Animated dot for glow styles */}
        {style.animated && (
          <circle r={3} fill={style.color}>
            <animateMotion dur="2s" repeatCount="indefinite" path={pathD} />
          </circle>
        )}
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 10 }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(0 80% 60%)" />
          <stop offset="20%" stopColor="hsl(40 90% 55%)" />
          <stop offset="40%" stopColor="hsl(60 90% 50%)" />
          <stop offset="60%" stopColor="hsl(140 60% 50%)" />
          <stop offset="80%" stopColor="hsl(200 80% 55%)" />
          <stop offset="100%" stopColor="hsl(280 80% 60%)" />
        </linearGradient>
      </defs>

      {/* Connections */}
      {connections.map(renderConnection)}

      {/* Nodes */}
      {nodes.map((node) => {
        const cfg = typeConfig[node.type] || typeConfig.repo;
        const isConnecting = connectFrom === node.id;
        const nodeColor = getNodeColor(node.color);
        const isEditing = editingNode === node.id;
        const showColorPicker = colorPickerNode === node.id;
        return (
          <g
            key={node.id}
            className="pointer-events-auto cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
            onDoubleClick={(e) => handleDoubleClick(e, node)}
          >
            {isConnecting && (
              <circle cx={node.x} cy={node.y} r={38} fill="none" stroke="hsl(265 90% 65% / 0.5)" strokeWidth={2} strokeDasharray="4 2">
                <animate attributeName="r" values="38;42;38" dur="1s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Glow ring for colored nodes */}
            {node.color && node.color !== "default" && (
              <circle cx={node.x} cy={node.y} r={35} fill="none" stroke={nodeColor.border} strokeWidth={1} opacity={0.3} />
            )}
            <circle cx={node.x} cy={node.y} r={32} fill={nodeColor.color} stroke={isConnecting ? "hsl(265 90% 65%)" : nodeColor.border} strokeWidth={1.5} />
            {node.avatarUrl ? (
              <>
                <clipPath id={`clip-${node.id}`}>
                  <circle cx={node.x} cy={node.y - 4} r={12} />
                </clipPath>
                <image href={node.avatarUrl} x={node.x - 12} y={node.y - 16} width={24} height={24} clipPath={`url(#clip-${node.id})`} />
              </>
            ) : (
              <foreignObject x={node.x - 10} y={node.y - 16} width={20} height={20}>
                <div className={`flex items-center justify-center ${cfg.color}`}>
                  <cfg.icon size={16} />
                </div>
              </foreignObject>
            )}
            {/* Name - editable on double click */}
            {isEditing ? (
              <foreignObject x={node.x - 50} y={node.y + 8} width={100} height={22}>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditingNode(null); }}
                  className="w-full bg-background/90 border border-primary/50 rounded px-1 text-[10px] text-center text-foreground outline-none"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </foreignObject>
            ) : (
              <text x={node.x} y={node.y + 18} textAnchor="middle" fill="white" fontSize={9} fontWeight={600} className="select-none">
                {node.name.length > 14 ? node.name.slice(0, 13) + "…" : node.name}
              </text>
            )}
            <text x={node.x} y={node.y + 28} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={7} className="select-none">
              {node.type === "repo" ? "Repo" : node.type === "airdrop" ? "Airdrop" : "AI Tool"}
            </text>
            {/* Color picker button */}
            <g className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={(e) => { e.stopPropagation(); setColorPickerNode(showColorPicker ? null : node.id); }}>
              <circle cx={node.x - 22} cy={node.y - 22} r={8} fill="hsl(220 50% 30%)" />
              <foreignObject x={node.x - 28} y={node.y - 28} width={12} height={12}>
                <div className="flex items-center justify-center text-cyan-300"><Palette size={8} /></div>
              </foreignObject>
            </g>
            {/* Delete button */}
            <g className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}>
              <circle cx={node.x + 22} cy={node.y - 22} r={8} fill="hsl(0 70% 50%)" />
              <foreignObject x={node.x + 16} y={node.y - 28} width={12} height={12}>
                <div className="flex items-center justify-center text-white"><X size={8} /></div>
              </foreignObject>
            </g>
            {/* Color picker popup */}
            {showColorPicker && (
              <foreignObject x={node.x - 70} y={node.y - 65} width={140} height={50}>
                <div className="bg-background/95 border border-border rounded-lg p-1.5 flex flex-wrap gap-1 justify-center shadow-xl" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                  {NODE_COLORS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => changeNodeColor(node.id, c.key)}
                      className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-125 ${node.color === c.key ? "border-white scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c.border }}
                      title={c.label}
                    />
                  ))}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default NodeMapLayer;
