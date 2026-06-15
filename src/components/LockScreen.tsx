"use client";
import { useEffect, useState } from "react";
import { LogOut, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { hasPin, isUnlocked, markUnlocked, verifyPin } from "@/utils/pin";

export default function LockScreen() {
  const { user, profile, signOut } = useAuth();
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocked(!!user && hasPin(user.id) && !isUnlocked(user.id));
  }, [user]);

  if (!locked || !user) return null;

  const handleChange = async (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setPin(digits);
    setError("");
    if (digits.length === 6) {
      const ok = await verifyPin(user.id, digits);
      if (ok) {
        markUnlocked(user.id);
        setLocked(false);
      } else {
        setError("Incorrect PIN");
        setPin("");
      }
    }
  };

  const name = profile?.display_name || profile?.full_name || user.email?.split("@")[0] || "there";

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center px-4" style={{ background: "#0B0907" }}>
      <div className="w-full max-w-xs text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(245,166,35,0.12)", color: "#F5A623" }}>
          <Lock size={22} />
        </div>
        <h1 className="font-display text-xl font-bold mb-1" style={{ color: "#F0EAD6" }}>Welcome back, {name}</h1>
        <p className="text-xs mb-6" style={{ color: "#6B6354" }}>Enter your 6-digit PIN to continue</p>

        <input
          type="password" inputMode="numeric" autoFocus
          value={pin} onChange={e => handleChange(e.target.value)}
          maxLength={6}
          className="w-full text-center text-2xl tracking-[0.6em] px-4 py-3 rounded-xl focus:outline-none transition-colors"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,166,35,0.15)", color: "#F0EAD6" }}
        />

        {error && (
          <p className="text-xs mt-3" style={{ color: "#f87171" }}>{error}</p>
        )}

        <button onClick={() => signOut()}
          className="flex items-center gap-1.5 justify-center text-xs mt-6 mx-auto transition-colors"
          style={{ color: "#6B6354" }}>
          <LogOut size={12} /> Sign out instead
        </button>
      </div>
    </div>
  );
}
