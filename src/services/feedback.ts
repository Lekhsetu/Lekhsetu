import { supabase } from "@/lib/supabase";

export type FeedbackCategory = "general" | "bug" | "idea" | "content" | "other";

export async function submitFeedback(input: {
  userId?: string | null;
  name?: string;
  email?: string;
  category: FeedbackCategory;
  message: string;
  page?: string;
}) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = await supabase.from("feedback").insert({
    user_id: input.userId ?? null,
    name: input.name?.trim() || null,
    email: input.email?.trim() || null,
    category: input.category,
    message: input.message.trim(),
    page: input.page ?? null,
  });
  if (error) console.error("Submit Feedback Error:", error);
  return { error };
}
