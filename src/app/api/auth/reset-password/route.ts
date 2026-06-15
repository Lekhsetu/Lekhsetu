import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ─── Basic per-IP rate limiting ──────────────────────────────────────────────
// Resets on cold start; just there to slow down brute-force attempts against
// the security-question verification below.
const RATE_LIMIT = 10; // requests
const RATE_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS);
  if (timestamps.length >= RATE_LIMIT) {
    requestLog.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return false;
}

function getClientIp(req: NextRequest): string {
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

const GENERIC_ERROR = "We couldn't verify your identity with those answers.";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !supabaseAdmin) {
    return NextResponse.json({ error: "Account recovery is not configured." }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const login = typeof body?.login === "string" ? body.login.trim() : "";
  const answers = body?.answers;
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!login || !answers || typeof answers !== "object" || newPassword.length < 8) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const anon = createClient(url, anonKey);

  const { data: verified } = await anon.rpc("verify_recovery_answers", { p_login: login, p_answers: answers });
  if (!verified) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const { data: accounts } = await anon.rpc("lookup_account", { p_login: login });
  const account = Array.isArray(accounts) ? accounts[0] : null;
  if (!account?.id || !account?.email) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(account.id, { password: newPassword });
  if (error) {
    return NextResponse.json({ error: "Could not reset your password. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email: account.email });
}
