
-- 1) Profile: onboarding + interests
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_done boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}';

-- 2) Full-text search on questions (title + body)
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(body, '')),  'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_questions_search_tsv ON public.questions USING gin (search_tsv);

-- 3) Advanced search RPC
CREATE OR REPLACE FUNCTION public.search_questions(
  _q text DEFAULT NULL,
  _type text DEFAULT NULL,
  _resolved boolean DEFAULT NULL,
  _tag text DEFAULT NULL,
  _author uuid DEFAULT NULL,
  _since timestamptz DEFAULT NULL,
  _sort text DEFAULT 'relevance',
  _limit int DEFAULT 30,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  body text,
  post_type text,
  author_id uuid,
  author_username text,
  author_avatar text,
  created_at timestamptz,
  updated_at timestamptz,
  views int,
  community_id uuid,
  votes int,
  answers_count int,
  has_accepted boolean,
  tags text[],
  rank real
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH q AS (
    SELECT
      qm.id, qm.title, qm.body, qm.post_type, qm.author_id, qm.author_username, qm.author_avatar,
      qm.created_at, qm.updated_at, qm.views, qm.community_id, qm.votes, qm.answers_count,
      EXISTS (SELECT 1 FROM public.answers a WHERE a.question_id = qm.id AND a.accepted) AS has_accepted,
      qm.tags,
      CASE
        WHEN _q IS NOT NULL AND length(trim(_q)) > 0
          THEN ts_rank(qs.search_tsv, plainto_tsquery('simple', _q))
        ELSE 0
      END AS rank
    FROM public.questions_with_meta qm
    JOIN public.questions qs ON qs.id = qm.id
    WHERE
      (_q IS NULL OR length(trim(_q)) = 0
        OR qs.search_tsv @@ plainto_tsquery('simple', _q)
        OR qm.title ILIKE '%' || _q || '%')
      AND (_type IS NULL OR qm.post_type = _type)
      AND (_author IS NULL OR qm.author_id = _author)
      AND (_since  IS NULL OR qm.created_at >= _since)
      AND (
        _tag IS NULL OR EXISTS (
          SELECT 1 FROM public.question_tags qt
          WHERE qt.question_id = qm.id AND qt.tag_name = _tag
        )
      )
  )
  SELECT * FROM q
  WHERE (_resolved IS NULL
      OR (_resolved = true  AND has_accepted = true)
      OR (_resolved = false AND has_accepted = false))
  ORDER BY
    CASE WHEN _sort = 'relevance' THEN rank END DESC NULLS LAST,
    CASE WHEN _sort = 'votes'     THEN votes END DESC NULLS LAST,
    CASE WHEN _sort = 'recent' OR _sort IS NULL OR _sort NOT IN ('relevance','votes')
         THEN created_at END DESC NULLS LAST
  LIMIT COALESCE(_limit, 30)
  OFFSET COALESCE(_offset, 0);
$$;

REVOKE ALL ON FUNCTION public.search_questions(text,text,boolean,text,uuid,timestamptz,text,int,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_questions(text,text,boolean,text,uuid,timestamptz,text,int,int) TO anon, authenticated;

-- 4) Mark onboarding as done
CREATE OR REPLACE FUNCTION public.complete_onboarding(_interests text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.profiles
     SET onboarding_done = true,
         interests = COALESCE(_interests, ARRAY[]::text[])
   WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.complete_onboarding(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_onboarding(text[]) TO authenticated;
