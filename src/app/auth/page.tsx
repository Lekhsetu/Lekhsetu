"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { SECURITY_QUESTIONS, getPinVault, unlockPinVault, removePinVault, savePinVault, generateSalt, hashSecurityAnswer } from "@/utils/pin";
import { lookupEmail, resetPasswordWithAnswers } from "@/services/profiles";

function AuthContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const redirectTo = params.get("next") ?? "/";

  const [tab, setTab] = useState<"signin" | "signup" | "pin">(
    params.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Signup-time PIN setup
  const [signupPin, setSignupPin] = useState("");
  const [signupConfirmPin, setSignupConfirmPin] = useState("");
  const [signupA1, setSignupA1] = useState("");
  const [signupA2, setSignupA2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Account recovery (forgot password / PIN) via security questions
  const [forgotMode, setForgotMode] = useState(false);
  const [recoverStep, setRecoverStep] = useState<"login" | "reset">("login");
  const [recoverLogin, setRecoverLogin] = useState("");
  const [recoverA1, setRecoverA1] = useState("");
  const [recoverA2, setRecoverA2] = useState("");
  const [recoverPassword, setRecoverPassword] = useState("");
  const [recoverConfirmPassword, setRecoverConfirmPassword] = useState("");
  const [recoverPin, setRecoverPin] = useState("");
  const [recoverConfirmPin, setRecoverConfirmPin] = useState("");
  const [recoverDone, setRecoverDone] = useState(false);

  // Sign in with PIN
  const [pinVault, setPinVault] = useState<ReturnType<typeof getPinVault>>(null);
  const [vaultPin, setVaultPin] = useState("");
  const [vaultA1, setVaultA1] = useState("");
  const [vaultA2, setVaultA2] = useState("");

  useEffect(() => {
    if (user) router.replace(redirectTo);
  }, [user, router, redirectTo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPinVault(getPinVault());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError("Backend not configured. Copy .env.local.example to .env.local and fill in your Supabase credentials."); return; }

    if (tab === "signup") {
      if (password !== confirmPassword) { setError("Passwords do not match"); return; }
      if (signupPin.length !== 6) { setError("PIN must be exactly 6 digits"); return; }
      if (signupPin !== signupConfirmPin) { setError("PINs do not match"); return; }
      if (!signupA1.trim() || !signupA2.trim()) { setError("Answer both security questions"); return; }
    }

    setError(""); setSuccess(""); setLoading(true);

    if (tab === "signup") {
      const salt = generateSalt();
      const securityAnswers = {
        [SECURITY_QUESTIONS[0].id]: await hashSecurityAnswer(salt, signupA1),
        [SECURITY_QUESTIONS[1].id]: await hashSecurityAnswer(salt, signupA2),
      };
      const { error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: {
          display_name: displayName || email.split("@")[0],
          country: country.trim() || null,
          city: city.trim() || null,
          security_salt: salt,
          security_answers: securityAnswers,
        } },
      });
      if (err) { setError(err.message); }
      else {
        await savePinVault(email, password, signupPin, [SECURITY_QUESTIONS[0].id, SECURITY_QUESTIONS[1].id], [signupA1, signupA2]);
        setSuccess("Account created! Check your email for a confirmation link, then sign in.");
      }
    } else {
      let loginEmail = email.trim();
      if (!loginEmail.includes("@")) {
        const resolved = await lookupEmail(loginEmail);
        if (!resolved) {
          setLoading(false);
          setError("Invalid login credentials");
          return;
        }
        loginEmail = resolved;
      }
      const { error: err } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      if (err) { setError(err.message); }
      else { router.replace(redirectTo); }
    }
    setLoading(false);
  };

  const handlePinSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !pinVault) return;
    if (vaultPin.length !== 6) { setError("Enter your 6-digit PIN"); return; }
    if (!vaultA1.trim() || !vaultA2.trim()) { setError("Answer both security questions"); return; }
    setError(""); setLoading(true);
    const unlocked = await unlockPinVault(vaultPin, [vaultA1, vaultA2]);
    if (!unlocked) {
      setLoading(false);
      setError("Incorrect PIN or answers");
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email: unlocked.email, password: unlocked.password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    router.replace(redirectTo);
  };

  const forgetDevice = () => {
    removePinVault();
    setPinVault(null);
    setVaultPin(""); setVaultA1(""); setVaultA2("");
    setTab("signin");
  };

  const exitRecovery = () => {
    setForgotMode(false); setRecoverStep("login"); setRecoverDone(false);
    setRecoverLogin(""); setRecoverA1(""); setRecoverA2("");
    setRecoverPassword(""); setRecoverConfirmPassword(""); setRecoverPin(""); setRecoverConfirmPin("");
    setError("");
  };

  const handleRecoverContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoverLogin.trim()) { setError("Enter your email or username"); return; }
    setError("");
    setRecoverStep("reset");
  };

  const handleRecoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError("Backend not configured. Copy .env.local.example to .env.local and fill in your Supabase credentials."); return; }

    if (!recoverA1.trim() || !recoverA2.trim()) { setError("Answer both security questions"); return; }
    if (recoverPassword.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (recoverPassword !== recoverConfirmPassword) { setError("Passwords do not match"); return; }
    if (recoverPin && (recoverPin.length !== 6 || recoverPin !== recoverConfirmPin)) { setError("PIN must be 6 digits and match"); return; }

    setError(""); setLoading(true);

    const { email: resolvedEmail, error: resetErr } = await resetPasswordWithAnswers(recoverLogin.trim(), {
      [SECURITY_QUESTIONS[0].id]: recoverA1,
      [SECURITY_QUESTIONS[1].id]: recoverA2,
    }, recoverPassword);

    if (resetErr || !resolvedEmail) {
      setLoading(false);
      setError(resetErr || "Could not reset your password");
      return;
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password: recoverPassword });

    if (recoverPin && recoverA1.trim() && recoverA2.trim()) {
      await savePinVault(resolvedEmail, recoverPassword, recoverPin, [SECURITY_QUESTIONS[0].id, SECURITY_QUESTIONS[1].id], [recoverA1, recoverA2]);
      setPinVault(getPinVault());
    }

    setLoading(false);
    if (signInErr) { setRecoverDone(true); return; }
    router.replace(redirectTo);
  };

  const input = "w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors";
  const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,166,35,0.15)", color: "#F0EAD6" };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: "#0B0907" }}>
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-1.5 text-sm mb-8 transition-colors" style={{ color: "#6B6354" }}>
          <ArrowLeft size={14} /> Back to Lekhsetu
        </Link>

        {/* Logo */}
        <div className="flex items-center mb-8">
          <img src="/logo-horizontal-dark.png" alt="Lekhsetu" className="h-9 w-auto" />
        </div>

        {forgotMode ? (
          <>
            <h2 className="font-display text-xl font-bold mb-1" style={{ color: "#F0EAD6" }}>Account recovery</h2>

            {recoverDone ? (
              <>
                <p className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 mb-6" style={{ background: "rgba(245,166,35,0.08)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.2)" }}>
                  <Sparkles size={12} /> Your password has been reset. Please sign in with your new password.
                </p>
                <button onClick={exitRecovery}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: "#F5A623", color: "#0B0907" }}>
                  Back to sign in
                </button>
              </>
            ) : recoverStep === "login" ? (
              <>
                <p className="text-xs mb-6" style={{ color: "#6B6354" }}>
                  Enter your email or username. You&apos;ll then answer your security questions to reset your password.
                </p>
                <form onSubmit={handleRecoverContinue} className="space-y-4">
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>Email or username</label>
                    <input
                      type="text" required value={recoverLogin} onChange={e => setRecoverLogin(e.target.value)}
                      placeholder="you@example.com or username"
                      className={input} style={inputStyle} />
                  </div>

                  {error && (
                    <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {error}
                    </p>
                  )}

                  <button type="submit"
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 mt-2"
                    style={{ background: "#F5A623", color: "#0B0907" }}>
                    Continue
                  </button>
                </form>
              </>
            ) : (
              <>
                <p className="text-xs mb-6" style={{ color: "#6B6354" }}>
                  Answer your security questions, then set a new password.
                </p>
                <form onSubmit={handleRecoverSubmit} className="space-y-4">
                  {SECURITY_QUESTIONS.map((q, i) => (
                    <div key={q.id}>
                      <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>{q.label}</label>
                      <input
                        type="text" required value={[recoverA1, recoverA2][i]}
                        onChange={e => [setRecoverA1, setRecoverA2][i](e.target.value)}
                        placeholder="Your answer"
                        className={input} style={inputStyle} />
                    </div>
                  ))}

                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>New password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"} required value={recoverPassword}
                        onChange={e => setRecoverPassword(e.target.value)}
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
                      type={showPw ? "text" : "password"} required value={recoverConfirmPassword}
                      onChange={e => setRecoverConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password" minLength={8}
                      className={input} style={inputStyle} />
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center gap-1.5 mb-3">
                      <KeyRound size={13} style={{ color: "#F5A623" }} />
                      <p className="text-xs font-medium" style={{ color: "#F0EAD6" }}>New PIN sign-in for this device (optional)</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>6-digit PIN</label>
                        <input
                          type="password" inputMode="numeric" value={recoverPin}
                          onChange={e => setRecoverPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="••••••" maxLength={6}
                          className={input} style={{ ...inputStyle, letterSpacing: "0.4em" }} />
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>Confirm PIN</label>
                        <input
                          type="password" inputMode="numeric" value={recoverConfirmPin}
                          onChange={e => setRecoverConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="••••••" maxLength={6}
                          className={input} style={{ ...inputStyle, letterSpacing: "0.4em" }} />
                      </div>
                    </div>
                    <p className="text-xs mt-2" style={{ color: "#3A3028" }}>
                      Requires answering security questions 1 and 2 above.
                    </p>
                  </div>

                  {error && (
                    <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                      {error}
                    </p>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
                    style={{ background: "#F5A623", color: "#0B0907" }}>
                    {loading ? "Please wait…" : "Reset password"}
                  </button>
                </form>
              </>
            )}

            <p className="text-xs text-center mt-6" style={{ color: "#3A3028" }}>
              <button onClick={exitRecovery} className="underline" style={{ color: "#6B6354" }}>
                Back to sign in
              </button>
            </p>
          </>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex mb-6 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,166,35,0.1)" }}>
              {(["signin", "signup"] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={tab === t
                    ? { background: "#F5A623", color: "#0B0907" }
                    : { color: "#6B6354" }}>
                  {t === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {tab === "pin" && pinVault ? (
              <form onSubmit={handlePinSignIn} className="space-y-4">
                <div className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(245,166,35,0.08)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.2)" }}>
                  <KeyRound size={12} /> Signing in as {pinVault.email} on this device
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>6-digit PIN</label>
                  <input
                    type="password" inputMode="numeric" required value={vaultPin}
                    onChange={e => setVaultPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••" maxLength={6}
                    className={input} style={inputStyle} />
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>
                    {SECURITY_QUESTIONS.find(q => q.id === pinVault.questionIds[0])?.label}
                  </label>
                  <input
                    type="text" required value={vaultA1} onChange={e => setVaultA1(e.target.value)}
                    className={input} style={inputStyle} />
                </div>

                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>
                    {SECURITY_QUESTIONS.find(q => q.id === pinVault.questionIds[1])?.label}
                  </label>
                  <input
                    type="text" required value={vaultA2} onChange={e => setVaultA2(e.target.value)}
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
                  {loading ? "Please wait…" : "Sign In with PIN"}
                </button>

                <p className="text-xs text-center" style={{ color: "#3A3028" }}>
                  <button type="button" onClick={() => { setTab("signin"); setError(""); }} className="underline" style={{ color: "#6B6354" }}>
                    Use email & password instead
                  </button>
                  {" · "}
                  <button type="button" onClick={forgetDevice} className="underline" style={{ color: "#6B6354" }}>
                    Forget this device
                  </button>
                </p>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "signup" && (
                <>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>Your name</label>
                    <input
                      type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                      placeholder="How you'll appear to readers"
                      className={input} style={inputStyle} />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>Country</label>
                      <input
                        type="text" value={country} onChange={e => setCountry(e.target.value)}
                        placeholder="e.g. India"
                        className={input} style={inputStyle} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>City</label>
                      <input
                        type="text" value={city} onChange={e => setCity(e.target.value)}
                        placeholder="e.g. Bengaluru"
                        className={input} style={inputStyle} />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>
                  {tab === "signup" ? "Email address" : "Email or username"}
                </label>
                <input
                  type={tab === "signup" ? "email" : "text"} required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={tab === "signup" ? "you@example.com" : "you@example.com or username"}
                  className={input} style={inputStyle} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs" style={{ color: "#6B6354" }}>Password</label>
                  {tab === "signin" && (
                    <button type="button" onClick={() => { setForgotMode(true); setError(""); setSuccess(""); }}
                      className="text-xs underline" style={{ color: "#6B6354" }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"} required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={tab === "signup" ? "Min 8 characters" : "Your password"}
                    minLength={tab === "signup" ? 8 : undefined}
                    className={`${input} pr-10`} style={inputStyle} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "#6B6354" }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {tab === "signup" && (
                <>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>Confirm password</label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"} required value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password" minLength={8}
                        className={`${input} pr-10`} style={inputStyle} />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "#6B6354" }}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center gap-1.5 mb-3">
                      <KeyRound size={13} style={{ color: "#F5A623" }} />
                      <p className="text-xs font-medium" style={{ color: "#F0EAD6" }}>Set up PIN sign-in for this device</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>6-digit PIN</label>
                        <input
                          type="password" inputMode="numeric" required value={signupPin}
                          onChange={e => setSignupPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="••••••" maxLength={6}
                          className={input} style={{ ...inputStyle, letterSpacing: "0.4em" }} />
                      </div>
                      <div>
                        <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>Confirm PIN</label>
                        <input
                          type="password" inputMode="numeric" required value={signupConfirmPin}
                          onChange={e => setSignupConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          placeholder="••••••" maxLength={6}
                          className={input} style={{ ...inputStyle, letterSpacing: "0.4em" }} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {SECURITY_QUESTIONS.map((q, i) => (
                        <div key={q.id}>
                          <label className="block text-xs mb-1.5" style={{ color: "#6B6354" }}>{q.label}</label>
                          <input
                            type="text" required value={[signupA1, signupA2][i]}
                            onChange={e => [setSignupA1, setSignupA2][i](e.target.value)}
                            placeholder="Your answer"
                            className={input} style={inputStyle} />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs mt-2" style={{ color: "#3A3028" }}>
                      Used for PIN sign-in on this device and to recover your account if you forget your password.
                    </p>
                  </div>
                </>
              )}

              {error && (
                <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ background: "rgba(245,166,35,0.08)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.2)" }}>
                  <Sparkles size={12} /> {success}
                </p>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 mt-2"
                style={{ background: "#F5A623", color: "#0B0907" }}>
                {loading ? "Please wait…" : tab === "signin" ? "Sign In" : "Create Account"}
              </button>

              {tab === "signin" && pinVault && (
                <button type="button" onClick={() => { setTab("pin"); setError(""); }}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 flex items-center justify-center gap-1.5"
                  style={{ background: "rgba(245,166,35,0.08)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.2)" }}>
                  <KeyRound size={14} /> Sign in with PIN
                </button>
              )}
            </form>
            )}

            <p className="text-xs text-center mt-6" style={{ color: "#3A3028" }}>
              {tab === "signup" ? (
                <>Already have one? <button onClick={() => setTab("signin")} className="underline" style={{ color: "#6B6354" }}>Sign in</button></>
              ) : (
                <>No account? <button onClick={() => setTab("signup")} className="underline" style={{ color: "#6B6354" }}>Sign up free</button></>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0907" }}>
        <div className="w-6 h-6 rounded-full border-2 border-gold animate-spin" style={{ borderTopColor: "transparent" }} />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
