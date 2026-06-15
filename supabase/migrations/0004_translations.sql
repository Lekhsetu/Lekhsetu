-- ============================================================
-- Lekhsetu – Story translations migration
-- Pending: link a story to its AI-translated copies in other languages
-- ============================================================

alter table stories
  add column if not exists translation_group_id uuid;

create index if not exists stories_translation_group_id_idx
  on stories (translation_group_id);
