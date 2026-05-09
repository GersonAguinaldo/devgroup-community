import { supabase } from "@/integrations/supabase/client";

export type NotificationType =
  | "answer"
  | "comment"
  | "mention"
  | "accepted"
  | "vote"
  | "follow"
  | "badge";

interface CreateNotificationInput {
  user_id: string;
  actor_id: string | null;
  type: NotificationType;
  target_type?: "question" | "answer" | "comment" | "user" | null;
  target_id?: string | null;
  question_id?: string | null;
  payload?: Record<string, any>;
}

/** Insert a notification. Silently ignores errors (best-effort). */
export async function notify(input: CreateNotificationInput) {
  if (input.actor_id && input.actor_id === input.user_id) return; // never self-notify
  await supabase.from("notifications").insert({
    user_id: input.user_id,
    actor_id: input.actor_id ?? undefined,
    type: input.type,
    target_type: input.target_type ?? undefined,
    target_id: input.target_id ?? undefined,
    question_id: input.question_id ?? undefined,
    payload: (input.payload ?? {}) as any,
  });
}

export async function notifyMany(inputs: CreateNotificationInput[]) {
  const filtered = inputs.filter(
    (i) => !(i.actor_id && i.actor_id === i.user_id)
  );
  if (filtered.length === 0) return;
  await supabase.from("notifications").insert(
    filtered.map((i) => ({
      user_id: i.user_id,
      actor_id: i.actor_id ?? undefined,
      type: i.type,
      target_type: i.target_type ?? undefined,
      target_id: i.target_id ?? undefined,
      question_id: i.question_id ?? undefined,
      payload: (i.payload ?? {}) as any,
    }))
  );
}
