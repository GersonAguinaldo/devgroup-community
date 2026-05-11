import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { formatReputation } from "@/components/RightSidebar";
import { ArrowLeft, MapPin, Calendar, MessageSquare, CheckCircle2, Loader2, Edit3, Github, Linkedin, Globe } from "lucide-react";
import { useState, useEffect } from "react";
import { useProfile, useQuestions } from "@/hooks/useData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDate } from "@/lib/timeAgo";
import FollowButton from "@/components/FollowButton";
import { useFollowCounts } from "@/hooks/useFollow";
import OnlineDot from "@/components/OnlineDot";
import UserBadges from "@/components/UserBadges";

const UserProfile = () => {
  const { id } = useParams();
  const { user, refreshProfile } = useAuth();
  const qc = useQueryClient();
  const { data: profile, isLoading } = useProfile(id);
  const { data: counts } = useFollowCounts(id);
  const { data: questions = [] } = useQuestions();
  const [tab, setTab] = useState<"questions" | "answers">("questions");
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [stack, setStack] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [answers, setAnswers] = useState<{ id: string; question_id: string; question_title: string; created_at: string; accepted: boolean; votes: number }[]>([]);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || "");
      setLocation(profile.location || "");
      setStack(((profile as any).stack || []).join(", "));
      setGithub((profile as any).github || "");
      setLinkedin((profile as any).linkedin || "");
      setWebsite((profile as any).website || "");
      setBannerUrl((profile as any).banner_url || "");
    }
  }, [profile]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from("answers_with_meta")
        .select("id, question_id, created_at, accepted, votes, questions:questions!inner(title)")
        .eq("author_id", id)
        .order("created_at", { ascending: false });
      const mapped = (data || []).map((a: any) => ({
        id: a.id,
        question_id: a.question_id,
        question_title: a.questions?.title || "Question",
        created_at: a.created_at,
        accepted: a.accepted,
        votes: a.votes,
      }));
      setAnswers(mapped);
    })();
  }, [id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Utilisateur introuvable.</p>
          <Link to="/users" className="text-primary hover:underline mt-2 inline-block">
            ← Retour aux utilisateurs
          </Link>
        </div>
      </Layout>
    );
  }

  const userQuestions = questions.filter((q) => q.author_id === profile.id);
  const isOwn = user?.id === profile.id;

  const handleSave = async () => {
    const stackArr = stack.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 12);
    const { error } = await supabase
      .from("profiles")
      .update({
        bio,
        location,
        stack: stackArr,
        github: github || null,
        linkedin: linkedin || null,
        website: website || null,
        banner_url: bannerUrl || null,
      })
      .eq("id", profile.id);
    if (error) {
      toast.error("Impossible de sauvegarder.");
      return;
    }
    toast.success("Profil mis à jour.");
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["profile", profile.id] });
    qc.invalidateQueries({ queryKey: ["profiles"] });
    refreshProfile();
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Link
          to="/users"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Utilisateurs
        </Link>

        <div className="rounded-lg border border-border bg-card overflow-hidden animate-fade-in">
          {(profile as any).banner_url ? (
            <div
              className="h-32 sm:h-40 w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${(profile as any).banner_url})` }}
            />
          ) : (
            <div className="h-20 sm:h-24 w-full bg-gradient-to-r from-primary/20 via-accent/10 to-secondary/30" />
          )}

          <div className="p-6 -mt-10 sm:-mt-12">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-2xl font-bold text-secondary-foreground shrink-0 border-4 border-card">
                {profile.avatar}
                <span className="absolute bottom-0 right-1">
                  <OnlineDot lastSeenAt={(profile as any).last_seen_at} />
                </span>
              </span>
              <div className="flex-1 min-w-0 sm:pt-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold font-mono text-foreground">{profile.username}</h1>
                  <OnlineDot lastSeenAt={(profile as any).last_seen_at} showLabel />
                  {isOwn && !editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                      Éditer
                    </button>
                  )}
                  {!isOwn && <FollowButton userId={profile.id} />}
                </div>

                {editing ? (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Votre bio..."
                      maxLength={200}
                      className="w-full rounded-md border border-border bg-muted p-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      rows={2}
                    />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Localisation"
                      maxLength={80}
                      className="w-full rounded-md border border-border bg-muted px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={stack}
                      onChange={(e) => setStack(e.target.value)}
                      placeholder="Stack (séparée par virgule) ex: React, Node, Python"
                      className="w-full rounded-md border border-border bg-muted px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="grid sm:grid-cols-2 gap-2">
                      <input
                        type="url"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="https://github.com/..."
                        className="rounded-md border border-border bg-muted px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/in/..."
                        className="rounded-md border border-border bg-muted px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="Site / portfolio"
                        className="rounded-md border border-border bg-muted px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <input
                        type="url"
                        value={bannerUrl}
                        onChange={(e) => setBannerUrl(e.target.value)}
                        placeholder="URL bannière (image)"
                        className="rounded-md border border-border bg-muted px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                      {profile.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {profile.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Membre depuis {formatDate(profile.created_at)}
                      </span>
                      {(profile as any).github && (
                        <a href={(profile as any).github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Github className="h-3 w-3" /> GitHub
                        </a>
                      )}
                      {(profile as any).linkedin && (
                        <a href={(profile as any).linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Linkedin className="h-3 w-3" /> LinkedIn
                        </a>
                      )}
                      {(profile as any).website && (
                        <a href={(profile as any).website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                          <Globe className="h-3 w-3" /> Site
                        </a>
                      )}
                    </div>
                    {((profile as any).stack || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {((profile as any).stack as string[]).map((s) => (
                          <span key={s} className="rounded-sm bg-tag px-1.5 py-0.5 text-[10px] font-mono text-tag-foreground">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      <UserBadges userId={profile.id} />
                    </div>
                  </>
                )}
              </div>

              <div className="flex sm:flex-col items-center gap-4 sm:gap-2 sm:text-right shrink-0 sm:pt-10">
                <div>
                  <p className="text-2xl font-bold font-mono text-primary">{formatReputation(profile.reputation)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Réputation</p>
                </div>
                <div className="flex sm:flex-col gap-3 sm:gap-1.5">
                  <div className="text-center sm:text-right">
                    <p className="text-sm font-bold font-mono text-foreground">{counts?.followers ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Abonnés</p>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-sm font-bold font-mono text-foreground">{counts?.following ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Suivis</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-1 rounded-lg bg-muted p-1 mb-4 w-fit">
            <button
              onClick={() => setTab("questions")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "questions" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Questions ({userQuestions.length})
            </button>
            <button
              onClick={() => setTab("answers")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "answers" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Réponses ({answers.length})
            </button>
          </div>

          {tab === "questions" && (
            <div className="space-y-2">
              {userQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune question posée.</p>
              ) : (
                userQuestions.map((q) => (
                  <Link
                    key={q.id}
                    to={`/question/${q.id}`}
                    className="block rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors animate-fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-primary min-w-[2rem] text-right">{q.votes}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors">{q.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {q.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-sm bg-tag px-1.5 py-0.5 text-[10px] font-mono text-tag-foreground">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {tab === "answers" && (
            <div className="space-y-2">
              {answers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Aucune réponse publiée.</p>
              ) : (
                answers.map((a) => (
                  <Link
                    key={a.id}
                    to={`/question/${a.question_id}`}
                    className="block rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors animate-fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm font-bold min-w-[2rem] text-right ${a.accepted ? "text-primary" : "text-foreground"}`}>
                        {a.votes}
                      </span>
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        {a.accepted && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                        <p className="text-sm font-medium text-foreground truncate">{a.question_title}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
