-- Writer badges: automatic recognition for publishing milestones.
-- No admin approval needed — awarded by the check_and_award_badges() RPC
-- which is called client-side from the dashboard and on story publish.

CREATE TABLE IF NOT EXISTS public.writer_badges (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type   text        NOT NULL CHECK (badge_type IN ('first_story', 'rising_writer', 'storyteller')),
  awarded_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_type)
);

ALTER TABLE public.writer_badges ENABLE ROW LEVEL SECURITY;

-- Public read: badges shown on profile pages to any visitor.
CREATE POLICY "badges_select_public" ON public.writer_badges
  FOR SELECT USING (true);

-- Writes go only through the SECURITY DEFINER RPC below — no direct client inserts.
CREATE POLICY "badges_insert_deny" ON public.writer_badges
  FOR INSERT WITH CHECK (false);

-- -----------------------------------------------------------------------
-- check_and_award_badges(p_user_id)
--   Evaluates the three milestone thresholds for a writer and inserts
--   the matching badge rows. ON CONFLICT DO NOTHING makes it idempotent —
--   safe to call on every dashboard load and after every publish.
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_story_count int;
  v_total_claps int;
BEGIN
  SELECT COUNT(*)
    INTO v_story_count
    FROM public.stories
   WHERE author_id = p_user_id AND published = true;

  SELECT COALESCE(SUM(sc.count), 0)
    INTO v_total_claps
    FROM public.story_claps sc
    JOIN public.stories     s  ON s.id = sc.story_id
   WHERE s.author_id = p_user_id;

  -- "First Story" — 1+ published story
  IF v_story_count >= 1 THEN
    INSERT INTO public.writer_badges (user_id, badge_type)
    VALUES (p_user_id, 'first_story')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;

  -- "Storyteller" — 5+ published stories
  IF v_story_count >= 5 THEN
    INSERT INTO public.writer_badges (user_id, badge_type)
    VALUES (p_user_id, 'storyteller')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;

  -- "Rising Writer" — 100+ total claps
  IF v_total_claps >= 100 THEN
    INSERT INTO public.writer_badges (user_id, badge_type)
    VALUES (p_user_id, 'rising_writer')
    ON CONFLICT (user_id, badge_type) DO NOTHING;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_award_badges(uuid) TO authenticated;
