import { supabase } from "@/lib/supabase";
import type { Profile, Story } from "@/types";
import { dedupeTranslations, localizeStories } from "./stories";

export async function fetchProfile(userId: string) {
  if (!supabase) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return (data ?? null) as Profile | null;
}

export async function fetchProfileByUsername(username: string) {
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  return (data ?? null) as Profile | null;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, "display_name" | "full_name" | "username" | "bio" | "country" | "city" | "preferred_language" | "preferred_categories" | "onboarding_completed">>
) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  return { error };
}

export async function updateProfileWithUsernameChange(
  userId: string,
  updates: Partial<Pick<Profile, "display_name" | "full_name" | "username" | "bio">>,
  usernameChanged: boolean
) {
  if (!supabase) return { error: new Error("Not configured") };
  if (
    updates.username &&
    updates.display_name &&
    updates.username.trim().toLowerCase() === updates.display_name.trim().toLowerCase()
  ) {
    return { error: new Error("Username and display name cannot be the same") };
  }
  const payload = usernameChanged
    ? { ...updates, username_changed_at: new Date().toISOString() }
    : updates;
  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  return { error };
}

const USERNAME_COOLDOWN_DAYS = 60;

export function getUsernameCooldown(profile: Profile | null): { canChange: boolean; nextChangeDate: Date | null } {
  if (!profile?.username_changed_at) return { canChange: true, nextChangeDate: null };
  const last = new Date(profile.username_changed_at);
  const next = new Date(last.getTime() + USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  if (next.getTime() <= Date.now()) return { canChange: true, nextChangeDate: null };
  return { canChange: false, nextChangeDate: next };
}

export async function checkUsernameAvailable(username: string, currentUserId: string) {
  if (!supabase) return true;
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .neq("id", currentUserId)
    .maybeSingle();
  return !data;
}

/** Sets/updates the salted security-question answers used for account recovery. */
export async function setSecurityAnswers(userId: string, salt: string, answers: Record<string, string>) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = await supabase.from("profiles").update({ security_salt: salt, security_answers: answers }).eq("id", userId);
  return { error };
}

/** Verifies that the given answers match the account's stored security-question hashes. */
export async function verifyRecoveryAnswers(login: string, answers: Record<string, string>): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.rpc("verify_recovery_answers", { p_login: login, p_answers: answers });
  return !!data;
}

/** Resolves an email-or-username login to the account's email address. */
export async function lookupEmail(login: string): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.rpc("lookup_account", { p_login: login });
  const row = Array.isArray(data) ? data[0] : data;
  return row?.email ?? null;
}

/** Resets a forgotten password after verifying security-question answers server-side. */
export async function resetPasswordWithAnswers(
  login: string,
  answers: Record<string, string>,
  newPassword: string
): Promise<{ email?: string; error?: string }> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, answers, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Could not reset password" };
  return { email: data.email };
}

/** Uploads/replaces the user's profile picture and saves its public URL. */
export async function uploadAvatar(userId: string, file: File): Promise<{ url?: string; error?: string }> {
  if (!supabase) return { error: "Not configured" };
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) return { error: uploadError.message };
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;
  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
  if (error) return { error: error.message };
  return { url };
}

/** Removes the user's profile picture, reverting to the initial-letter avatar. */
export async function removeAvatar(userId: string) {
  if (!supabase) return { error: new Error("Not configured") };
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", userId);
  return { error };
}

/**
 * Stories for a profile's public story grid, collapses multi-language
 * translations of the same article down to one card, swapped to the
 * viewer's preferred language when a matching translation exists.
 */
export async function fetchStoriesByAuthor(authorId: string, preferredLanguage?: string | null): Promise<Story[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("stories")
    .select("*, profiles!stories_author_id_fkey(display_name, full_name, username, avatar_url)")
    .eq("author_id", authorId)
    .eq("published", true)
    .order("created_at", { ascending: false });
  const deduped = dedupeTranslations((data ?? []) as Story[]);
  return localizeStories(deduped, preferredLanguage ?? null);
}
