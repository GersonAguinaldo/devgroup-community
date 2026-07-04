import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTags } from "@/hooks/useData";
import { Sparkles, Check, ArrowRight, X, Users, HelpCircle, Award } from "lucide-react";
import { toast } from "sonner";

/**
 * Assistant d'onboarding en 3 étapes : intérêts, profil rapide, tour.
 * Se déclenche automatiquement quand `profile.onboarding_done === false`.
 */
export default function OnboardingWizard() {
  const { user, profile, refreshProfile } = useAuth();
  const { data: tags = [] } = useTags();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if ((profile as any).onboarding_done === false) {
      setOpen(true);
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setInterests(Array.isArray((profile as any).interests) ? (profile as any).interests : []);
    } else {
      setOpen(false);
    }
  }, [profile]);

  const topTags = useMemo(() => tags.slice(0, 30).map((t) => t.name), [tags]);

  if (!open || !user) return null;

  const toggleInterest = (t: string) => {
    setInterests((cur) =>
      cur.includes(t) ? cur.filter((x) => x !== t) : cur.length < 10 ? [...cur, t] : cur,
    );
  };

  const finish = async (skip = false) => {
    setSaving(true);
    try {
      if (!skip && (bio.trim() || location.trim())) {
        await supabase
          .from("profiles")
          .update({ bio: bio.trim() || null, location: location.trim() || null } as any)
          .eq("id", user.id);
      }
      const { error } = await (supabase as any).rpc("complete_onboarding", {
        _interests: skip ? [] : interests,
      });
      if (error) throw error;
      await refreshProfile();
      toast.success("Bienvenue sur DevGroup Community !");
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Impossible de terminer l'onboarding.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-lg border border-border bg-card shadow-2xl">
        <button
          onClick={() => finish(true)}
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary"
          aria-label="Passer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Étape {step + 1} / 3
            </p>
          </div>

          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold font-mono text-foreground mb-1">
                Choisissez vos centres d'intérêt
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Sélectionnez jusqu'à 10 tags pour personnaliser votre fil.
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-64 overflow-auto p-1">
                {topTags.length === 0 && (
                  <p className="text-xs text-muted-foreground">Aucun tag disponible pour le moment.</p>
                )}
                {topTags.map((t) => {
                  const active = interests.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleInterest(t)}
                      className={`rounded-sm px-2 py-1 text-xs font-mono font-medium transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-tag text-tag-foreground hover:bg-primary/20"
                      }`}
                    >
                      {active && <Check className="inline h-3 w-3 mr-1" />}
                      {t}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">{interests.length}/10 sélectionnés</p>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold font-mono text-foreground mb-1">Présentez-vous</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Un mini profil aide les autres à mieux vous connaître (optionnel).
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">Bio courte</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 200))}
                    placeholder="Développeur backend, curieux d'IA et de communautés."
                    className="mt-1 w-full h-20 rounded-md border border-border bg-muted p-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[10px] text-muted-foreground text-right">{bio.length}/200</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">Où êtes-vous ?</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value.slice(0, 80))}
                    placeholder="Libreville, Gabon"
                    className="mt-1 w-full rounded-md border border-border bg-muted px-2 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold font-mono text-foreground mb-1">
                Vous êtes prêt !
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Voici ce que vous pouvez faire dès maintenant :
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 rounded-md border border-border bg-muted/50 p-3">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Poser une question</p>
                    <p className="text-xs text-muted-foreground">
                      Décrivez votre besoin, ajoutez des tags, obtenez de l'aide.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-md border border-border bg-muted/50 p-3">
                  <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Rejoindre une communauté</p>
                    <p className="text-xs text-muted-foreground">
                      Trouvez un groupe thématique et échangez avec ses membres.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-md border border-border bg-muted/50 p-3">
                  <Award className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Débloquer des badges</p>
                    <p className="text-xs text-muted-foreground">
                      Participez pour gagner en réputation et débloquer des badges.
                    </p>
                  </div>
                </li>
              </ul>
              <div className="mt-4 flex gap-2 text-xs">
                <Link to="/ask" className="text-primary hover:underline" onClick={() => finish(false)}>
                  Poser une question →
                </Link>
                <Link to="/communities" className="text-primary hover:underline" onClick={() => finish(false)}>
                  Voir les communautés →
                </Link>
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => finish(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Passer
            </button>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((step - 1) as 0 | 1 | 2)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Retour
                </button>
              )}
              {step < 2 ? (
                <button
                  type="button"
                  onClick={() => setStep((step + 1) as 0 | 1 | 2)}
                  className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Suivant
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => finish(false)}
                  disabled={saving}
                  className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  Terminer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
