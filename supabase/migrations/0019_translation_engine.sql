-- ================================================================
-- Lekhsetu Translation Engine
-- Layer 1: ai_translation_cache  — full story translations
-- Layer 2: translation_memory    — sentence pairs (grows over time)
-- Layer 3: word_glossary         — fixed rules for Indian terms
-- ================================================================

-- Layer 1: full story translation cache
create table if not exists ai_translation_cache (
  id          uuid primary key default gen_random_uuid(),
  story_id    uuid references stories(id) on delete cascade not null,
  language    text not null,
  title       text not null,
  excerpt     text not null default '',
  content     text not null,
  created_at  timestamptz default now(),
  unique(story_id, language)
);

alter table ai_translation_cache enable row level security;
create policy "Public read cache"   on ai_translation_cache for select using (true);
create policy "Public insert cache" on ai_translation_cache for insert with check (true);
create index on ai_translation_cache(story_id, language);

-- Layer 2: sentence-level translation memory
create table if not exists translation_memory (
  id          uuid primary key default gen_random_uuid(),
  source_text text not null,
  source_lang text not null,
  target_text text not null,
  target_lang text not null,
  frequency   integer not null default 1,
  created_at  timestamptz default now(),
  unique(source_text, source_lang, target_lang)
);

alter table translation_memory enable row level security;
create policy "Public read memory"   on translation_memory for select using (true);
create policy "Public insert memory" on translation_memory for insert with check (true);
create policy "Public update memory" on translation_memory for update using (true);
create index on translation_memory(source_lang, target_lang);

-- Layer 3: fixed word/phrase glossary for Indian terms
create table if not exists word_glossary (
  id          uuid primary key default gen_random_uuid(),
  word        text not null,
  source_lang text not null default 'en',
  translation text not null,
  target_lang text not null,
  created_at  timestamptz default now(),
  unique(word, source_lang, target_lang)
);

alter table word_glossary enable row level security;
create policy "Public read glossary" on word_glossary for select using (true);

-- Pre-populate glossary: Indian terms that should never be mistranslated
insert into word_glossary(word, source_lang, translation, target_lang) values
  ('chai',      'en', 'chai',      'hi'), ('chai',      'en', 'chai',      'mr'),
  ('chai',      'en', 'chai',      'ta'), ('chai',      'en', 'chai',      'kn'),
  ('chai',      'en', 'chai',      'te'), ('chai',      'en', 'chai',      'bn'),
  ('EMI',       'en', 'EMI',       'hi'), ('EMI',       'en', 'EMI',       'mr'),
  ('EMI',       'en', 'EMI',       'ta'), ('EMI',       'en', 'EMI',       'kn'),
  ('startup',   'en', 'startup',   'hi'), ('startup',   'en', 'startup',   'mr'),
  ('Bangalore', 'en', 'Bangalore', 'hi'), ('Bangalore', 'en', 'Bangalore', 'mr'),
  ('Mumbai',    'en', 'Mumbai',    'hi'), ('Delhi',     'en', 'Delhi',     'hi'),
  ('didi',      'en', 'didi',      'hi'), ('bhaiya',    'en', 'bhaiya',    'hi'),
  ('anna',      'en', 'anna',      'ta'), ('anna',      'en', 'anna',      'kn')
on conflict do nothing;

-- RPC: upsert a sentence pair and increment frequency on repeat
create or replace function upsert_translation_memory(
  p_source_text text,
  p_source_lang text,
  p_target_text text,
  p_target_lang text
) returns void language plpgsql security definer as $$
begin
  insert into translation_memory(source_text, source_lang, target_text, target_lang, frequency)
  values (p_source_text, p_source_lang, p_target_text, p_target_lang, 1)
  on conflict (source_text, source_lang, target_lang)
  do update set
    frequency   = translation_memory.frequency + 1,
    target_text = excluded.target_text;
end;
$$;

grant execute on function upsert_translation_memory to anon, authenticated;
