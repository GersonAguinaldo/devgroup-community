import { useState } from "react";
import { Check, Copy, Link2, Loader2 } from "lucide-react";
import { useCreateCommunityInviteLink } from "@/hooks/useCommunities";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communityId: string;
  communityName: string;
  memberIds?: string[];
};

export default function InviteCommunityDialog({ open, onOpenChange, communityId, communityName }: Props) {
  const createLink = useCreateCommunityInviteLink();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    const token = await createLink.mutateAsync(communityId);
    setLink(`${window.location.origin}/invite/community/${token}`);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inviter dans {communityName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Partagez votre lien personnel. Chaque nouvelle personne qui rejoint grâce à ce lien vous rapporte 10 points.
          </p>
          {link ? (
            <div className="flex gap-2">
              <input readOnly value={link} className="h-10 min-w-0 flex-1 rounded-md border border-border bg-muted px-3 text-xs" />
              <button onClick={copy} className="flex items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copié" : "Copier"}
              </button>
            </div>
          ) : (
            <button onClick={generate} disabled={createLink.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {createLink.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
              Générer mon lien d'invitation
            </button>
          )}
          <p className="text-[11px] text-muted-foreground">
            Le lien fonctionne pour les communautés publiques comme privées. Il reste actif tant que vous êtes membre.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
