-- ============================================================
-- Lekhsetu – Claps migration
-- Replaces the 4-emoji story_reactions with a single one-tap
-- "love this story" reaction (one per reader per story).
-- ============================================================

create table if not exists public.story_claps (
  story_id   uuid references public.stories(id) on delete cascade not null,
  user_id    uuid references public.profiles(id) on delete cascade not null,
  count      int not null default 0 check (count >= 0 and count <= 1),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (story_id, user_id)
);

alter table public.story_claps enable row level security;

drop policy if exists "claps_select" on public.story_claps;
drop policy if exists "claps_insert" on public.story_claps;
drop policy if exists "claps_update" on public.story_claps;

-- Anyone can read clap counts; only the user themselves can add/update their claps
create policy "claps_select" on public.story_claps for select using (true);
create policy "claps_insert" on public.story_claps for insert with check (auth.uid() = user_id);
create policy "claps_update" on public.story_claps for update using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- increment_clap(): atomically adds p_amount claps for a user
-- on a story, capped at 1, returns the user's new total.
-- ------------------------------------------------------------
create or replace function public.increment_clap(p_story_id uuid, p_user_id uuid, p_amount int)
returns int as $$
declare
  new_count int;
begin
  insert into public.story_claps (story_id, user_id, count)
  values (p_story_id, p_user_id, least(greatest(p_amount, 0), 1))
  on conflict (story_id, user_id)
  do update set count = least(public.story_claps.count + p_amount, 1), updated_at = now()
  returning count into new_count;

  return new_count;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- Claps feed the recommendation learner too (weight 5), same
-- signal strength the old emoji reactions provided.
-- ------------------------------------------------------------
create or replace function public.handle_story_clap()
returns trigger as $$
begin
  perform public.record_interaction(new.user_id, new.story_id, 5);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_clap_record_interaction on public.story_claps;
create trigger on_clap_record_interaction
  after insert or update on public.story_claps
  for each row execute function public.handle_story_clap();

-- ------------------------------------------------------------
-- Remove the old emoji-reaction system entirely (if present).
-- ------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'story_reactions') then
    drop trigger if exists on_reaction_record_interaction on public.story_reactions;
    drop table public.story_reactions;
  end if;
end $$;

drop function if exists public.handle_story_reaction();
