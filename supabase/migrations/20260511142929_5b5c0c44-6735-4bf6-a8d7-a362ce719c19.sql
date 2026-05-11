
REVOKE EXECUTE ON FUNCTION public.recompute_reputation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.award_badges(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_refresh_after_vote() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_refresh_after_answer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_refresh_after_question() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.heartbeat() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.heartbeat() TO authenticated;
