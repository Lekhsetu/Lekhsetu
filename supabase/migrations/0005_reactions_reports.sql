-- ============================================================
-- Lekhsetu – Reactions & reports migration
-- Schema + RLS for story reactions and abuse reports
-- ============================================================

create table if not exists public.story_reactions (
  story_id   uuid references public.stories(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  type       text not null check (type in ('moved','inspired','laughed','cried')),
  created_at timestamptz default now(),
  primary key (story_id, user_id)
);

create table if not exists public.story_reports (
  id          uuid primary key default gen_random_uuid(),
  story_id    uuid references public.stories(id) on delete cascade not null,
  reporter_id uuid references public.profiles(id) on delete cascade not null,
  reason      text not null,
  created_at  timestamptz default now()
);

alter table public.story_reactions enable row level security;
alter table public.story_reports   enable row level security;

drop policy if exists "reactions_select" on public.story_reactions;
drop policy if exists "reactions_insert" on public.story_reactions;
drop policy if exists "reactions_delete" on public.story_reactions;

-- Anyone can read reaction counts; only the user themselves can add/remove their reaction
create policy "reactions_select" on public.story_reactions for select using (true);
create policy "reactions_insert" on public.story_reactions for insert with check (auth.uid() = user_id);
create policy "reactions_delete" on public.story_reactions for delete using (auth.uid() = user_id);

drop policy if exists "reports_insert" on public.story_reports;
drop policy if exists "reports_select_own" on public.story_reports;

-- Users can file reports and see only their own reports (no public read)
create policy "reports_insert" on public.story_reports for insert with check (auth.uid() = reporter_id);
create policy "reports_select_own" on public.story_reports for select using (auth.uid() = reporter_id);
