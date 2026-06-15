import { supabase } from "@/lib/supabase";
import type { Story } from "@/types";

const STORY_SELECT = "*, profiles!stories_author_id_fkey(display_name, full_name, username, avatar_url)";

export async function fetchPublishedStories({
  category,
  limit = 50,
}: {
  category?: string | null;
  limit?: number;
} = {}) {
  if (!supabase) return [] as Story[];

  let query = supabase
    .from("stories")
    .select(STORY_SELECT)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) console.error("Fetch Stories Error:", error.message, error.details, error.hint);
  return (data ?? []) as Story[];
}

export async function fetchCategoryCounts() {
  if (!supabase) return {} as Record<string, number>;
  const { data, error } = await supabase
    .from("stories")
    .select("category, translation_group_id")
    .eq("published", true);
  if (error) {
    console.error("Category Counts Error:", error.message, error.details, error.hint);
    return {} as Record<string, number>;
  }
  const counts: Record<string, number> = {};
  const seenGroups = new Set<string>();
  for (const row of (data ?? []) as { category: string; translation_group_id: string | null }[]) {
    if (row.translation_group_id) {
      if (seenGroups.has(row.translation_group_id)) continue;
      seenGroups.add(row.translation_group_id);
    }
    counts[row.category] = (counts[row.category] ?? 0) + 1;
  }
  return counts;
}

/** Lightweight stats for the "Community" sidebar widget. */
export async function fetchCommunityStats() {
  if (!supabase) return { storyCount: 0, writerCount: 0 };
  const [stories, writers] = await Promise.all([
    supabase.from("stories").select("translation_group_id").eq("published", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  const seenGroups = new Set<string>();
  let storyCount = 0;
  for (const row of (stories.data ?? []) as { translation_group_id: string | null }[]) {
    if (row.translation_group_id) {
      if (seenGroups.has(row.translation_group_id)) continue;
      seenGroups.add(row.translation_group_id);
    }
    storyCount++;
  }

  return {
    storyCount,
    writerCount: writers.count ?? 0,
  };
}

export async function fetchStoryById(id: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("stories")
    .select(STORY_SELECT)
    .eq("id", id)
    .single();
  if (error) console.error("Fetch Story Error:", error.message, error.details, error.hint);
  return data as Story;
}

export async function fetchRelatedStories(category: string, excludeId: string, limit = 3, excludeGroupId?: string | null) {
  if (!supabase) return [] as Story[];
  let query = supabase
    .from("stories")
    .select(STORY_SELECT)
    .eq("category", category)
    .neq("id", excludeId)
    .eq("published", true);

  // Don't recommend other language copies of the same article as "related".
  if (excludeGroupId) {
    query = query.or(`translation_group_id.is.null,translation_group_id.neq.${excludeGroupId}`);
  }

  const { data, error } = await query.limit(limit * 3);
  if (error) console.error("Related Stories Error:", error.message, error.details, error.hint);
  return dedupeTranslations((data ?? []) as Story[]).slice(0, limit);
}

export async function incrementStoryView(id: string, userId?: string | null) {
  if (!supabase) return;
  const key = `viewed_${id}`;
  if (typeof window !== "undefined" && sessionStorage.getItem(key)) return;
  try {
    await supabase.rpc("increment_view", { p_story_id: id, p_user_id: userId ?? null });
    if (typeof window !== "undefined") sessionStorage.setItem(key, "1");
  } catch (err) {
    console.error("View Increment Error:", err);
  }
}

/**
 * Ranked feed: trending score (likes + views, decayed by age), boosted by the
 * user's learned category/language affinity when userId is provided.
 */
export async function fetchFeed({
  userId,
  category,
  limit = 50,
}: {
  userId?: string | null;
  category?: string | null;
  limit?: number;
} = {}) {
  if (!supabase) return [] as Story[];

  const { data: ranked, error } = await supabase.rpc("get_feed", {
    p_user_id: userId ?? null,
    p_category: category ?? null,
    p_limit: limit,
  });
  if (error) {
    console.error("Fetch Feed Error:", error.message, error.details, error.hint);
    return [] as Story[];
  }

  const ids = (ranked ?? []).map((r: { id: string }) => r.id);
  if (ids.length === 0) return [] as Story[];

  const { data, error: storiesError } = await supabase
    .from("stories")
    .select(STORY_SELECT)
    .in("id", ids);
  if (storiesError) {
    console.error("Fetch Feed Stories Error:", storiesError.message, storiesError.details, storiesError.hint);
    return [] as Story[];
  }

  const byId = new Map<string, Story>((data as Story[] ?? []).map((s: Story) => [s.id, s]));
  return ids.map((id: string) => byId.get(id)).filter((s: Story | undefined): s is Story => Boolean(s));
}

/**
 * Collapses multi-language copies of the same article (sharing a
 * translation_group_id) down to a single entry — the earliest-created
 * ("primary") copy — so each article appears as one card in feeds.
 */
export function dedupeTranslations(stories: Story[]): Story[] {
  const primaryByGroup = new Map<string, Story>();
  const result: Story[] = [];

  for (const s of stories) {
    const key = s.translation_group_id;
    if (!key) { result.push(s); continue; }

    const existing = primaryByGroup.get(key);
    if (!existing) {
      primaryByGroup.set(key, s);
      result.push(s);
    } else if (new Date(s.created_at).getTime() < new Date(existing.created_at).getTime()) {
      result[result.indexOf(existing)] = s;
      primaryByGroup.set(key, s);
    }
  }

  return result;
}

/**
 * Given a list of stories, swaps any story that has a translation_group_id
 * for its sibling published in the reader's preferred language, when one
 * exists — so a Kannada reader sees the Kannada version of a story a creator
 * also published in Hindi, etc.
 */
export async function localizeStories(stories: Story[], preferredLanguage: string | null) {
  if (!supabase || !preferredLanguage) return stories;

  const groupIds = [...new Set(
    stories
      .filter(s => s.translation_group_id && s.language !== preferredLanguage)
      .map(s => s.translation_group_id as string)
  )];
  if (groupIds.length === 0) return stories;

  const { data, error } = await supabase
    .from("stories")
    .select(STORY_SELECT)
    .in("translation_group_id", groupIds)
    .eq("language", preferredLanguage)
    .eq("published", true);
  if (error || !data) return stories;

  const byGroup = new Map<string, Story>();
  for (const row of data as Story[]) {
    if (row.translation_group_id) byGroup.set(row.translation_group_id, row);
  }

  return stories.map(s => {
    if (s.translation_group_id && s.language !== preferredLanguage) {
      return byGroup.get(s.translation_group_id) ?? s;
    }
    return s;
  });
}

/** Other published translations of the same story, keyed by language. */
export async function fetchTranslationSiblings(groupId: string, excludeId: string) {
  if (!supabase) return [] as Story[];
  const { data, error } = await supabase
    .from("stories")
    .select(STORY_SELECT)
    .eq("translation_group_id", groupId)
    .eq("published", true)
    .neq("id", excludeId);
  if (error) return [] as Story[];
  return (data ?? []) as Story[];
}

export async function publishStory(payload: {
  authorId: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  language: string;
  tags: string[];
  readTime: number;
  anonymous?: boolean;
  seriesTitle?: string;
  seriesPart?: number;
  translationGroupId?: string;
}) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured") };

  const { data, error } = await supabase
    .from("stories")
    .insert({
      author_id: payload.authorId,
      title: payload.title,
      content: payload.content,
      excerpt: payload.excerpt,
      category: payload.category,
      language: payload.language,
      tags: payload.tags,
      read_time: payload.readTime,
      published: true,
      anonymous: payload.anonymous ?? false,
      series_title: payload.seriesTitle || null,
      series_part: payload.seriesPart || null,
      translation_group_id: payload.translationGroupId || null,
    })
    .select()
    .single();

  if (error) console.error("Story Insert Error:", error);
  return { data, error };
}

export async function updateStory(
  storyId: string,
  payload: {
    title: string;
    content: string;
    excerpt: string;
    category: string;
    language: string;
    tags: string[];
    readTime: number;
    anonymous?: boolean;
    seriesTitle?: string;
    seriesPart?: number;
  }
) {
  if (!supabase) return { error: new Error("Supabase is not configured") };
  const { error } = await supabase
    .from("stories")
    .update({
      title: payload.title,
      content: payload.content,
      excerpt: payload.excerpt,
      category: payload.category,
      language: payload.language,
      tags: payload.tags,
      read_time: payload.readTime,
      anonymous: payload.anonymous ?? false,
      series_title: payload.seriesTitle || null,
      series_part: payload.seriesPart || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", storyId);
  if (error) console.error("Story Update Error:", error);
  return { error };
}

/**
 * Deletes a story. If it's part of a multi-language group (translationGroupId),
 * all linked translations are deleted together as one article.
 */
export async function deleteStory(storyId: string, translationGroupId?: string | null) {
  if (!supabase) return { error: new Error("Supabase is not configured") };
  const { error } = translationGroupId
    ? await supabase.from("stories").delete().eq("translation_group_id", translationGroupId)
    : await supabase.from("stories").delete().eq("id", storyId);
  if (error) console.error("Story Delete Error:", error);
  return { error };
}

export async function saveDraftStory(payload: {
  authorId: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  language: string;
  tags: string[];
  readTime: number;
}) {
  if (!supabase) return { data: null, error: new Error("Supabase is not configured") };
  const { data, error } = await supabase
    .from("stories")
    .insert({
      author_id: payload.authorId,
      title: payload.title,
      content: payload.content,
      excerpt: payload.excerpt,
      category: payload.category,
      language: payload.language,
      tags: payload.tags,
      read_time: payload.readTime,
      published: false,
    })
    .select()
    .single();
  if (error) console.error("Draft Save Error:", error);
  return { data, error };
}
