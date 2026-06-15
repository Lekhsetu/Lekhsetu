-- ============================================================
-- Lekhsetu – Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text not null,
  bio           text default '',
  created_at    timestamptz default now()
);

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username',
             split_part(new.email, '@', 1) || '_' || substring(new.id::text, 1, 4)),
    coalesce(new.raw_user_meta_data->>'display_name',
             split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Stories
create table if not exists public.stories (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid references public.profiles(id) on delete cascade not null,
  title       text not null,
  excerpt     text default '',
  content     text not null,
  category    text not null check (category in ('career','life','knowledge','tech','finance','health')),
  language    text not null default 'en',
  tags        text[] default '{}',
  read_time   int default 1,
  published   boolean default false,
  featured    boolean default false,
  like_count  int default 0,
  view_count  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Likes
create table if not exists public.story_likes (
  story_id   uuid references public.stories(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (story_id, user_id)
);

-- ---- Row Level Security ----
alter table public.profiles    enable row level security;
alter table public.stories     enable row level security;
alter table public.story_likes enable row level security;

-- Profiles
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Stories
create policy "stories_select_published" on public.stories for select using (published = true);
create policy "stories_select_own"       on public.stories for select using (auth.uid() = author_id);
create policy "stories_insert"           on public.stories for insert with check (auth.uid() = author_id);
create policy "stories_update"           on public.stories for update using (auth.uid() = author_id);
create policy "stories_delete"           on public.stories for delete using (auth.uid() = author_id);

-- Likes
create policy "likes_select" on public.story_likes for select using (true);
create policy "likes_insert" on public.story_likes for insert with check (auth.uid() = user_id);
create policy "likes_delete" on public.story_likes for delete using (auth.uid() = user_id);

-- ---- Triggers ----
create or replace function update_like_count() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.stories set like_count = like_count + 1 where id = new.story_id;
  elsif tg_op = 'DELETE' then
    update public.stories set like_count = greatest(0, like_count - 1) where id = old.story_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_like_change
  after insert or delete on public.story_likes
  for each row execute procedure update_like_count();

-- Increment view count helper (called from frontend)
create or replace function increment_view(p_story_id uuid) returns void as $$
begin
  update public.stories set view_count = view_count + 1 where id = p_story_id;
end;
$$ language plpgsql security definer;
