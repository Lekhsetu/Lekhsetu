-- ============================================================
-- Group-aware view counting
-- When a story belongs to a translation group, all views are
-- routed to the primary (oldest) copy so the group never
-- accumulates more than one view per reader per visit.
-- ============================================================

drop function if exists public.increment_view(uuid, uuid);

create or replace function public.increment_view(
  p_story_id uuid,
  p_user_id  uuid default null,
  p_group_id uuid default null
)
returns void as $$
declare
  v_target_id uuid;
begin
  -- If a translation group is provided, find the primary story (oldest created_at)
  -- and count the view there. This means all translations share one view counter.
  if p_group_id is not null then
    select id into v_target_id
    from public.stories
    where translation_group_id = p_group_id
    order by created_at asc
    limit 1;
  end if;

  update public.stories
  set views_count = views_count + 1
  where id = coalesce(v_target_id, p_story_id);

  -- Still record the interaction on the actual story read for recommendation accuracy.
  perform public.record_interaction(p_user_id, p_story_id, 1);
end;
$$ language plpgsql security definer;
