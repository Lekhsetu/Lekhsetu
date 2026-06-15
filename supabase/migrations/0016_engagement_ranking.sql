-- ============================================================
-- Lekhsetu – Engagement-based ranking
-- get_feed's trending score still used stories.likes_count,
-- which has been dead since claps replaced the old reaction
-- system (0014/0015) — likes_count is never updated anymore,
-- so ranking ("Story of the Week", trending feed) was driven
-- by views alone. This recomputes the score from real claps
-- (story_claps) and comment counts, the actual "user insight"
-- signals readers leave behind.
-- ============================================================

create or replace function public.get_feed(p_user_id uuid default null, p_category text default null, p_limit int default 30)
returns table(id uuid, score double precision) as $$
  select
    s.id,
    (
      (coalesce(c.clap_total, 0) * 4 + coalesce(cm.comment_count, 0) * 3 + s.views_count + 1)
      / power(extract(epoch from (now() - s.created_at)) / 3600 + 2, 1.4)
    ) * (1 + coalesce(ca.score, 0) * 0.05 + coalesce(la.score, 0) * 0.03) as score
  from public.stories s
  left join (
    select story_id, sum(count) as clap_total
    from public.story_claps
    group by story_id
  ) c on c.story_id = s.id
  left join (
    select story_id, count(*) as comment_count
    from public.comments
    group by story_id
  ) cm on cm.story_id = s.id
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
