import { supabase } from "@/lib/supabase";

export async function fetchClapTotal(storyId: string): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase
    .from("story_claps")
    .select("count")
    .eq("story_id", storyId);
  if (error) { console.error("Fetch Claps Error:", error); return 0; }
  return (data ?? []).reduce((sum, r: { count: number }) => sum + r.count, 0);
}

/** Fetch total clap counts for many stories at once, keyed by story id. */
export async function fetchClapTotalsBulk(storyIds: string[]): Promise<Record<string, number>> {
  if (!supabase || storyIds.length === 0) return {};
  const { data, error } = await supabase
    .from("story_claps")
    .select("story_id, count")
    .in("story_id", storyIds);
  if (error) { console.error("Fetch Claps Bulk Error:", error); return {}; }

  const result: Record<string, number> = {};
  (data ?? []).forEach((r: { story_id: string; count: number }) => {
    result[r.story_id] = (result[r.story_id] ?? 0) + r.count;
  });
  return result;
}

export async function getUserClapCount(storyId: string, userId: string): Promise<number> {
  if (!supabase) return 0;
  const { data } = await supabase
    .from("story_claps")
    .select("count")
    .eq("story_id", storyId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.count ?? 0;
}

/** Flips the user's reaction to a story between liked (1) and not (0). Returns the new value. */
export async function toggleClap(storyId: string, userId: string): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc("toggle_clap", {
    p_story_id: storyId,
    p_user_id: userId,
  });
  if (error) { console.error("Toggle Clap Error:", error); return 0; }
  return data as number;
}

export async function reportStory(storyId: string, userId: string, reason: string) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = await supabase
    .from("story_reports")
    .insert({ story_id: storyId, reporter_id: userId, reason });
  if (error) console.error("Report Story Error:", error);
  return { error };
}
