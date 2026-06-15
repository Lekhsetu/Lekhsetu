-- ============================================================
-- Lekhsetu – Feedback migration
-- Lets any visitor (signed in or not) submit site feedback.
-- Only admins can read submitted feedback.
-- ============================================================

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  name       text,
  email      text,
  category   text not null default 'general',
  message    text not null,
  page       text,
  created_at timestamptz default now()
);

alter table public.feedback enable row level security;

drop policy if exists "feedback_insert" on public.feedback;
drop policy if exists "feedback_admin_select" on public.feedback;
drop policy if exists "feedback_admin_delete" on public.feedback;

-- Anyone (including anonymous visitors) can submit feedback
create policy "feedback_insert" on public.feedback for insert with check (true);

-- Only admins can read or delete feedback
create policy "feedback_admin_select" on public.feedback for select using (public.is_admin(auth.uid()));
create policy "feedback_admin_delete" on public.feedback for delete using (public.is_admin(auth.uid()));
