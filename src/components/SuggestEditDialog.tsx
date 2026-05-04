import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";

interface FieldDef { key: string; label: string; type?: "text" | "textarea" }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targetType: "airdrop" | "tool";
  targetId: string;
  targetName: string;
  current: Record<string, any>;
  fields: FieldDef[];
}

export default function SuggestEditDialog({ open, onOpenChange, targetType, targetId, targetName, current, fields }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, current[f.key] ?? ""]))
  );
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!user) {
      toast({ title: "Cần đăng nhập", description: "Đăng nhập để gửi đề xuất chỉnh sửa." });
      navigate("/auth");
      return;
    }
    const changes: Record<string, any> = {};
    fields.forEach((f) => {
      const v = values[f.key]?.trim();
      const cur = (current[f.key] ?? "").toString().trim();
      if (v !== cur) changes[f.key] = v || null;
    });
    if (Object.keys(changes).length === 0) {
      toast({ title: "Không có thay đổi", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("edit_suggestions").insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      proposed_changes: changes,
      reason: reason || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Lỗi", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Đã gửi đề xuất ✨", description: "Cộng đồng có thể vote và áp dụng đề xuất của bạn." });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" /> Đề xuất chỉnh sửa: {targetName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-xs text-muted-foreground">
            Chỉ điền các trường bạn muốn cập nhật. Các trường để nguyên sẽ không thay đổi.
          </p>
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs">{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  value={values[f.key] || ""}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  rows={4}
                  className="bg-muted/40 text-sm"
                />
              ) : (
                <Input
                  value={values[f.key] || ""}
                  onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="bg-muted/40 text-sm"
                />
              )}
            </div>
          ))}
          <div className="space-y-1">
            <Label className="text-xs">Lý do / nguồn (khuyến khích)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Ví dụ: dữ liệu mới từ trang chính thức, link nguồn..."
              className="bg-muted/40 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Đang gửi..." : "Gửi đề xuất"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
