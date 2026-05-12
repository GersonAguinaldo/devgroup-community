import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type PostType = "question" | "news" | "discussion";

export interface QuestionRow {
  id: string;
  title: string;
  body: string;
  views: number;
  bookmarks: number;
  created_at: string;
  author_id: string;
  author_username: string;
  author_avatar: string;
  votes: number;
  answers_count: number;
  tags: string[];
  post_type: PostType;
}

export interface AnswerRow {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  accepted: boolean;
  created_at: string;
  author_username: string;
  author_avatar: string;
  votes: number;
}

export const useQuestions = () =>
  useQuery({
    queryKey: ["questions"],
    queryFn: async (): Promise<QuestionRow[]> => {
      const { data, error } = await supabase
        .from("questions_with_meta")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data || []) as unknown as QuestionRow[]).map((q) => ({ ...q, post_type: q.post_type ?? "question" }));
    },
  });

export const useQuestion = (id: string | undefined) =>
  useQuery({
    queryKey: ["question", id],
    enabled: !!id,
    queryFn: async (): Promise<QuestionRow | null> => {
      const { data, error } = await supabase
        .from("questions_with_meta")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as unknown as QuestionRow;
      return { ...row, post_type: row.post_type ?? "question" };
    },
  });

export const useAnswers = (questionId: string | undefined) =>
  useQuery({
    queryKey: ["answers", questionId],
    enabled: !!questionId,
    queryFn: async (): Promise<AnswerRow[]> => {
      const { data, error } = await supabase
        .from("answers_with_meta")
        .select("*")
        .eq("question_id", questionId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as AnswerRow[];
    },
  });

export const useTags = () =>
  useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("name, description")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

export const useProfiles = () =>
  useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar, bio, location, reputation, created_at, last_seen_at")
        .order("reputation", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

export const useProfile = (id: string | undefined) =>
  useQuery({
    queryKey: ["profile", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

// User vote on a target
export const useUserVote = (targetType: "question" | "answer", targetId: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["vote", targetType, targetId, user?.id],
    enabled: !!user && !!targetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("votes")
        .select("value")
        .eq("user_id", user!.id)
        .eq("target_type", targetType)
        .eq("target_id", targetId!)
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? 0;
    },
  });
};

export const useVoteMutation = (targetType: "question" | "answer", targetId: string) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (newValue: -1 | 0 | 1) => {
      if (!user) throw new Error("not_authenticated");
      if (newValue === 0) {
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("user_id", user.id)
          .eq("target_type", targetType)
          .eq("target_id", targetId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("votes")
          .upsert(
            { user_id: user.id, target_type: targetType, target_id: targetId, value: newValue },
            { onConflict: "user_id,target_type,target_id" }
          );
        if (error) throw error;
      }
      return newValue;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vote", targetType, targetId] });
      qc.invalidateQueries({ queryKey: ["questions"] });
      qc.invalidateQueries({ queryKey: ["question"] });
      qc.invalidateQueries({ queryKey: ["answers"] });
    },
    onError: (err: any) => {
      if (err?.message === "not_authenticated") {
        toast.error("Connectez-vous pour voter.");
      } else {
        toast.error("Impossible d'enregistrer le vote.");
      }
    },
  });
};
