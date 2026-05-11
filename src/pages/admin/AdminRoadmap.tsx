import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronRight, Map } from "lucide-react";

type Status = "done" | "in_progress" | "todo" | "future";

interface Feature {
  name: string;
  status: Status;
  details?: string;
}

interface Section {
  id: string;
  order: number | string;
  title: string;
  subtitle: string;
  features: Feature[];
}

const ROADMAP: Section[] = [
  {
    id: "core",
    order: "0",
    title: "Socle existant",
    subtitle: "Fonctionnalités de base déjà en place",
    features: [
      { name: "Authentification email/mot de passe", status: "done", details: "Inscription, connexion, déconnexion. Création automatique d'un profil." },
      { name: "Publication de questions", status: "done", details: "Éditeur Markdown, jusqu'à 5 tags, prévisualisation." },
      { name: "Publication de news", status: "done", details: "Type de post séparé, sans obligation de tags. Filtrage dédié sur la home." },
      { name: "Réponses aux questions", status: "done", details: "Markdown, coloration syntaxique, acceptation par l'auteur de la question." },
      { name: "Système de votes", status: "done", details: "Upvote / downvote sur questions et réponses, un vote par utilisateur." },
      { name: "Tags", status: "done", details: "Création libre, filtrage par URL, page dédiée /tags." },
      { name: "Profils utilisateurs", status: "done", details: "Bio, location, avatar, réputation, historique d'activité." },
      { name: "Annuaire des utilisateurs", status: "done", details: "Page /users avec tri par réputation." },
      { name: "Recherche globale", status: "done", details: "Barre de recherche dans le header, paramètre URL ?search=." },
      { name: "Espace admin & super-admin", status: "done", details: "Rôles RBAC, dashboard stats, modération contenu, gestion utilisateurs/tags/admins, signalements." },
      { name: "Sidebar Hot Questions", status: "done", details: "Top vues, top contributeurs, stats globales sur les pages principales." },
    ],
  },
  {
    id: "social",
    order: "1",
    title: "Interactions sociales directes",
    subtitle: "Faire échanger les utilisateurs au-delà du Q&A",
    features: [
      { name: "Commentaires sous questions et réponses", status: "done", details: "Format court (≤ 600 caractères) avec mentions @, suppression par auteur ou admin." },
      { name: "Mentions @username", status: "done", details: "Auto-complétion dans commentaires et réponses, lien vers profil, déclenche une notification." },
      { name: "Système de notifications (cloche)", status: "done", details: "Cloche dans le header avec compteur non-lus, dropdown détaillé, marquage lu individuel ou global, mises à jour temps réel." },
      { name: "Suivre un utilisateur", status: "done", details: "Bouton Suivre sur le profil avec compteurs Abonnés/Suivis, onglet 'Suivis' sur la home pour filtrer le flux." },
    ],
  },
  {
    id: "identity",
    order: "2",
    title: "Identité et reconnaissance",
    subtitle: "Que chacun se sente vu — y compris dans la réputation",
    features: [
      { name: "Badges automatiques", status: "done", details: "8 badges (premier post, première/10 réponses acceptées, 10/100 votes reçus, contributeur actif, vétéran). Calcul auto via triggers, page /badges, affichage sur le profil." },
      { name: "Profil enrichi (stack, liens, bannière)", status: "done", details: "Champs stack (technos), GitHub, LinkedIn, site, bannière personnalisable. Édition depuis le profil." },
      { name: "Statut en ligne / Vu il y a X", status: "done", details: "Heartbeat client toutes les 60s, point vert si actif < 5 min, sinon 'Vu il y a X'. Visible sur profil et top contributeurs." },
      { name: "Highlight des nouveaux membres", status: "done", details: "Bandeau 'Bienvenue à @nouveau' sur la home pour les inscriptions des dernières 48h." },
      { name: "Réputation revisitée", status: "done", details: "Pondération : +15 réponse acceptée, +10 par vote sur réponse, +5 par vote sur question, +2 par réponse postée, +1 par question. Recalcul auto à chaque vote/acceptation." },
    ],
  },
  {
    id: "community",
    order: "3",
    title: "Vie de communauté",
    subtitle: "Transformer la plateforme en lieu où l'on revient",
    features: [
      { name: "Discussions / Forum", status: "todo", details: "3e type de post (à côté de Question et News) pour débats, show & tell, retours d'expérience." },
      { name: "Sondages", status: "todo", details: "Intégrés aux news ou discussions. 2-6 options, vote unique, résultats live." },
      { name: "Page Communauté", status: "todo", details: "Règles, valeurs, équipe, code de conduite. Donne une âme à la plateforme." },
      { name: "Événements (meetups, lives, hackathons)", status: "future", details: "Perspective d'évolution. Inscription, rappels, calendrier." },
      { name: "Digest hebdomadaire par email", status: "future", details: "Perspective d'évolution. Top questions, top contributeurs, news. Nécessite domaine email vérifié." },
    ],
  },
  {
    id: "comfort",
    order: "4",
    title: "Confort d'usage et inclusion",
    subtitle: "Pour que les nouveaux n'aient pas peur de poster",
    features: [
      { name: "Onboarding guidé", status: "todo", details: "Après inscription : choisir tags d'intérêt, compléter profil, mini-tour de la plateforme." },
      { name: "Brouillons automatiques", status: "todo", details: "Sauvegarde locale en cours de rédaction, restauration au retour." },
      { name: "Mode 'question gentille' (assistant IA)", status: "todo", details: "Avant publication, l'IA suggère : titre plus clair, contexte manquant, code à formater. Utilise Lovable AI." },
      { name: "Tags suggérés automatiquement", status: "todo", details: "Analyse du contenu via IA pour proposer 3-5 tags pertinents." },
      { name: "Aperçu Markdown côte-à-côte", status: "todo", details: "Split-view éditeur / rendu pendant la rédaction." },
      { name: "Recherche améliorée + filtres", status: "todo", details: "Filtres : résolu/non-résolu, tag, auteur, période. Tri par pertinence." },
    ],
  },
  {
    id: "gamification",
    order: "5",
    title: "Gamification douce",
    subtitle: "Sans tomber dans le superficiel",
    features: [
      { name: "Niveaux de progression", status: "todo", details: "Apprenti → Confirmé → Expert → Mentor. Basé sur l'activité cumulée, visible sur le profil." },
      { name: "Classement hebdo / mensuel", status: "todo", details: "Top contributeurs sur 7 et 30 jours. Page dédiée + widget." },
      { name: "Streaks d'activité", status: "todo", details: "X jours d'affilée actif, affiché sur le profil avec icône flamme." },
      { name: "Récompenses d'aide", status: "todo", details: "Bonus de réputation : +15 réponse acceptée, +10 vote significatif, +5 réponse 'utile'." },
    ],
  },
  {
    id: "africa",
    order: "6",
    title: "Spécifique DevGroup Africa",
    subtitle: "Ce qui rend la plateforme unique et ancrée",
    features: [
      { name: "Section Opportunités", status: "todo", details: "Offres d'emploi, missions freelance, stages. Publiables par les membres, modérées." },
      { name: "Annuaire géo (carte interactive)", status: "todo", details: "Devs par ville / pays africain. Carte Leaflet + filtres." },
      { name: "Mentorat 1-1", status: "todo", details: "Les seniors marquent leur disponibilité, les juniors demandent un échange." },
      { name: "Showcase de projets", status: "todo", details: "Vitrine de projets membres : capture, description, lien, commentaires, upvotes." },
      { name: "Multilingue FR/EN", status: "todo", details: "i18n complet, switch dans le header, contenu utilisateur reste tel quel." },
    ],
  },
];

const STATUS_META: Record<Status, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  done: { label: "Fait", className: "text-primary border-primary/30 bg-primary/10", icon: CheckCircle2 },
  in_progress: { label: "En cours", className: "text-accent border-accent/30 bg-accent/10", icon: Clock },
  todo: { label: "À faire", className: "text-muted-foreground border-border bg-secondary/40", icon: Circle },
  future: { label: "Futur", className: "text-foreground/60 border-dashed border-border bg-transparent", icon: Circle },
};

const AdminRoadmap = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ROADMAP.map((s) => [s.id, true]))
  );
  const [openFeatures, setOpenFeatures] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) =>
    setOpenSections((s) => ({ ...s, [id]: !s[id] }));
  const toggleFeature = (key: string) =>
    setOpenFeatures((s) => ({ ...s, [key]: !s[key] }));

  const allFeatures = ROADMAP.flatMap((s) => s.features);
  const counts = {
    done: allFeatures.filter((f) => f.status === "done").length,
    in_progress: allFeatures.filter((f) => f.status === "in_progress").length,
    todo: allFeatures.filter((f) => f.status === "todo").length,
    future: allFeatures.filter((f) => f.status === "future").length,
    total: allFeatures.length,
  };
  const progress = Math.round((counts.done / counts.total) * 100);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold font-mono text-foreground">Roadmap</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Toutes les fonctionnalités de la plateforme — réalisées, en cours, ou planifiées.
          </p>
        </header>

        {/* Stats globales */}
        <div className="rounded-md border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono text-muted-foreground uppercase tracking-wider text-xs">
              Avancement global
            </span>
            <span className="font-mono font-bold text-foreground">
              {counts.done}/{counts.total} ({progress}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {(["done", "in_progress", "todo", "future"] as Status[]).map((s) => {
              const meta = STATUS_META[s];
              const Icon = meta.icon;
              return (
                <span
                  key={s}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${meta.className}`}
                >
                  <Icon className="h-3 w-3" />
                  {meta.label} · {counts[s]}
                </span>
              );
            })}
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          {ROADMAP.map((section) => {
            const isOpen = openSections[section.id];
            const sectionDone = section.features.filter((f) => f.status === "done").length;
            return (
              <div key={section.id} className="rounded-md border border-border bg-card overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className="font-mono text-xs text-primary shrink-0">
                      [{section.order}]
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-foreground truncate">
                        {section.title}
                      </h2>
                      <p className="text-xs text-muted-foreground truncate">
                        {section.subtitle}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    {sectionDone}/{section.features.length}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-border divide-y divide-border">
                    {section.features.map((feature, idx) => {
                      const key = `${section.id}-${idx}`;
                      const meta = STATUS_META[feature.status];
                      const Icon = meta.icon;
                      const expanded = openFeatures[key];
                      return (
                        <div key={key}>
                          <button
                            onClick={() => feature.details && toggleFeature(key)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-secondary/30 transition-colors"
                          >
                            <Icon
                              className={`h-4 w-4 shrink-0 ${
                                feature.status === "done"
                                  ? "text-primary"
                                  : feature.status === "in_progress"
                                  ? "text-accent"
                                  : "text-muted-foreground"
                              }`}
                            />
                            <span className="flex-1 text-sm text-foreground truncate">
                              {feature.name}
                            </span>
                            <span
                              className={`hidden sm:inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider shrink-0 ${meta.className}`}
                            >
                              {meta.label}
                            </span>
                            {feature.details && (
                              <ChevronRight
                                className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${
                                  expanded ? "rotate-90" : ""
                                }`}
                              />
                            )}
                          </button>
                          {expanded && feature.details && (
                            <div className="px-4 pb-3 pl-11 text-xs text-muted-foreground leading-relaxed animate-fade-in">
                              {feature.details}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRoadmap;
