-- ============================================================
-- Lekhsetu – Username change cooldown
-- Tracks when a user last changed their username so the
-- frontend can enforce a 2-month cooldown between changes.
-- Safe to run multiple times.
-- ============================================================

alter table public.profiles
  add column if not exists username_changed_at timestamptz;
