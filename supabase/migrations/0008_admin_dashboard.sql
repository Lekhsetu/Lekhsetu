-- ============================================================
-- Lekhsetu – Admin dashboard support
-- Adds an admin/ban flag to profiles and grants admins
-- read/manage access across stories, comments, and reports.
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

alter table public.profiles
  add column if not exists is_admin  boolean not null default false,
  add column if not exists is_banned boolean not null default false;

-- Helper used inside RLS policies to check admin status
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable security definer as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

-- Stories: admins can see, update (e.g. unpublish/feature) and delete any story
drop policy if exists "stories_admin_select" on public.stories;
drop policy if exists "stories_admin_update" on public.stories;
drop policy if exists "stories_admin_delete" on public.stories;

create policy "stories_admin_select" on public.stories for select using (public.is_admin(auth.uid()));
create policy "stories_admin_update" on public.stories for update using (public.is_admin(auth.uid()));
create policy "stories_admin_delete" on public.stories for delete using (public.is_admin(auth.uid()));

-- Comments: admins can delete any comment (moderation)
drop policy if exists "comments_admin_delete" on public.comments;
create policy "comments_admin_delete" on public.comments for delete using (public.is_admin(auth.uid()));

-- Reports: admins can see all reports and dismiss (delete) them
drop policy if exists "reports_admin_select" on public.story_reports;
drop policy if exists "reports_admin_delete" on public.story_reports;

create policy "reports_admin_select" on public.story_reports for select using (public.is_admin(auth.uid()));
create policy "reports_admin_delete" on public.story_reports for delete using (public.is_admin(auth.uid()));

-- Profiles: admins can update any profile (ban/unban, promote to admin)
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles for update using (public.is_admin(auth.uid()));

-- ============================================================
-- To make your own account an admin, run (replace with your user id):
--   update public.profiles set is_admin = true where id = '<your-user-uuid>';
-- ============================================================
