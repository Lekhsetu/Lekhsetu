import { supabase } from "@/lib/supabase";
import type { Profile, Story } from "@/types";
import { dedupeTranslations } from "./stories";
import type { TimelinePoint } from "./insights";

export type PlatformStats = {
  totalUsers: number;
  totalStories: number;
  totalDrafts: number;
  totalViews: number;
  totalComments: number;
  pendingReports: number;
};

export type AdminReport = {
  id: string;
  story_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
  stories?: Pick<Story, "id" | "title"> | null;
  profiles?: Pick<Profile, "username" | "display_name"> | null;
};

export type AdminFeedback = {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  category: string;
  message: string;
  page: string | null;
  created_at: string;
};

export async function fetchPlatformStats(): Promise<PlatformStats> {
  if (!supabase) {
    return { totalUsers: 0, totalStories: 0, totalDrafts: 0, totalViews: 0, totalComments: 0, pendingReports: 0 };
  }

  const [users, published, drafts, views, comments, reports] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("stories").select("id, translation_group_id").eq("published", true),
    supabase.from("stories").select("id", { count: "exact", head: true }).eq("published", false),
    supabase.from("stories").select("views_count"),
    supabase.from("comments").select("id", { count: "exact", head: true }),
    supabase.from("story_reports").select("id", { count: "exact", head: true }),
  ]);

  const totalViews = (views.data ?? []).reduce((sum, s: { views_count: number | null }) => sum + (s.views_count ?? 0), 0);

  // One article published in multiple languages shares a translation_group_id
  // and should count as a single story, not one per language.
  const publishedGroups = new Set<string>();
  let totalStories = 0;
  for (const s of (published.data ?? []) as { id: string; translation_group_id: string | null }[]) {
    if (s.translation_group_id) {
      if (publishedGroups.has(s.translation_group_id)) continue;
      publishedGroups.add(s.translation_group_id);
    }
    totalStories++;
  }

  return {
    totalUsers: users.count ?? 0,
    totalStories,
    totalDrafts: drafts.count ?? 0,
    totalViews,
    totalComments: comments.count ?? 0,
    pendingReports: reports.count ?? 0,
  };
}

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

/** Daily new users and newly published articles (deduped across translation groups) over the last N days. */
export async function fetchPlatformTimeline(days = 14): Promise<{ users: TimelinePoint[]; stories: TimelinePoint[] }> {
  const { keys, labels } = dayBuckets(days);
  const empty = { users: keys.map((k, i) => ({ label: labels[i], value: 0 })), stories: keys.map((k, i) => ({ label: labels[i], value: 0 })) };
  if (!supabase) return empty;

  const since = keys[0];
  const [{ data: users }, { data: stories }] = await Promise.all([
    supabase.from("profiles").select("created_at").gte("created_at", since),
    supabase.from("stories").select("id, created_at, translation_group_id, published").eq("published", true).gte("created_at", since),
  ]);

  const userByDay = new Map<string, number>();
  for (const u of (users ?? []) as { created_at: string }[]) {
    const key = u.created_at.slice(0, 10);
    userByDay.set(key, (userByDay.get(key) ?? 0) + 1);
  }

  const seenGroups = new Set<string>();
  const storyByDay = new Map<string, number>();
  for (const s of (stories ?? []) as { id: string; created_at: string; translation_group_id: string | null }[]) {
    if (s.translation_group_id) {
      if (seenGroups.has(s.translation_group_id)) continue;
      seenGroups.add(s.translation_group_id);
    }
    const key = s.created_at.slice(0, 10);
    storyByDay.set(key, (storyByDay.get(key) ?? 0) + 1);
  }

  return {
    users: keys.map((k, i) => ({ label: labels[i], value: userByDay.get(k) ?? 0 })),
    stories: keys.map((k, i) => ({ label: labels[i], value: storyByDay.get(k) ?? 0 })),
  };
}

/** Top published articles ranked by views + claps*4 + comments*3 (matches the feed ranking weights). */
export async function fetchTopStoriesByEngagement(limit = 5): Promise<{ title: string; score: number }[]> {
  if (!supabase) return [];

  const { data: stories } = await supabase
    .from("stories")
    .select("id, title, views_count, translation_group_id, created_at")
    .eq("published", true);

  const list = dedupeTranslations((stories ?? []) as Story[]);
  const ids = list.map(s => s.id);
  if (ids.length === 0) return [];

  const [{ data: claps }, { data: comments }] = await Promise.all([
    supabase.from("story_claps").select("story_id, count").in("story_id", ids),
    supabase.from("comments").select("story_id").in("story_id", ids),
  ]);

  const clapMap = new Map<string, number>();
  for (const c of (claps ?? []) as { story_id: string; count: number }[]) {
    clapMap.set(c.story_id, (clapMap.get(c.story_id) ?? 0) + c.count);
  }
  const commentMap = new Map<string, number>();
  for (const c of (comments ?? []) as { story_id: string }[]) {
    commentMap.set(c.story_id, (commentMap.get(c.story_id) ?? 0) + 1);
  }

  return list
    .map(s => ({
      title: s.title,
      score: (s.views_count ?? 0) + (clapMap.get(s.id) ?? 0) * 4 + (commentMap.get(s.id) ?? 0) * 3,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function fetchAllStories(): Promise<Story[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("stories")
    .select("*, profiles!stories_author_id_fkey(display_name, full_name, username)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) console.error("Admin Fetch Stories Error:", error);
  return dedupeTranslations((data ?? []) as Story[]);
}

export async function fetchAllReports(): Promise<AdminReport[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("story_reports")
    .select("*, stories(id, title), profiles(username, display_name)")
    .order("created_at", { ascending: false });
  if (error) console.error("Admin Fetch Reports Error:", error);
  return (data ?? []) as AdminReport[];
}

export async function fetchAllUsers(): Promise<Profile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) console.error("Admin Fetch Users Error:", error);
  return (data ?? []) as Profile[];
}

export async function adminDeleteStory(storyId: string, translationGroupId?: string | null) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = translationGroupId
    ? await supabase.from("stories").delete().eq("translation_group_id", translationGroupId)
    : await supabase.from("stories").delete().eq("id", storyId);
  if (error) console.error("Admin Delete Story Error:", error);
  return { error };
}

export async function adminSetFeatured(storyId: string, featured: boolean, translationGroupId?: string | null) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = translationGroupId
    ? await supabase.from("stories").update({ featured }).eq("translation_group_id", translationGroupId)
    : await supabase.from("stories").update({ featured }).eq("id", storyId);
  if (error) console.error("Admin Set Featured Error:", error);
  return { error };
}

export async function adminSetPublished(storyId: string, published: boolean, translationGroupId?: string | null) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = translationGroupId
    ? await supabase.from("stories").update({ published }).eq("translation_group_id", translationGroupId)
    : await supabase.from("stories").update({ published }).eq("id", storyId);
  if (error) console.error("Admin Set Published Error:", error);
  return { error };
}

export async function adminDismissReport(reportId: string) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = await supabase.from("story_reports").delete().eq("id", reportId);
  if (error) console.error("Admin Dismiss Report Error:", error);
  return { error };
}

export async function adminSetBanned(userId: string, banned: boolean) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = await supabase.from("profiles").update({ is_banned: banned }).eq("id", userId);
  if (error) console.error("Admin Set Banned Error:", error);
  return { error };
}

export async function fetchAllFeedback(): Promise<AdminFeedback[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) console.error("Admin Fetch Feedback Error:", error);
  return (data ?? []) as AdminFeedback[];
}

export async function adminDeleteFeedback(feedbackId: string) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = await supabase.from("feedback").delete().eq("id", feedbackId);
  if (error) console.error("Admin Delete Feedback Error:", error);
  return { error };
}

export async function adminSetAdmin(userId: string, isAdmin: boolean) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = await supabase.from("profiles").update({ is_admin: isAdmin }).eq("id", userId);
  if (error) console.error("Admin Set Admin Error:", error);
  return { error };
}
