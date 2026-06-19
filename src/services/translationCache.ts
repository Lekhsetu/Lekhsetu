import { supabase } from "@/lib/supabase";

export interface CachedTranslation {
  title: string;
  excerpt: string;
  content: string;
}

export async function getCachedTranslation(
  storyId: string,
  language: string
): Promise<CachedTranslation | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("ai_translation_cache")
    .select("title, excerpt, content")
    .eq("story_id", storyId)
    .eq("language", language)
    .single();
  if (error || !data) return null;
  return data as CachedTranslation;
}

export async function saveCachedTranslation(
  storyId: string,
  language: string,
  data: CachedTranslation
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from("ai_translation_cache")
    .upsert(
      { story_id: storyId, language, title: data.title, excerpt: data.excerpt ?? "", content: data.content },
      { onConflict: "story_id,language" }
    );
}

// Split text into sentences suitable for translation memory storage.
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?।॥])\s+|\n\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 15 && s.length < 400);
}

// Zip source and translated sentences into pairs for the translation memory.
// Only stores when counts are close enough to trust the alignment.
export function extractSentencePairs(
  source: string,
  target: string
): Array<{ source: string; target: string }> {
  const srcSentences = splitSentences(source);
  const tgtSentences = splitSentences(target);
  if (Math.abs(srcSentences.length - tgtSentences.length) > 4) return [];
  const len = Math.min(srcSentences.length, tgtSentences.length);
  return Array.from({ length: len }, (_, i) => ({
    source: srcSentences[i],
    target: tgtSentences[i],
  }));
}

// Save sentence pairs to translation_memory in background. Failures are silently swallowed
// so a memory write never blocks or breaks the translation UX.
export async function saveTranslationMemory(
  sourceLang: string,
  targetLang: string,
  sourceContent: string,
  targetContent: string
): Promise<void> {
  if (!supabase) return;
  const pairs = extractSentencePairs(sourceContent, targetContent);
  if (pairs.length === 0) return;

  await Promise.allSettled(
    pairs.map(pair =>
      supabase!.rpc("upsert_translation_memory", {
        p_source_text: pair.source,
        p_source_lang: sourceLang,
        p_target_text: pair.target,
        p_target_lang: targetLang,
      })
    )
  );
}
