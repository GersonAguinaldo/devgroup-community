import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  useCommunity,
  useCommunityMembers,
  useMyMemberships,
  useJoinCommunity,
  useLeaveCommunity,
  useUpdateMemberRole,
  useRemoveMember,
  type CommunityRole,
} from "@/hooks/useCommunities";
import { useQuestions } from "@/hooks/useData";
import QuestionCard from "@/components/QuestionCard";
import ReportButton from "@/components/ReportButton";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Lock,
  Globe,
  Plus,
  Shield,
  ShieldCheck,
  UserMinus,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";

const roleLabel: Record<CommunityRole, string> = {
  member: "Membre",
  moderator: "Modérateur",
  admin: "Administrateur",
};

const CommunityDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: community, isLoading } = useCommunity(slug);
  const { data: members = [] } = useCommunityMembers(community?.id);
  const { data: myMems = [] } = useMyMemberships();
  const { data: allQuestions = [] } = useQuestions();
  const join = useJoinCommunity();
  const leave = useLeaveCommunity();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  const [tab, setTab] = useState<"feed" | "members">("feed");

  const myMembership = useMemo(
    () => myMems.find((m) => m.community_id === community?.id),
    [myMems, community]
  );
  const isMember = !!myMembership;
  const myRole = myMembership?.role;
  const isStaff = myRole === "admin" || myRole === "moderator";

  const posts = useMemo(
    () => allQuestions.filter((q: any) => q.community_id === community?.id),
    [allQuestions, community]
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!community) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Communauté introuvable.</p>
          <Link to="/communities" className="text-primary hover:underline text-sm mt-2 inline-block">
            Retour aux communautés
          </Link>
        </div>
      </Layout>
    );
  }

  const canPromote = (target: CommunityRole) => isStaff && target !== "admin";
  const handlePromote = (uid: string, current: CommunityRole) => {
    const next: CommunityRole = current === "member" ? "moderator" : "admin";
    updateRole.mutate({ community_id: community.id, user_id: uid, role: next });
  };
  const handleDemote = (uid: string, current: CommunityRole) => {
    const next: CommunityRole = current === "admin" ? "moderator" : "member";
    updateRole.mutate({ community_id: community.id, user_id: uid, role: next });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="rounded-lg border border-border bg-card overflow-hidden mb-5">
          {community.banner_url && (
            <div className="h-28 bg-cover bg-center" style={{ backgroundImage: `url(${community.banner_url})` }} />
          )}
          <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-md bg-primary/15 text-lg font-bold text-primary shrink-0">
              {community.avatar || community.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold font-mono text-foreground">{community.name}</h1>
              <p className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                {community.is_private ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {community.is_private ? "Privée" : "Publique"} ·{" "}
                <Users className="h-3 w-3" /> {community.member_count} membre
                {community.member_count > 1 ? "s" : ""}
              </p>
              {community.description && (
                <p className="text-sm text-muted-foreground mt-2">{community.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                isMember ? (
                  <>
                    <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {roleLabel[myRole!]}
                    </span>
                    <button
                      onClick={() => leave.mutate(community.id)}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40"
                    >
                      Quitter
                    </button>
                  </>
                ) : community.is_private ? (
                  <span className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">
                    Sur invitation
                  </span>
                ) : (
                  <button
                    onClick={() => join.mutate(community.id)}
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Rejoindre
                  </button>
                )
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-medium"
                >
                  Connexion
                </button>
              )}
              <ReportButton targetType="user" targetId={community.id} />
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
            <button
              onClick={() => setTab("feed")}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                tab === "feed" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Fil ({posts.length})
            </button>
            <button
              onClick={() => setTab("members")}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                tab === "members" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Membres ({members.length})
            </button>
          </div>

          {isMember && (
            <Link
              to={`/ask?community=${community.id}`}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              Publier ici
            </Link>
          )}
        </div>

        {tab === "feed" ? (
          posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune publication pour le moment.
                {isMember && " Soyez le premier !"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {posts.map((q) => (
                <div key={q.id} className="relative group">
                  <QuestionCard question={q} />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ReportButton targetType="question" targetId={q.id} />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 p-3">
                <Link
                  to={`/user/${m.user_id}`}
                  className="flex items-center gap-2 min-w-0 flex-1 hover:text-primary"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
                    {m.profile?.avatar || "??"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {m.profile?.username || "Utilisateur"}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {m.profile?.reputation ?? 0} pts
                    </p>
                  </div>
                </Link>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                    m.role === "admin"
                      ? "bg-primary/15 text-primary"
                      : m.role === "moderator"
                      ? "bg-accent/15 text-accent"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {m.role === "admin" ? (
                    <ShieldCheck className="h-3 w-3" />
                  ) : m.role === "moderator" ? (
                    <Shield className="h-3 w-3" />
                  ) : null}
                  {roleLabel[m.role]}
                </span>
                {isStaff && m.user_id !== user?.id && (
                  <div className="flex items-center gap-1">
                    {canPromote(m.role) && (
                      <button
                        title="Promouvoir"
                        onClick={() => handlePromote(m.user_id, m.role)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {m.role !== "member" && (
                      <button
                        title="Rétrograder"
                        onClick={() => handleDemote(m.user_id, m.role)}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      title="Retirer"
                      onClick={() => removeMember.mutate({ community_id: community.id, user_id: m.user_id })}
                      className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-secondary"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CommunityDetail;
