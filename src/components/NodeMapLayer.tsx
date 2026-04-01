import { useState, useRef, useCallback } from "react";
import { GitFork, Cpu, Coins, X, Link2 } from "lucide-react";

export interface CanvasNode {
  id: string;
  type: "repo" | "airdrop" | "ai_tool";
  entityId: string;
  name: string;
  x: number;
  y: number;
  avatarUrl?: string;
}

export interface NodeConnection {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
}

interface NodeMapLayerProps {
  nodes: CanvasNode[];
  connections: NodeConnection[];
  onNodesChange: (nodes: CanvasNode[]) => void;
  onConnectionsChange: (connections: NodeConnection[]) => void;
  connectMode: boolean;
}

const typeConfig: Record<string, { icon: typeof GitFork; color: string; border: string; bg: string }> = {
  repo: { icon: GitFork, color: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-500/20" },
  airdrop: { icon: Coins, color: "text-amber-400", border: "border-amber-500/50", bg: "bg-amber-500/20" },
  ai_tool: { icon: Cpu, color: "text-cyan-400", border: "border-cyan-500/50", bg: "bg-cyan-500/20" },
};

const NodeMapLayer = ({ nodes, connections, onNodesChange, onConnectionsChange, connectMode }: NodeMapLayerProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectFrom, setConnectFrom] = useState<string | null>(null);

  const getSvgPoint = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();
    if (connectMode) {
      if (connectFrom && connectFrom !== node.id) {
        const exists = connections.some(
          (c) => (c.fromId === connectFrom && c.toId === node.id) || (c.fromId === node.id && c.toId === connectFrom)
        );
        if (!exists) {
          onConnectionsChange([...connections, { id: crypto.randomUUID(), fromId: connectFrom, toId: node.id }]);
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

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Connections */}
      {connections.map((conn) => {
        const from = getNode(conn.fromId);
        const to = getNode(conn.toId);
        if (!from || !to) return null;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        return (
          <g key={conn.id}>
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="hsl(265 90% 65% / 0.4)"
              strokeWidth={2}
              strokeDasharray="6 3"
              className="pointer-events-auto cursor-pointer"
              onClick={() => removeConnection(conn.id)}
            />
            <circle cx={mx} cy={my} r={6} fill="hsl(265 90% 65% / 0.3)" className="pointer-events-auto cursor-pointer" onClick={() => removeConnection(conn.id)} />
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const cfg = typeConfig[node.type] || typeConfig.repo;
        const isConnecting = connectFrom === node.id;
        return (
          <g
            key={node.id}
            className="pointer-events-auto cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
          >
            {/* Glow ring when connecting */}
            {isConnecting && (
              <circle cx={node.x} cy={node.y} r={38} fill="none" stroke="hsl(265 90% 65% / 0.5)" strokeWidth={2} strokeDasharray="4 2">
                <animate attributeName="r" values="38;42;38" dur="1s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Background circle */}
            <circle cx={node.x} cy={node.y} r={32} fill="hsl(230 25% 12%)" stroke={isConnecting ? "hsl(265 90% 65%)" : "hsl(var(--border))"} strokeWidth={1.5} />
            {/* Avatar or icon */}
            {node.avatarUrl ? (
              <>
                <clipPath id={`clip-${node.id}`}>
                  <circle cx={node.x} cy={node.y - 4} r={12} />
                </clipPath>
                <image
                  href={node.avatarUrl}
                  x={node.x - 12}
                  y={node.y - 16}
                  width={24}
                  height={24}
                  clipPath={`url(#clip-${node.id})`}
                />
              </>
            ) : (
              <foreignObject x={node.x - 10} y={node.y - 16} width={20} height={20}>
                <div className={`flex items-center justify-center ${cfg.color}`}>
                  <cfg.icon size={16} />
                </div>
              </foreignObject>
            )}
            {/* Name label */}
            <text
              x={node.x}
              y={node.y + 18}
              textAnchor="middle"
              fill="white"
              fontSize={9}
              fontWeight={600}
              className="select-none"
            >
              {node.name.length > 12 ? node.name.slice(0, 11) + "…" : node.name}
            </text>
            {/* Type badge */}
            <text
              x={node.x}
              y={node.y + 28}
              textAnchor="middle"
              fill="hsl(var(--muted-foreground))"
              fontSize={7}
              className="select-none"
            >
              {node.type === "repo" ? "Repo" : node.type === "airdrop" ? "Airdrop" : "AI Tool"}
            </text>
            {/* Delete button */}
            <g
              className="opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
            >
              <circle cx={node.x + 22} cy={node.y - 22} r={8} fill="hsl(0 70% 50%)" />
              <foreignObject x={node.x + 16} y={node.y - 28} width={12} height={12}>
                <div className="flex items-center justify-center text-white">
                  <X size={8} />
                </div>
              </foreignObject>
            </g>
          </g>
        );
      })}
    </svg>
  );
};

export default NodeMapLayer;
