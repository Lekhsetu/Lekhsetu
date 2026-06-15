-- ============================================================
-- Lekhsetu – Account recovery via security questions
-- Stores only SALTED HASHES of security-question answers (never
-- plaintext), and lets users sign in with their username (looked
-- up to the matching email) as well as their email address.
-- ============================================================

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists security_salt    text,
  add column if not exists security_answers jsonb;

-- Capture the salted answer hashes set at signup time.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, country, city, preferred_language, security_salt, security_answers)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username',
             split_part(new.email, '@', 1) || '_' || substring(new.id::text, 1, 4)),
    coalesce(new.raw_user_meta_data->>'display_name',
             split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'country',
    new.raw_user_meta_data->>'city',
    new.raw_user_meta_data->>'preferred_language',
    new.raw_user_meta_data->>'security_salt',
    new.raw_user_meta_data->'security_answers'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Resolve an email-or-username login to the account's email address,
-- so users can sign in with either. Returns nothing if no match (the
-- caller should show a generic "invalid credentials" error either way).
create or replace function public.lookup_account(p_login text)
returns table(id uuid, email text)
language sql
security definer
set search_path = public, auth
as $$
  select u.id, u.email
  from auth.users u
  left join public.profiles p on p.id = u.id
  where lower(u.email) = lower(p_login)
     or lower(p.username) = lower(p_login)
  limit 1;
$$;

grant execute on function public.lookup_account(text) to anon, authenticated;

-- Verifies that at least 2 of the supplied security-question answers
-- match the stored salted hashes for the given account. Used to gate
-- password reset for users who can't access their email.
create or replace function public.verify_recovery_answers(p_login text, p_answers jsonb)
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_salt     text;
  v_answers  jsonb;
  v_key      text;
  v_matches  int := 0;
  v_provided int := 0;
begin
  select p.security_salt, p.security_answers into v_salt, v_answers
  from public.profiles p
  left join auth.users u on u.id = p.id
  where lower(u.email) = lower(p_login)
     or lower(p.username) = lower(p_login)
  limit 1;

  if v_salt is null or v_answers is null then
    return false;
  end if;

  for v_key in select jsonb_object_keys(p_answers)
  loop
    if coalesce(p_answers->>v_key, '') <> '' then
      v_provided := v_provided + 1;
      if v_answers->>v_key = encode(digest(v_salt || ':' || lower(trim(p_answers->>v_key)), 'sha256'), 'hex') then
        v_matches := v_matches + 1;
      end if;
    end if;
  end loop;

  return v_provided >= 2 and v_matches >= 2;
end;
$$;

grant execute on function public.verify_recovery_answers(text, jsonb) to anon, authenticated;
