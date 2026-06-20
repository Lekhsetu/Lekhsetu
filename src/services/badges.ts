import { supabase } from "@/lib/supabase";

export type BadgeType = "first_story" | "rising_writer" | "storyteller";

export interface WriterBadge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  awarded_at: string;
}

export const BADGE_META: Record<BadgeType, { label: string; emoji: string; description: string; color: string }> = {
  first_story: {
    label: "First Story",
    emoji: "✍️",
    description: "Published your first story",
    color: "#15803d",
  },
  storyteller: {
    label: "Storyteller",
    emoji: "📖",
    description: "Published 5 or more stories",
    color: "#7c3aed",
  },
  rising_writer: {
    label: "Rising Writer",
    emoji: "🌟",
    description: "Earned 100 claps across your stories",
    color: "#d97706",
  },
};

export async function fetchUserBadges(userId: string): Promise<WriterBadge[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("writer_badges")
    .select("*")
    .eq("user_id", userId)
    .order("awarded_at", { ascending: true });
  if (error) { console.error("Fetch Badges Error:", error); return []; }
  return (data ?? []) as WriterBadge[];
}

/** Idempotent — safe to call on every dashboard load and after every publish. */
export async function checkAndAwardBadges(userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc("check_and_award_badges", { p_user_id: userId });
  if (error) console.error("Award Badges Error:", error);
}
