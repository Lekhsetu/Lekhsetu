"use client";
import { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/profiles";
import { LANGUAGES } from "@/constants";
import {
  detectLocation, hasBeenPromptedForLocation, markLocationPrompted,
  setPreferredLanguage, getPreferredLanguage,
} from "@/utils/geo";

export default function GeoPrompt() {
  const { user, refreshProfile } = useAuth();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!hasBeenPromptedForLocation());
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    markLocationPrompted();
    setVisible(false);
  };

  const allow = async () => {
    setBusy(true);
    const loc = await detectLocation();
    if (loc) {
      if (loc.languageCode) setPreferredLanguage(loc.languageCode);
      if (user && (loc.country || loc.city || loc.languageCode)) {
        await updateProfile(user.id, {
          ...(loc.country ? { country: loc.country } : {}),
          ...(loc.city ? { city: loc.city } : {}),
          ...(loc.languageCode ? { preferred_language: loc.languageCode } : {}),
        });
        await refreshProfile();
      }
    }
    setBusy(false);
    dismiss();
  };

  const langLabel = LANGUAGES.find(l => l.code === getPreferredLanguage())?.native;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[9000] rounded-2xl p-4 shadow-2xl"
      style={{ background: "#1E1810", border: "1px solid rgba(245,166,35,0.2)" }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(245,166,35,0.12)", color: "#F5A623" }}>
          <MapPin size={16} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "#F0EAD6" }}>See stories in your language</p>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "#6B6354" }}>
            Allow location access and we&rsquo;ll show stories in your region&rsquo;s language
            {langLabel ? ` (${langLabel})` : ""} when available.
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={allow} disabled={busy}
              className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all disabled:opacity-50"
              style={{ background: "#F5A623", color: "#0B0907" }}>
              {busy ? "Detecting…" : "Allow location"}
            </button>
            <button onClick={dismiss}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{ border: "1px solid rgba(245,166,35,0.15)", color: "#6B6354" }}>
              Not now
            </button>
          </div>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" style={{ color: "#6B6354" }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
