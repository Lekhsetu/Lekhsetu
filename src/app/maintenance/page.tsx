"use client";

import { useEffect, useState } from "react";
import { PenTool, RefreshCw, Sparkles } from "lucide-react";

const FLOATERS = [
  { text: "जल्द",        x: "7%",  y: "16%", size: "text-3xl", fdur: 7,  fdel: 0   },
  { text: "ಶೀಘ್ರದಲ್ಲೇ", x: "80%", y: "12%", size: "text-2xl", fdur: 9,  fdel: 2   },
  { text: "लवकरच",      x: "84%", y: "70%", size: "text-2xl", fdur: 8,  fdel: 4   },
  { text: "ഉടൻ",         x: "6%",  y: "74%", size: "text-3xl", fdur: 11, fdel: 1   },
  { text: "soon",        x: "50%", y: "90%", size: "text-lg",  fdur: 10, fdel: 3   },
];

const RECHECK_SECONDS = 30;

export default function MaintenancePage() {
  const [secondsLeft, setSecondsLeft] = useState(RECHECK_SECONDS);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.location.reload();
          return RECHECK_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-ink px-6 py-16">
      {/* Ambient breathing glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full anim-breathe pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%)" }} />

      {/* Slow-spinning dashed rings */}
      <div className="absolute top-1/2 left-1/2 pointer-events-none hidden md:block"
        style={{ transform: "translate(-50%,-52%)", width: 560, height: 560 }}>
        <svg viewBox="0 0 560 560" className="w-full h-full" style={{ animation: "mandalaSpin 90s linear infinite", opacity: 0.06 }}>
          <circle cx="280" cy="280" r="260" stroke="#F5A623" strokeWidth="1" fill="none" strokeDasharray="2 10" />
          <circle cx="280" cy="280" r="220" stroke="#F5A623" strokeWidth="0.5" fill="none" strokeDasharray="6 16" />
        </svg>
      </div>

      {/* Floating "soon" in the site's languages */}
      {FLOATERS.map((f, i) => (
        <span key={i}
          className={`absolute font-display italic select-none hidden sm:block ${f.size}`}
          style={{
            left: f.x, top: f.y,
            color: "rgba(176,162,130,0.16)",
            animation: `floaterFade ${f.fdur}s ease-in-out ${f.fdel}s infinite, floatDrift 8s ease-in-out ${f.fdel * 0.5}s infinite`,
          }}>
          {f.text}
        </span>
      ))}

      {/* Main card */}
      <div className="relative z-10 text-center max-w-xl mx-auto anim-fade-scale">
        <div className="font-display text-3xl font-black anim-ink-bleed mb-10" style={{ letterSpacing: "-0.5px" }}>
          <span className="text-cream">Lekh</span><span className="text-gold">setu</span>
        </div>

        <div className="anim-stamp inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{ border: "1px solid rgba(245,166,35,0.25)", background: "rgba(245,166,35,0.07)" }}>
          <Sparkles size={11} className="text-gold" />
          <span className="text-xs tracking-widest uppercase text-gold">Scheduled Maintenance</span>
        </div>

        {/* Pen writing an ink trail */}
        <div className="relative w-16 h-16 mx-auto mb-8 flex items-center justify-center">
          <div style={{ animation: "penWrite 3.2s ease-in-out infinite" }}>
            <PenTool size={38} className="text-gold" strokeWidth={1.5} />
          </div>
          <svg width="96" height="24" viewBox="0 0 96 24" className="absolute -bottom-2 left-1/2 -translate-x-1/2" style={{ overflow: "visible" }}>
            <path d="M2 12 Q24 3 48 12 T94 12" stroke="#F5A623" strokeWidth="1.5" fill="none"
              strokeDasharray="120" style={{ animation: "inkTrail 3.2s ease-in-out infinite" }} />
          </svg>
        </div>

        <h1 className="font-display font-black leading-tight mb-5" style={{ fontSize: "clamp(2rem,5vw,3.2rem)" }}>
          <span className="block anim-word text-cream" style={{ animationDelay: "150ms" }}>We&apos;re rewriting</span>
          <span className="block anim-word shimmer" style={{ animationDelay: "320ms" }}>a few chapters.</span>
        </h1>

        <p className="anim-fade-up delay-400 text-base md:text-lg leading-relaxed mb-2" style={{ color: "#B8AE98", fontWeight: 300 }}>
          Lekhsetu is offline for a short while as we sharpen a few things behind the scenes.
        </p>
        <p className="anim-fade-up delay-500 text-sm md:text-base leading-relaxed mb-10 text-muted">
          Every story you left here is safe. We&apos;ll be back before you finish your chai.
        </p>

        <div className="anim-fade-up delay-600 w-full max-w-xs mx-auto h-1.5 rounded-full overflow-hidden mb-6"
          style={{ background: "rgba(245,166,35,0.1)" }}>
          <div className="h-full w-[30%] rounded-full"
            style={{ background: "linear-gradient(90deg, transparent, #F5A623, #FFD080, #F5A623, transparent)", animation: "progressSlide 1.7s ease-in-out infinite" }} />
        </div>

        <div className="anim-fade-up delay-700 flex flex-wrap items-center justify-center gap-3 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ border: "1px solid rgba(245,166,35,0.25)", background: "rgba(245,166,35,0.06)" }}>
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full anim-ping" style={{ background: "#F5A623" }} />
              <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: "#F5A623" }} />
            </span>
            <span className="text-xs font-semibold text-gold">Upgrade in progress</span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-cream-dim text-xs"
            style={{ border: "1px solid rgba(245,166,35,0.15)" }}>
            <RefreshCw size={12} className="text-gold" style={{ animation: "mandalaSpin 2s linear infinite" }} />
            Rechecking in {secondsLeft}s
          </div>
        </div>

        <div className="h-rule max-w-[220px] mx-auto mb-6" />

        <p className="anim-fade-in delay-800 text-xs text-cream-dim">
          Something urgent? Write to <span className="text-gold">support@lekhsetu.com</span>
        </p>
        <p className="anim-fade-in delay-800 text-xs mt-3" style={{ color: "#B5A898" }}>lekhsetu.com</p>
      </div>

      <style>{`
        @keyframes progressSlide {
          0%   { transform: translateX(-140%); }
          50%  { transform: translateX(180%); }
          100% { transform: translateX(-140%); }
        }
      `}</style>
    </main>
  );
}
