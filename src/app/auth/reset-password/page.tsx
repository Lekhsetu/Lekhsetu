"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

function ResetPasswordContent() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!supabase) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setHasSession(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError("Backend not configured."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => router.replace("/auth"), 2000);
  };

  const input = "w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,166,35,0.15)", color: "#F0EAD6" };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "#0B0907" }}>
      <div className="w-full max-w-sm">
        <Link href="/auth" className="flex items-center gap-1.5 text-sm mb-8 transition-colors" style={{ color: "#6B6354" }}>
          <ArrowLeft size={14} /> Back to sign in
        </Link>

        <div className="flex items-center mb-8">
          <img src="/logo-horizontal-dark.png" alt="Lekhsetu" className="h-9 w-auto" />
        </div>

        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "#F0EAD6" }}>Set a new password</h1>

        {!ready ? (
          <div className="w-6 h-6 rounded-full border-2 border-gold animate-spin mt-6" style={{ borderTopColor: "transparent" }} />
        ) : !hasSession ? (
          <p className="text-sm mt-4" style={{ color: "#6B6354" }}>
            This password reset link is invalid or has expired. Please request a new one from the{" "}
            <Link href="/auth" className="underline" style={{ color: "#F5A623" }}>sign-in page</Link>.
          </p>
        ) : success ? (
          <p className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 mt-4" style={{ background: "rgba(245,166,35,0.08)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.2)" }}>
            <Sparkles size={12} /> Password updated. Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>New password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 8 characters" minLength={8}
                  className={`${input} pr-10`} style={inputStyle} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#6B6354" }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>Confirm new password</label>
              <input
                type={showPw ? "text" : "password"} required value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className={input} style={inputStyle} />
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: "#F5A623", color: "#0B0907" }}>
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0907" }}>
        <div className="w-6 h-6 rounded-full border-2 border-gold animate-spin" style={{ borderTopColor: "transparent" }} />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
