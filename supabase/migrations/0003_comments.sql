ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_delete" ON public.comments;

-- Anyone can read comments
CREATE POLICY "comments_select"
ON public.comments
FOR SELECT
USING (true);

-- Users can insert their own comments
CREATE POLICY "comments_insert"
ON public.comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "comments_delete"
ON public.comments
FOR DELETE
USING (auth.uid() = user_id);