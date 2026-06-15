import { createClient } from "@supabase/supabase-js";

// Server-only client using the Supabase service role key. Never import this
// from a "use client" component — the key must never reach the browser.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const supabaseAdmin = url && serviceKey
  ? createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;
