-- ============================================================
-- Lekhsetu – Profile fields migration
-- Adds columns referenced by the app's Profile type / queries
-- that are missing from the original schema.sql
-- ============================================================

alter table public.profiles
  add column if not exists full_name  text default '',
  add column if not exists avatar_url text,
  add column if not exists country    text,
  add column if not exists city       text;
