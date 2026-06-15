-- ============================================================
-- Lekhsetu – self-learning recommendation engine
-- Compatible with the current schema:
--   stories.views_count, stories.likes_count
--   story_reactions (story_id, user_id, type, created_at)
--   existing function increment_view(p_story_id uuid)
-- Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Per-user topic affinity ("learned" weights)
-- ------------------------------------------------------------
create table if not exists public.user_topic_affinity (
  user_id     uuid references public.profiles(id) on delete cascade,
  topic_type  text not null check (topic_type in ('category', 'language', 'tag')),
  topic_value text not null,
  score       real not null default 0,
  updated_at  timestamptz default now(),
  primary key (user_id, topic_type, topic_value)
);

alter table public.user_topic_affinity enable row level security;

drop policy if exists "affinity_select_own" on public.user_topic_affinity;
drop policy if exists "affinity_all_own"    on public.user_topic_affinity;

create policy "affinity_select_own" on public.user_topic_affinity for select using (auth.uid() = user_id);
create policy "affinity_all_own"    on public.user_topic_affinity for all    using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. record_interaction(): nudges a user's topic affinities
--    p_weight is the learning-signal strength
--    (views = 1, reactions = 5)
-- ------------------------------------------------------------
create or replace function public.record_interaction(p_user_id uuid, p_story_id uuid, p_weight real)
returns void as $$
declare
  s record;
  t text;
begin
  if p_user_id is null then return; end if;

  select category, language, tags into s from public.stories where id = p_story_id;
  if s is null then return; end if;

  -- decay existing scores so recent interest gradually dominates older interest
  update public.user_topic_affinity
    set score = score * 0.995
    where user_id = p_user_id;

  insert into public.user_topic_affinity (user_id, topic_type, topic_value, score, updated_at)
  values (p_user_id, 'category', s.category, p_weight, now())
  on conflict (user_id, topic_type, topic_value)
  do update set score = public.user_topic_affinity.score + p_weight, updated_at = now();

  insert into public.user_topic_affinity (user_id, topic_type, topic_value, score, updated_at)
  values (p_user_id, 'language', s.language, p_weight, now())
  on conflict (user_id, topic_type, topic_value)
  do update set score = public.user_topic_affinity.score + p_weight, updated_at = now();

  foreach t in array coalesce(s.tags, '{}') loop
    insert into public.user_topic_affinity (user_id, topic_type, topic_value, score, updated_at)
    values (p_user_id, 'tag', t, p_weight * 0.5, now())
    on conflict (user_id, topic_type, topic_value)
    do update set score = public.user_topic_affinity.score + p_weight * 0.5, updated_at = now();
  end loop;
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- 3. increment_view(): keep the existing call signature working
--    (p_story_id uuid) while adding an optional p_user_id so
--    views can feed the learner (weight 1).
-- ------------------------------------------------------------
drop function if exists public.increment_view(uuid);

create or replace function public.increment_view(p_story_id uuid, p_user_id uuid default null)
returns void as $$
begin
  update public.stories set views_count = views_count + 1 where id = p_story_id;
  perform public.record_interaction(p_user_id, p_story_id, 1);
end;
$$ language plpgsql security definer;

-- ------------------------------------------------------------
-- 4. Reactions feed the learner too (weight 5, stronger signal)
-- ------------------------------------------------------------
create or replace function public.handle_story_reaction()
returns trigger as $$
begin
  perform public.record_interaction(new.user_id, new.story_id, 5);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_reaction_record_interaction on public.story_reactions;

create trigger on_reaction_record_interaction
  after insert on public.story_reactions
  for each row execute procedure public.handle_story_reaction();

-- ------------------------------------------------------------
-- 5. get_feed(): ranked story ids
--    trending_score = (likes*3 + views + 1) / age_hours^1.4
--    boosted by the user's learned category/language affinity
--    (p_user_id = null -> pure trending, e.g. anonymous visitors)
-- ------------------------------------------------------------
create or replace function public.get_feed(p_user_id uuid default null, p_category text default null, p_limit int default 30)
returns table(id uuid, score double precision) as $$
  select
    s.id,
    (
      (s.likes_count * 3 + s.views_count + 1)
      / power(extract(epoch from (now() - s.created_at)) / 3600 + 2, 1.4)
    ) * (1 + coalesce(ca.score, 0) * 0.05 + coalesce(la.score, 0) * 0.03) as score
  from public.stories s
  left join (
    select topic_value, score from public.user_topic_affinity
    where user_id = p_user_id and topic_type = 'category'
  ) ca on ca.topic_value = s.category
  left join (
    select topic_value, score from public.user_topic_affinity
    where user_id = p_user_id and topic_type = 'language'
  ) la on la.topic_value = s.language
  where s.published = true
    and (p_category is null or s.category = p_category)
  order by score desc, s.created_at desc
  limit p_limit;
$$ language sql security definer stable;

-- ============================================================
-- Verification queries — run after the migration above
-- ============================================================

-- 1. user_topic_affinity table exists
select table_name from information_schema.tables
where table_schema = 'public' and table_name = 'user_topic_affinity';

-- 2. functions exist
select routine_name from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('record_interaction', 'increment_view', 'handle_story_reaction', 'get_feed');

-- 3. trigger exists
select trigger_name from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table = 'story_reactions'
  and trigger_name = 'on_reaction_record_interaction';

-- 4. get_feed returns rows (pure trending, anonymous)
select * from public.get_feed(null, null, 10);
