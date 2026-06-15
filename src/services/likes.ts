import { supabase } from "@/lib/supabase";

export async function hasLiked(storyId: string, userId: string) {
  if (!supabase) return false;
  const { data } = await supabase
    .from("story_likes")
    .select("story_id")
    .eq("story_id", storyId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function likeStory(storyId: string, userId: string) {
  if (!supabase) return;
  const { error } = await supabase.from("story_likes").insert({ story_id: storyId, user_id: userId });
  if (error) console.error("Like error:", error.message);
}

export async function unlikeStory(storyId: string, userId: string) {
  if (!supabase) return;
  const { error } = await supabase.from("story_likes").delete().eq("story_id", storyId).eq("user_id", userId);
  if (error) console.error("Unlike error:", error.message);
}
