import { supabase } from "@/lib/supabase";
import type { Story } from "@/types";

export type StoryInsight = Story & {
  clapTotal: number;
  commentCount: number;
};

export type UserInsightsTotals = {
  totalStories: number;
  totalViews: number;
  totalLikes: number;
  totalClaps: number;
  totalComments: number;
};

export type TimelinePoint = { label: string; value: number };

function dayBuckets(days: number): { keys: string[]; labels: string[] } {
  const keys: string[] = [];
  const labels: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
    labels.push(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
  }
  return { keys, labels };
}

/** Daily claps/comments received across an author's stories over the last N days. */
export async function fetchUserActivityTimeline(authorId: string, days = 14): Promise<{ claps: TimelinePoint[]; comments: TimelinePoint[] }> {
  const { keys, labels } = dayBuckets(days);
  const empty = { claps: keys.map((k, i) => ({ label: labels[i], value: 0 })), comments: keys.map((k, i) => ({ label: labels[i], value: 0 })) };
  if (!supabase) return empty;

  const { data: storyRows } = await supabase.from("stories").select("id").eq("author_id", authorId);
  const storyIds = (storyRows ?? []).map((s: { id: string }) => s.id);
  if (storyIds.length === 0) return empty;

  const [{ data: claps }, { data: comments }] = await Promise.all([
    supabase.from("story_claps").select("count, updated_at").in("story_id", storyIds),
    supabase.from("comments").select("created_at").in("story_id", storyIds),
  ]);

  const clapByDay = new Map<string, number>();
  for (const c of (claps ?? []) as { count: number; updated_at: string }[]) {
    const key = c.updated_at.slice(0, 10);
    clapByDay.set(key, (clapByDay.get(key) ?? 0) + c.count);
  }
  const commentByDay = new Map<string, number>();
  for (const c of (comments ?? []) as { created_at: string }[]) {
    const key = c.created_at.slice(0, 10);
    commentByDay.set(key, (commentByDay.get(key) ?? 0) + 1);
  }

  return {
    claps: keys.map((k, i) => ({ label: labels[i], value: clapByDay.get(k) ?? 0 })),
    comments: keys.map((k, i) => ({ label: labels[i], value: commentByDay.get(k) ?? 0 })),
  };
}

export async function fetchUserInsights(authorId: string): Promise<{ stories: StoryInsight[]; totals: UserInsightsTotals }> {
  const empty = { totalStories: 0, totalViews: 0, totalLikes: 0, totalClaps: 0, totalComments: 0 };
  if (!supabase) return { stories: [], totals: empty };

  const { data: stories, error } = await supabase
    .from("stories")
    .select("*, profiles!stories_author_id_fkey(display_name, full_name, username)")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });

  if (error) console.error("Fetch Insights Error:", error);
  const storyList = (stories ?? []) as Story[];
  const storyIds = storyList.map(s => s.id);

  const clapMap = new Map<string, number>();
  const commentMap = new Map<string, number>();

  if (storyIds.length > 0) {
    const [{ data: claps }, { data: comments }] = await Promise.all([
      supabase.from("story_claps").select("story_id, count").in("story_id", storyIds),
      supabase.from("comments").select("story_id").in("story_id", storyIds),
    ]);

    for (const c of (claps ?? []) as { story_id: string; count: number }[]) {
      clapMap.set(c.story_id, (clapMap.get(c.story_id) ?? 0) + c.count);
    }
    for (const c of (comments ?? []) as { story_id: string }[]) {
      commentMap.set(c.story_id, (commentMap.get(c.story_id) ?? 0) + 1);
    }
  }

  const result: StoryInsight[] = storyList.map(s => ({
    ...s,
    clapTotal: clapMap.get(s.id) ?? 0,
    commentCount: commentMap.get(s.id) ?? 0,
  }));

  const totals = result.reduce((acc, s) => {
    acc.totalViews += s.views_count ?? 0;
    acc.totalLikes += s.likes_count ?? 0;
    acc.totalClaps += s.clapTotal;
    acc.totalComments += s.commentCount;
    return acc;
  }, { ...empty });

  // Collapse multi-language translations of the same article into a single
  // row — combining their stats — so each article appears once with one
  // Edit/Delete action that applies to the whole group.
  const grouped: StoryInsight[] = [];
  const byGroup = new Map<string, StoryInsight>();
  for (const s of result) {
    const key = s.translation_group_id;
    if (!key) { grouped.push(s); continue; }

    const existing = byGroup.get(key);
    if (!existing) {
      byGroup.set(key, s);
      grouped.push(s);
      continue;
    }
    existing.views_count = (existing.views_count ?? 0) + (s.views_count ?? 0);
    existing.likes_count = (existing.likes_count ?? 0) + (s.likes_count ?? 0);
    existing.clapTotal += s.clapTotal;
    existing.commentCount += s.commentCount;
    if (new Date(s.created_at).getTime() < new Date(existing.created_at).getTime()) {
      const idx = grouped.indexOf(existing);
      grouped[idx] = { ...s, views_count: existing.views_count, likes_count: existing.likes_count, clapTotal: existing.clapTotal, commentCount: existing.commentCount };
      byGroup.set(key, grouped[idx]);
    }
  }

  totals.totalStories = grouped.length;

  return { stories: grouped, totals };
}
