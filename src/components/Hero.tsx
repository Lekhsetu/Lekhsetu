"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { fetchCommunityStats } from "@/services/stories";

const FLOATERS = [
  { text: "लिखें",    x: "5%",  y: "20%", s: "text-4xl",  d: "0s",   depth: 0.028, fdur: 7,  fdel: 0   },
  { text: "ಬರೆಯಿರಿ", x: "81%", y: "17%", s: "text-3xl",  d: "1.5s", depth: 0.045, fdur: 9,  fdel: 2   },
  { text: "लिहा",    x: "70%", y: "34%", s: "text-2xl",  d: "0.7s", depth: 0.022, fdur: 11, fdel: 4   },
  { text: "എഴുതൂ",  x: "4%",  y: "62%", s: "text-xl",   d: "2.1s", depth: 0.032, fdur: 8,  fdel: 1   },
  { text: "Write",   x: "75%", y: "62%", s: "text-2xl",  d: "2s",   depth: 0.038, fdur: 10, fdel: 3   },
  { text: "कहानी",  x: "13%", y: "50%", s: "text-xl",   d: "0.9s", depth: 0.018, fdur: 12, fdel: 5   },
  { text: "ಕಥೆ",    x: "57%", y: "78%", s: "text-2xl",  d: "1.3s", depth: 0.028, fdur: 7,  fdel: 6   },
  { text: "आत्मकथा",x: "87%", y: "44%", s: "text-lg",   d: "2.5s", depth: 0.022, fdur: 9,  fdel: 2.5 },
  { text: "കഥ",     x: "43%", y: "87%", s: "text-xl",   d: "1.8s", depth: 0.018, fdur: 11, fdel: 7   },
  { text: "story",  x: "8%",  y: "83%", s: "text-base", d: "1.2s", depth: 0.014, fdur: 8,  fdel: 4.5 },
  { text: "voice",  x: "67%", y: "85%", s: "text-base", d: "0.5s", depth: 0.018, fdur: 13, fdel: 1.5 },
  { text: "गोष्ट",  x: "29%", y: "9%",  s: "text-xl",   d: "1.6s", depth: 0.026, fdur: 6,  fdel: 3.5 },
];

const TYPEWRITER_WORDS = [
  "लिखें", "Write", "ಬರೆಯಿರಿ", "लिहा", "എഴുതൂ",
];

const SCRIPTS = [
  "Write", "लिखें", "ಬರೆಯಿರಿ", "लिहा", "എഴുതൂ",
  "story", "कहानी", "ಕಥೆ", "गोष्ट", "കഥ",
];

// Round to 4dp — prevents floating-point divergence between Node.js (server)
// and browser V8 (client) when computing trig coordinates at module init time.
// Without this, Math.cos/sin produce subtly different last-digit floats across
// runtimes, causing React 19's hydration mismatch warning on SVG attributes.
const p4 = (n: number) => parseFloat(n.toFixed(4));

// Outer mandala ring: 16 spoke lines at 22.5° steps, 8 accent dots at 45° steps
const MANDALA_OUTER_SPOKES = Array.from({ length: 16 }, (_, i) => {
  const a = (i * 22.5) * Math.PI / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return { x1: p4(320 + c * 223), y1: p4(320 + s * 223), x2: p4(320 + c * 305), y2: p4(320 + s * 305) };
});
const MANDALA_OUTER_DOTS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * 45) * Math.PI / 180;
  return { cx: p4(320 + Math.cos(a) * 262), cy: p4(320 + Math.sin(a) * 262) };
});

// Inner counter-rotating ring: 12 accent dots at 30° steps, 6 spoke lines at 60° steps offset by 30°
const MANDALA_INNER_DOTS = Array.from({ length: 12 }, (_, i) => {
  const a = (i * 30) * Math.PI / 180;
  return { cx: p4(195 + Math.cos(a) * 160), cy: p4(195 + Math.sin(a) * 160) };
});
const MANDALA_INNER_SPOKES = Array.from({ length: 6 }, (_, i) => {
  const a = (i * 60 + 30) * Math.PI / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return { x1: p4(195 + c * 140), y1: p4(195 + s * 140), x2: p4(195 + c * 178), y2: p4(195 + s * 178) };
});

/* ── Stat counter that counts up when it enters the viewport ── */
function StatCounter({ val, label }: { val: string | number | null; label: string }) {
  const spanRef  = useRef<HTMLSpanElement>(null);
  const started  = useRef(false);
  const isNumber = typeof val === "number" && val > 0;

  useEffect(() => {
    if (!isNumber) return;
    const el = spanRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      obs.disconnect();
      const dur = 1400;
      const t0  = performance.now();
      const go  = (now: number) => {
        const p    = Math.min(1, (now - t0) / dur);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round((val as number) * ease).toString();
        if (p < 1) requestAnimationFrame(go);
      };
      requestAnimationFrame(go);
    }, { threshold: 0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [val, isNumber]);

  const display = val === null ? "-" : val.toString();
  return (
    <div className="text-center">
      <div className="font-display text-3xl font-bold" style={{ color: "#F5A623" }}>
        <span ref={spanRef}>{isNumber ? "0" : display}</span>
      </div>
      <div className="text-xs tracking-widest uppercase mt-1" style={{ color: "#6B6354" }}>{label}</div>
    </div>
  );
}

export default function Hero() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const floaterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [storyCount, setStoryCount] = useState<number | null>(null);

  /* Typewriter state */
  const [displayed, setDisplayed] = useState("");
  const [wordIdx,   setWordIdx]   = useState(0);
  const [phase,     setPhase]     = useState<"typing" | "deleting">("typing");

  /* ── Story count ── */
  useEffect(() => {
    fetchCommunityStats().then(({ storyCount: count }) => setStoryCount(count));
  }, []);

  /* ── Typewriter ── */
  useEffect(() => {
    const word = TYPEWRITER_WORDS[wordIdx];
    if (phase === "typing") {
      if (displayed.length < word.length) {
        const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 110);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("deleting"), 1800);
      return () => clearTimeout(t);
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(d => d.slice(0, -1)), 55);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => {
        setWordIdx(i => (i + 1) % TYPEWRITER_WORDS.length);
        setPhase("typing");
      }, 0);
      return () => clearTimeout(t);
    }
  }, [displayed, phase, wordIdx]);

  /* ── Mouse parallax ── */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const cx = window.innerWidth  / 2;
      const cy = window.innerHeight / 2;
      floaterRefs.current.forEach((el, i) => {
        if (!el) return;
        const dep = FLOATERS[i].depth;
        el.style.transform = `translate(${(e.clientX - cx) * dep}px, ${(e.clientY - cy) * dep}px)`;
      });
    };
    window.addEventListener("mousemove", fn, { passive: true });
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  /* ── Canvas: ink blobs + ember particles ── */
  useEffect(() => {
    const cv  = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    /* Breathing ink blobs */
    const blobs = Array.from({ length: 6 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 110 + 60,
      phase: Math.random() * Math.PI * 2,
      freq: Math.random() * 0.006 + 0.003,
    }));

    /* Ember particles — float upward like fire embers */
    const embers = Array.from({ length: 50 }, () => ({
      x:         Math.random() * window.innerWidth,
      y:         Math.random() * window.innerHeight,
      vx:        (Math.random() - 0.5) * 0.25,
      vy:        -(Math.random() * 0.55 + 0.2),
      r:         Math.random() * 1.3 + 0.4,
      o:         Math.random() * 0.32 + 0.1,
      life:      Math.random(),
      lifeSpeed: Math.random() * 0.004 + 0.0018,
      drift:     Math.random() * Math.PI * 2,
    }));

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);

      /* Blobs */
      blobs.forEach(b => {
        b.phase += b.freq;
        b.x += b.vx; b.y += b.vy;
        if (b.x < -200) b.x = cv.width + 200;
        if (b.x > cv.width + 200) b.x = -200;
        if (b.y < -200) b.y = cv.height + 200;
        if (b.y > cv.height + 200) b.y = -200;
        const r = b.r * (1 + Math.sin(b.phase) * 0.12);
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
        g.addColorStop(0, "rgba(245,150,20,0.048)");
        g.addColorStop(0.5, "rgba(245,166,35,0.02)");
        g.addColorStop(1, "rgba(245,166,35,0)");
        ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
      });

      /* Embers */
      embers.forEach(e => {
        e.life += e.lifeSpeed;
        if (e.life >= 1) {
          e.life  = 0;
          e.x     = Math.random() * cv.width;
          e.y     = cv.height + 10;
          e.vx    = (Math.random() - 0.5) * 0.25;
          e.vy    = -(Math.random() * 0.55 + 0.2);
          e.drift = Math.random() * Math.PI * 2;
        }
        e.drift += 0.025;
        e.x += e.vx + Math.sin(e.drift) * 0.18;
        e.y += e.vy;
        const t   = e.life;
        const env = t < 0.18 ? t / 0.18 : t > 0.72 ? 1 - (t - 0.72) / 0.28 : 1;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,166,35,${e.o * env})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  /* Ripple on CTA click */
  const handleRipple = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const btn  = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const sz   = Math.max(rect.width, rect.height) / 3;
    const rip  = document.createElement("span");
    rip.style.cssText = `
      position:absolute;border-radius:50%;
      width:${sz}px;height:${sz}px;
      left:${e.clientX - rect.left}px;top:${e.clientY - rect.top}px;
      transform:translate(-50%,-50%) scale(0);
      background:rgba(255,255,255,0.32);
      animation:rippleOut 0.55s ease-out forwards;
      pointer-events:none;z-index:2;
    `;
    btn.appendChild(rip);
    setTimeout(() => rip.remove(), 600);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 22% 48%, #1a0a00 0%, #0d0500 42%, #000000 100%)" }}>

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" suppressHydrationWarning />

      {/* Rangoli dot grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(245,166,35,0.07) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          opacity: 0.22,
        }} />

      {/* Outer mandala ring */}
      <div className="absolute top-1/2 left-1/2 pointer-events-none hidden md:block"
        style={{ transform: "translate(-50%, -58%)", width: 640, height: 640 }}>
        <svg viewBox="0 0 640 640" className="w-full h-full"
          style={{ animation: "mandalaSpin 75s linear infinite", opacity: 0.055 }}>
          <circle cx="320" cy="320" r="305" stroke="#F5A623" strokeWidth="1" fill="none" strokeDasharray="3 9" />
          <circle cx="320" cy="320" r="262" stroke="#F5A623" strokeWidth="0.5" fill="none" strokeDasharray="1 8" />
          <circle cx="320" cy="320" r="220" stroke="#F5A623" strokeWidth="1" fill="none" strokeDasharray="6 14" />
          {MANDALA_OUTER_SPOKES.map(({ x1, y1, x2, y2 }, i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F5A623" strokeWidth="0.5" />
          ))}
          {MANDALA_OUTER_DOTS.map(({ cx, cy }, i) => (
            <circle key={i} cx={cx} cy={cy} r="3.5" fill="#F5A623" opacity="0.55" />
          ))}
        </svg>
      </div>

      {/* Inner counter-rotating ring */}
      <div className="absolute top-1/2 left-1/2 pointer-events-none hidden md:block"
        style={{ transform: "translate(-50%, -58%)", width: 390, height: 390 }}>
        <svg viewBox="0 0 390 390" className="w-full h-full"
          style={{ animation: "mandalaSpin 48s linear infinite reverse", opacity: 0.045 }}>
          <circle cx="195" cy="195" r="180" stroke="#F5A623" strokeWidth="1" fill="none" strokeDasharray="8 18" />
          {MANDALA_INNER_DOTS.map(({ cx, cy }, i) => (
            <circle key={i} cx={cx} cy={cy} r="2.2" fill="#F5A623" opacity="0.5" />
          ))}
          {MANDALA_INNER_SPOKES.map(({ x1, y1, x2, y2 }, i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F5A623" strokeWidth="0.8" opacity="0.6" />
          ))}
        </svg>
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full anim-breathe"
          style={{ background: "radial-gradient(circle,rgba(245,166,35,0.05) 0%,transparent 70%)" }} />
      </div>

      {/* Floating script words — parallax + hover glow + random fade */}
      {FLOATERS.map((f, i) => (
        <div key={i}
          ref={el => { floaterRefs.current[i] = el; }}
          className={`absolute ${i >= 9 ? "hidden lg:block" : "hidden sm:block"}`}
          style={{
            left: f.x, top: f.y,
            transition: "transform 0.14s linear",
            willChange: "transform",
            animation: `floaterFade ${f.fdur}s ease-in-out ${f.fdel}s infinite`,
          }}>
          <span
            className={`font-display ${f.s} select-none anim-float-drift`}
            style={{
              animationDelay: f.d,
              color: "rgba(176,162,130,0.14)",
              fontStyle: "italic",
              display: "block",
              transition: "color 0.4s ease, text-shadow 0.4s ease",
              cursor: "default",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "rgba(245,166,35,0.65)";
              el.style.textShadow = "0 0 22px rgba(245,166,35,0.35)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "rgba(176,162,130,0.14)";
              el.style.textShadow = "none";
            }}>
            {f.text}
          </span>
        </div>
      ))}

      {/* ─── Main content ─── */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6 pt-20 pb-16 sm:pb-24">

        {/* Badge */}
        <div className="anim-stamp inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{ border: "1px solid rgba(245,166,35,0.25)", background: "rgba(245,166,35,0.07)" }}>
          <Sparkles size={11} style={{ color: "#F5A623" }} />
          <span className="text-xs tracking-widest uppercase" style={{ color: "#F5A623" }}>
            Your story belongs here
          </span>
        </div>

        {/* Typewriter — "write" in every language */}
        <div className="anim-fade-up delay-200 flex items-center justify-center mb-5" style={{ minHeight: "4.5rem" }}>
          <span className="font-display font-black inline-flex items-center"
            style={{ fontSize: "clamp(2.4rem,5.5vw,4.4rem)", color: "#F5A623", letterSpacing: "-0.02em" }}>
            {displayed}
            <span className="anim-blink inline-block align-middle rounded-sm"
              style={{ width: "3px", height: "0.82em", background: "#F5A623", marginLeft: "3px" }} />
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-display leading-none mb-6">
          <span className="block text-5xl md:text-7xl lg:text-8xl font-black text-cream"
            style={{ letterSpacing: "-0.02em" }}>
            <span className="anim-word" style={{ animationDelay: "300ms" }}>Your story</span>
          </span>
          <span className="block" style={{ letterSpacing: "-0.02em" }}>
            <span className="relative inline-block" style={{ overflow: "visible" }}>
              <span className="anim-word text-5xl md:text-7xl lg:text-8xl font-black shimmer"
                style={{ animationDelay: "450ms" }}>
                needs to be told.
              </span>
              <svg viewBox="0 0 520 14"
                style={{
                  position: "absolute", bottom: "-6px", left: 0,
                  width: "100%", height: "14px", overflow: "visible",
                  pointerEvents: "none",
                }}>
                <path d="M2 9 Q90 3 180 8 Q270 13 360 8 Q440 3 518 7"
                  stroke="#F5A623" strokeWidth="2.5" fill="none" strokeLinecap="round"
                  style={{
                    strokeDasharray: 540,
                    strokeDashoffset: 540,
                    animation: "drawUnderlinePath 1.2s ease-out 1.15s forwards",
                    opacity: 0.65,
                  }} />
              </svg>
            </span>
          </span>
        </h1>

        <p className="anim-fade-up delay-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4"
          style={{ color: "#B8AE98", fontWeight: 300 }}>
          The first job that broke you. The failure nobody saw. The comeback that surprised even you.
        </p>
        <p className="anim-fade-up delay-500 text-base max-w-xl mx-auto leading-relaxed mb-10"
          style={{ color: "#6B6354" }}>
          Write it in Hindi, Kannada, Marathi, Malayalam whatever language you actually think in.
          Someone out there is waiting to read exactly what you lived through.
        </p>

        {/* CTA buttons */}
        <div className="anim-fade-up delay-600 flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link href="/write"
            className="btn-shimmer btn-cta-pulse flex items-center gap-2 text-ink font-semibold px-8 py-4 rounded-full text-base transition-all duration-200 hover:scale-105 active:scale-95 w-full sm:w-auto justify-center"
            style={{ background: "#F5A623", position: "relative", overflow: "hidden" }}
            onClick={handleRipple}>
            Write your story free
            <ArrowRight size={16} />
          </Link>
          <Link href="/explore"
            className="flex items-center gap-2 text-cream-dim hover:text-cream px-8 py-4 rounded-full text-base transition-all w-full sm:w-auto justify-center"
            style={{ border: "1px solid rgba(245,166,35,0.2)" }}>
            Read stories
          </Link>
        </div>

        {/* World-scripts scrolling strip */}
        <div className="anim-fade-up overflow-hidden w-full mb-10"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}>
          <div className="flex"
            style={{ animation: "scriptDrift 44s linear infinite", width: "max-content", willChange: "transform" }}>
            {[...SCRIPTS, ...SCRIPTS].map((s, i) => (
              <span key={i} className="font-display text-sm italic flex-shrink-0 px-3"
                style={{ color: `rgba(176,162,130,${i % 3 === 0 ? 0.38 : i % 3 === 1 ? 0.22 : 0.3})` }}>
                {s}
                <span className="mx-2" style={{ color: "rgba(245,166,35,0.2)" }}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* Stats — count up on scroll into view */}
        <div className="anim-fade-up delay-700 flex items-center justify-center gap-8 sm:gap-16 flex-wrap">
          <StatCounter val={storyCount} label="Stories Published" />
          <StatCounter val="5" label="Languages" />
          <StatCounter val="Free" label="Always Free to Read" />
        </div>
      </div>

      {/* Ink-drip scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none anim-fade-in delay-800">
        <div className="w-0.5 h-16 relative overflow-hidden rounded-full"
          style={{ background: "rgba(245,166,35,0.1)" }}>
          <div className="absolute top-0 left-0 right-0 rounded-full anim-ink-drip"
            style={{ height: "44%", background: "linear-gradient(to bottom, rgba(245,166,35,0.75), rgba(245,166,35,0.1))" }} />
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
        style={{ background: "linear-gradient(to bottom,transparent,#000)" }} />
    </section>
  );
}
