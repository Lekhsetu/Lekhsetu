"use client";
import { useEffect, useRef, useState } from "react";
import { Briefcase, Brain, Heart, TrendingUp, Globe, Lightbulb } from "lucide-react";
import { fetchCategoryCounts } from "@/services/stories";

const CATS = [
  { icon: Briefcase,  label: "Career",    desc: "Job hunts, pivots, promotions, side hustles",     c: "#5BA3E0",
    ids: ["career", "job", "firstjob", "layoff", "entrepreneurship", "startup", "success", "failure"] },
  { icon: Brain,      label: "Growth",    desc: "Lessons learned the hard way — exams, skills, comebacks",    c: "#F5A623",
    ids: ["knowledge", "tech", "education", "exams", "studentlife", "books", "history", "science"] },
  { icon: Heart,      label: "Life",      desc: "Relationships, health, personal growth, grief",   c: "#F87171",
    ids: ["life", "health", "relationships", "family", "love", "friendship", "heartbreak", "marriage",
          "parenting", "mentalhealth", "motivation", "selfimprovement", "confessions", "nostalgia", "women", "lgbtq"] },
  { icon: TrendingUp, label: "Money",     desc: "Finance, investing, wealth from zero",            c: "#6DBF67",
    ids: ["finance"] },
  { icon: Globe,      label: "World",     desc: "Travel, culture, global perspectives",            c: "#C084FC",
    ids: ["travel", "immigration", "culture", "army", "nature", "socialissues", "politics", "smalltown"] },
  { icon: Lightbulb,  label: "Ideas",     desc: "Startups, creativity, experiments",               c: "#FCD34D",
    ids: ["spirituality", "sports", "art", "music", "writing", "cinema", "food", "fashion", "fiction"] },
];

function formatCount(n: number): string {
  if (n <= 0) return "New";
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export default function Categories() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchCategoryCounts().then(setCounts);
  }, []);

  /* Scroll reveal */
  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = "0";
      el.style.transform = "translateY(18px)";
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            el.style.transition = "opacity 0.55s ease, transform 0.55s ease";
          }, i * 75);
          obs.disconnect();
        }
      }, { threshold: 0.08 });
      obs.observe(el);
      return () => obs.disconnect();
    });
  }, []);

  return (
    <section id="knowledge" className="py-24" style={{ background: "#0E0B07" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-rule w-10" />
          <span className="text-xs tracking-widest uppercase" style={{ color: "#F5A623" }}>Explore</span>
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-bold text-cream mb-3">
          What are you<br /><span className="italic" style={{ color: "#6B6354" }}>going through?</span>
        </h2>
        <p className="text-base mb-14 max-w-lg" style={{ color: "#6B6354", fontWeight: 300 }}>
          Real first jobs, layoffs, heartbreaks, and comebacks, organized around what you&apos;re living through, not what&apos;s trending.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATS.map((cat, i) => {
            const total = cat.ids.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
            return (
            <div
              key={cat.label}
              ref={el => { refs.current[i] = el; }}
              className="relative rounded-2xl p-6 cursor-pointer group overflow-hidden"
              style={{
                border: `1px solid ${cat.c}18`,
                background: `${cat.c}06`,
                transition: "border-color 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={e => {
                const card = e.currentTarget;
                const fill = card.querySelector<HTMLElement>(".liquid-fill");
                if (fill) fill.style.transform = "scaleY(1)";
                card.style.borderColor = `${cat.c}45`;
                card.style.boxShadow  = `0 14px 44px ${cat.c}18, inset 0 0 0 1px ${cat.c}28`;
              }}
              onMouseLeave={e => {
                const card = e.currentTarget;
                const fill = card.querySelector<HTMLElement>(".liquid-fill");
                if (fill) fill.style.transform = "scaleY(0)";
                card.style.borderColor = `${cat.c}18`;
                card.style.boxShadow  = "";
              }}
            >
              {/* Liquid fill — rises from bottom */}
              <div
                className="liquid-fill absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: `linear-gradient(to top, ${cat.c}1C, ${cat.c}0A 60%, transparent)`,
                  transform: "scaleY(0)",
                  transformOrigin: "bottom",
                  transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              />

              {/* Content sits above fill */}
              <div className="relative z-10">
                <div
                  className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                  style={{ background: `${cat.c}15` }}>
                  <cat.icon size={20} style={{ color: cat.c }} />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-lg font-semibold text-cream">{cat.label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ color: cat.c, background: `${cat.c}12` }}>
                    {formatCount(total)}{total > 0 ? " stories" : ""}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#6B6354" }}>{cat.desc}</p>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
