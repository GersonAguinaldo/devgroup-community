import { useState } from "react";
import { Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Props = {
  targetType: "question" | "answer" | "comment" | "user";
  targetId: string;
  className?: string;
};

const REASONS = [
  "Spam ou publicité",
  "Contenu offensant ou haineux",
  "Hors-sujet",
  "Doublon",
  "Informations erronées",
  "Autre",
];

const ReportButton = ({ targetType, targetId, className }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSubmitting(true);
    const fullReason = detail.trim() ? `${reason} — ${detail.trim()}` : reason;
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: fullReason,
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error("Impossible d'envoyer le signalement.");
      return;
    }
    toast.success("Signalement envoyé. Merci !");
    setOpen(false);
    setDetail("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          "inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        }
        title="Signaler"
      >
        <Flag className="h-3.5 w-3.5" />
        <span>Signaler</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler ce contenu</DialogTitle>
            <DialogDescription>
              Aidez-nous à garder la plateforme saine. Notre équipe examinera le signalement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Motif</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Détails (optionnel)
              </label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                rows={3}
                placeholder="Apportez des précisions…"
                className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {submitting ? "Envoi…" : "Envoyer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportButton;
