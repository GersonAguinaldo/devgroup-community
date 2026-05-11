
-- 1. Enrich profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stack text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS github text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

-- 2. Badge catalog
CREATE TABLE IF NOT EXISTS public.badges (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'award',
  tier text NOT NULL DEFAULT 'bronze',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Badges viewable by everyone" ON public.badges;
CREATE POLICY "Badges viewable by everyone" ON public.badges FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage badges" ON public.badges;
CREATE POLICY "Admins manage badges" ON public.badges FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- 3. User badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id uuid NOT NULL,
  badge_code text NOT NULL REFERENCES public.badges(code) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_code)
);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User badges viewable by everyone" ON public.user_badges;
CREATE POLICY "User badges viewable by everyone" ON public.user_badges FOR SELECT USING (true);
-- No insert/update/delete from clients; only SECURITY DEFINER functions

-- 4. Seed badges
INSERT INTO public.badges (code, name, description, icon, tier) VALUES
  ('first_question', 'Première question', 'Vous avez posé votre première question.', 'message-circle-question', 'bronze'),
  ('first_answer', 'Première réponse', 'Vous avez publié votre première réponse.', 'message-square', 'bronze'),
  ('accepted_x10', '10 réponses acceptées', 'Au moins 10 de vos réponses ont été acceptées.', 'check-check', 'gold'),
  ('accepted_x1', 'Première acceptation', 'Une de vos réponses a été acceptée.', 'check-circle-2', 'silver'),
  ('votes_100', '100 votes reçus', 'Vous avez cumulé 100 votes positifs.', 'thumbs-up', 'gold'),
  ('votes_10', '10 votes reçus', 'Vous avez cumulé 10 votes positifs.', 'thumbs-up', 'silver'),
  ('veteran', 'Ancien combattant', 'Membre depuis plus d''un an.', 'shield', 'gold'),
  ('contributor', 'Contributeur actif', 'Au moins 5 questions et 10 réponses publiées.', 'flame', 'silver')
ON CONFLICT (code) DO NOTHING;

-- 5. Reputation recompute
CREATE OR REPLACE FUNCTION public.recompute_reputation(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rep int := 0;
  v_q_votes int;
  v_a_votes int;
  v_accepted int;
  v_q_count int;
  v_a_count int;
BEGIN
  SELECT COALESCE(SUM(v.value),0) INTO v_q_votes
    FROM votes v JOIN questions q ON q.id = v.target_id
    WHERE v.target_type = 'question' AND q.author_id = _user_id;
  SELECT COALESCE(SUM(v.value),0) INTO v_a_votes
    FROM votes v JOIN answers a ON a.id = v.target_id
    WHERE v.target_type = 'answer' AND a.author_id = _user_id;
  SELECT COUNT(*) INTO v_accepted FROM answers WHERE author_id = _user_id AND accepted = true;
  SELECT COUNT(*) INTO v_q_count FROM questions WHERE author_id = _user_id;
  SELECT COUNT(*) INTO v_a_count FROM answers WHERE author_id = _user_id;

  rep := GREATEST(0,
    v_q_votes * 5 +
    v_a_votes * 10 +
    v_accepted * 15 +
    v_q_count * 1 +
    v_a_count * 2
  );
  UPDATE profiles SET reputation = rep WHERE id = _user_id;
END $$;

-- 6. Award badges
CREATE OR REPLACE FUNCTION public.award_badges(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q_count int; a_count int; accepted_count int; up_votes int;
  member_since timestamptz;
BEGIN
  SELECT COUNT(*) INTO q_count FROM questions WHERE author_id = _user_id;
  SELECT COUNT(*) INTO a_count FROM answers WHERE author_id = _user_id;
  SELECT COUNT(*) INTO accepted_count FROM answers WHERE author_id = _user_id AND accepted = true;
  SELECT COALESCE(SUM(v.value),0) INTO up_votes FROM votes v
    LEFT JOIN questions q ON q.id = v.target_id AND v.target_type='question'
    LEFT JOIN answers  a ON a.id = v.target_id AND v.target_type='answer'
    WHERE (q.author_id = _user_id OR a.author_id = _user_id) AND v.value > 0;
  SELECT created_at INTO member_since FROM profiles WHERE id = _user_id;

  IF q_count >= 1 THEN
    INSERT INTO user_badges(user_id, badge_code) VALUES (_user_id, 'first_question') ON CONFLICT DO NOTHING;
  END IF;
  IF a_count >= 1 THEN
    INSERT INTO user_badges(user_id, badge_code) VALUES (_user_id, 'first_answer') ON CONFLICT DO NOTHING;
  END IF;
  IF accepted_count >= 1 THEN
    INSERT INTO user_badges(user_id, badge_code) VALUES (_user_id, 'accepted_x1') ON CONFLICT DO NOTHING;
  END IF;
  IF accepted_count >= 10 THEN
    INSERT INTO user_badges(user_id, badge_code) VALUES (_user_id, 'accepted_x10') ON CONFLICT DO NOTHING;
  END IF;
  IF up_votes >= 10 THEN
    INSERT INTO user_badges(user_id, badge_code) VALUES (_user_id, 'votes_10') ON CONFLICT DO NOTHING;
  END IF;
  IF up_votes >= 100 THEN
    INSERT INTO user_badges(user_id, badge_code) VALUES (_user_id, 'votes_100') ON CONFLICT DO NOTHING;
  END IF;
  IF q_count >= 5 AND a_count >= 10 THEN
    INSERT INTO user_badges(user_id, badge_code) VALUES (_user_id, 'contributor') ON CONFLICT DO NOTHING;
  END IF;
  IF member_since IS NOT NULL AND member_since < now() - interval '365 days' THEN
    INSERT INTO user_badges(user_id, badge_code) VALUES (_user_id, 'veteran') ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 7. Trigger helpers
CREATE OR REPLACE FUNCTION public.trg_refresh_after_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE target_author uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'question' THEN SELECT author_id INTO target_author FROM questions WHERE id = OLD.target_id;
    ELSE SELECT author_id INTO target_author FROM answers WHERE id = OLD.target_id;
    END IF;
  ELSE
    IF NEW.target_type = 'question' THEN SELECT author_id INTO target_author FROM questions WHERE id = NEW.target_id;
    ELSE SELECT author_id INTO target_author FROM answers WHERE id = NEW.target_id;
    END IF;
  END IF;
  IF target_author IS NOT NULL THEN
    PERFORM recompute_reputation(target_author);
    PERFORM award_badges(target_author);
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS votes_refresh ON public.votes;
CREATE TRIGGER votes_refresh AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_after_vote();

CREATE OR REPLACE FUNCTION public.trg_refresh_after_answer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM recompute_reputation(COALESCE(NEW.author_id, OLD.author_id));
  PERFORM award_badges(COALESCE(NEW.author_id, OLD.author_id));
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS answers_refresh ON public.answers;
CREATE TRIGGER answers_refresh AFTER INSERT OR UPDATE OR DELETE ON public.answers
  FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_after_answer();

CREATE OR REPLACE FUNCTION public.trg_refresh_after_question()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  PERFORM recompute_reputation(COALESCE(NEW.author_id, OLD.author_id));
  PERFORM award_badges(COALESCE(NEW.author_id, OLD.author_id));
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS questions_refresh ON public.questions;
CREATE TRIGGER questions_refresh AFTER INSERT OR DELETE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.trg_refresh_after_question();

-- 8. Heartbeat RPC
CREATE OR REPLACE FUNCTION public.heartbeat()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    UPDATE profiles SET last_seen_at = now() WHERE id = auth.uid();
  END IF;
END $$;

-- 9. Initial backfill
DO $$ DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM profiles LOOP
    PERFORM recompute_reputation(r.id);
    PERFORM award_badges(r.id);
  END LOOP;
END $$;
