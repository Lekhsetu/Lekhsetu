-- ============================================================
-- Lekhsetu – Clap toggle migration
-- Turns the reaction into a true like/unlike toggle: tapping
-- again removes the reaction instead of just locking it at 1.
-- ============================================================

create or replace function public.toggle_clap(p_story_id uuid, p_user_id uuid)
returns int as $$
declare
  new_count int;
begin
  insert into public.story_claps (story_id, user_id, count)
  values (p_story_id, p_user_id, 1)
  on conflict (story_id, user_id)
  do update set count = 1 - public.story_claps.count, updated_at = now()
  returning count into new_count;

  return new_count;
end;
$$ language plpgsql security definer;
