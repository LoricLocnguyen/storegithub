"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Zap, Compass, PenTool, FolderOpen, BarChart3, Map as MapIcon, Sparkles, Wand2, GraduationCap,
} from "lucide-react";

interface DockItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  to: string;
  tone: "primary" | "secondary" | "accent";
}

const dockItems: DockItem[] = [
  { id: "airdrop", name: "Kho Airdrop", icon: <Zap className="w-1/2 h-1/2" />, to: "/airdrop", tone: "accent" },
  { id: "explore", name: "Khám phá AI", icon: <Compass className="w-1/2 h-1/2" />, to: "/explore", tone: "primary" },
  { id: "notes", name: "Sổ Vẽ", icon: <PenTool className="w-1/2 h-1/2" />, to: "/notes", tone: "secondary" },
  { id: "collections", name: "Bộ Sưu Tập", icon: <FolderOpen className="w-1/2 h-1/2" />, to: "/collections", tone: "primary" },
  { id: "compare", name: "So Sánh Repo", icon: <BarChart3 className="w-1/2 h-1/2" />, to: "/compare", tone: "accent" },
  { id: "roadmaps", name: "Lộ Trình", icon: <MapIcon className="w-1/2 h-1/2" />, to: "/roadmaps", tone: "secondary" },
  { id: "suggestions", name: "Đề xuất", icon: <Sparkles className="w-1/2 h-1/2" />, to: "/suggestions", tone: "primary" },
  { id: "prompts", name: "Prompt AI", icon: <Wand2 className="w-1/2 h-1/2" />, to: "/prompts", tone: "accent" },
];

const toneClasses: Record<DockItem["tone"], string> = {
  primary: "bg-primary/20 border-primary/40 text-primary",
  secondary: "bg-secondary/20 border-secondary/40 text-secondary",
  accent: "bg-accent/20 border-accent/40 text-accent",
};

function DockIcon({ item, mouseX, active, onClick }: { item: DockItem; mouseX: MotionValue<number>; active: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const sizeSync = useTransform(distance, [-150, 0, 150], [40, 64, 40]);
  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      style={{ width: size, height: size }}
      whileTap={{ scale: 0.9 }}
      title={item.name}
      className={`relative flex items-center justify-center rounded-full border backdrop-blur-md transition-colors group ${toneClasses[item.tone]} ${active ? "ring-2 ring-offset-2 ring-offset-background ring-current shadow-[0_0_20px_currentColor]" : ""}`}
    >
      {item.icon}
      <span className="pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover/95 px-2 py-1 text-xs text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-border/50 z-50">
        {item.name}
      </span>
      {active && <span className="absolute -bottom-2 w-1 h-1 rounded-full bg-current" />}
    </motion.button>
  );
}

export function DockTabs() {
  const mouseX = useMotionValue(Infinity);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="flex h-16 items-center gap-3 rounded-2xl glass border border-border/50 px-4 shadow-xl"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {dockItems.map((item) => (
        <DockIcon
          key={item.id}
          item={item}
          mouseX={mouseX}
          active={location.pathname.startsWith(item.to)}
          onClick={() => navigate(item.to)}
        />
      ))}
    </motion.div>
  );
}
