-- ============================================================
-- Lekhsetu – Onboarding & localization migration
-- Adds content-preference / onboarding fields to profiles, and
-- captures country/city from signup metadata.
-- ============================================================

alter table public.profiles
  add column if not exists preferred_categories text[] default '{}',
  add column if not exists preferred_language    text,
  add column if not exists onboarding_completed  boolean default false;

-- Capture country/city/preferred_language from signup metadata too
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, country, city, preferred_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username',
             split_part(new.email, '@', 1) || '_' || substring(new.id::text, 1, 4)),
    coalesce(new.raw_user_meta_data->>'display_name',
             split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'preferred_language'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
