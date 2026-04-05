import { useState, useEffect } from "react";
import { Bell, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setNotifications(data);
    };
    load();

    // Realtime
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (!user) return null;

  const typeIcons: Record<string, string> = {
    repo_update: "📦",
    trending: "🔥",
    comment: "💬",
    rating: "⭐",
    info: "ℹ️",
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <span className="text-sm font-semibold">Thông báo</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[10px] text-primary hover:underline flex items-center gap-1">
              <Check className="w-3 h-3" /> Đọc hết
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Không có thông báo</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border/20 ${
                !n.is_read ? "bg-primary/5" : ""
              }`}
              onClick={() => {
                markRead(n.id);
                if (n.link) navigate(n.link);
                setOpen(false);
              }}
            >
              <span className="text-lg mt-0.5">{typeIcons[n.type] || "📌"}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs ${!n.is_read ? "font-semibold text-foreground" : "text-foreground/70"}`}>
                  {n.title}
                </p>
                {n.message && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {new Date(n.created_at).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;
