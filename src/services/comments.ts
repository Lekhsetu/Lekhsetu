import { supabase } from "@/lib/supabase";
import type { Comment } from "@/types";

export async function fetchComments(storyId: string): Promise<Comment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(display_name, full_name, username, avatar_url)")
    .eq("story_id", storyId)
    .order("created_at", { ascending: true });
  if (error) console.error("Fetch Comments Error:", error);
  return (data ?? []) as Comment[];
}

/** Fetch comment counts for many stories at once, keyed by story id. */
export async function fetchCommentCountsBulk(storyIds: string[]): Promise<Record<string, number>> {
  if (!supabase || storyIds.length === 0) return {};
  const { data, error } = await supabase
    .from("comments")
    .select("story_id")
    .in("story_id", storyIds);
  if (error) { console.error("Fetch Comment Counts Bulk Error:", error); return {}; }

  const counts: Record<string, number> = {};
  (data ?? []).forEach((c: { story_id: string }) => {
    counts[c.story_id] = (counts[c.story_id] ?? 0) + 1;
  });
  return counts;
}

export async function addComment(storyId: string, userId: string, content: string) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = await supabase
    .from("comments")
    .insert({ story_id: storyId, user_id: userId, content: content.trim() });
  if (error) console.error("Add Comment Error:", error);
  return { error };
}

export async function deleteComment(commentId: string) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) console.error("Delete Comment Error:", error);
  return { error };
}
