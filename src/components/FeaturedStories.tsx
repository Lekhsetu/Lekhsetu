"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Clock, ArrowUpRight, PenLine } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchFeed, localizeStories, dedupeTranslations } from "@/services/stories";
import { useAuth } from "@/contexts/AuthContext";
import type { Story } from "@/types";
import { CATEGORIES } from "@/constants";
import { getPreferredLanguage } from "@/utils/geo";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m || 1}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function Card({ story, delay }: { story: Story; delay: number }) {
  const revealRef  = useRef<HTMLDivElement>(null);
  const tiltRef    = useRef<HTMLDivElement>(null);
  const cat = CATEGORIES.find(c => c.id === story.category);
  const isLarge = delay === 0;

  /* Scroll reveal */
  useEffect(() => {
    const el = revealRef.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(22px)";
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setTimeout(() => {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          el.style.transition = "opacity 0.65s ease, transform 0.65s ease";
        }, delay);
        obs.disconnect();
      }
    }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  /* 3-D tilt on mouse move */
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = tiltRef.current;
    if (!el) return;
    const r  = el.getBoundingClientRect();
    const x  = (e.clientX - r.left  - r.width  / 2) / (r.width  / 2);
    const y  = (e.clientY - r.top   - r.height / 2) / (r.height / 2);
    el.style.transform  = `perspective(900px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.01) translateY(-4px)`;
    el.style.transition = "transform 0.1s linear";
    el.style.boxShadow  = `0 20px 50px rgba(0,0,0,0.55), 0 0 30px ${cat?.color ?? "#F5A623"}18`;
    el.style.borderColor = `rgba(255,200,50,0.32)`;
    const gloss = el.querySelector<HTMLElement>(".card-gloss");
    if (gloss) {
      gloss.style.opacity = "1";
      gloss.style.background = `radial-gradient(circle at ${(x + 1) * 50}% ${(y + 1) * 50}%, rgba(255,255,255,0.07) 0%, transparent 62%)`;
    }
  };

  const handleLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform   = "perspective(900px) rotateY(0deg) rotateX(0deg) scale(1) translateY(0)";
    el.style.transition  = "transform 0.55s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s ease, border-color 0.4s ease";
    el.style.boxShadow   = "";
    el.style.borderColor = "rgba(255,255,255,0.06)";
    const gloss = el.querySelector<HTMLElement>(".card-gloss");
    if (gloss) { gloss.style.opacity = "0"; gloss.style.background = "none"; }
  };

  return (
    <div ref={revealRef} onMouseMove={handleMove} onMouseLeave={handleLeave} data-cursor="card">
      <Link href={`/story/${story.id}`}>
        <div ref={tiltRef}
          className={`card-paper relative rounded-2xl overflow-hidden cursor-pointer group h-full ${isLarge ? "md:row-span-2" : ""}`}
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            background: `linear-gradient(135deg,${cat?.color ?? "#1a1a1a"}30 0%,rgba(16,10,4,0.97) 100%)`,
            transformStyle: "preserve-3d",
          }}>

          {/* Top colour accent */}
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg,transparent,${cat?.color ?? "#F5A623"}55,transparent)` }} />

          {/* Gloss overlay: follows cursor */}
          <div className="card-gloss absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200"
            style={{ opacity: 0 }} />

          <div className={`p-6 flex flex-col h-full ${isLarge ? "min-h-[280px]" : "min-h-[200px]"}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ color: cat?.color ?? "#F5A623", background: `${cat?.color ?? "#F5A623"}18`, border: `1px solid ${cat?.color ?? "#F5A623"}30` }}>
                {cat?.emoji} {cat?.label}
              </span>
              <span className="text-xs" style={{ color: "#6B6354" }}>{timeAgo(story.created_at)}</span>
              {story.language !== "en" && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#6B6354" }}>
                  {story.language.toUpperCase()}
                </span>
              )}
            </div>

            <h3 className={`font-display font-semibold text-cream group-hover:text-gold transition-colors leading-tight mb-3 flex-1 ${isLarge ? "text-xl md:text-2xl" : "text-base md:text-lg"}`}>
              {story.title}
            </h3>

            {story.excerpt && (
              <p className="text-sm leading-relaxed mb-5 line-clamp-2" style={{ color: "#6B6354" }}>
                {story.excerpt}
              </p>
            )}

            <div className="flex items-center justify-between pt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-2">
                {story.profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.profiles.avatar_url} alt={story.profiles?.display_name || "Anonymous"} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ background: `${cat?.color ?? "#F5A623"}20`, color: cat?.color ?? "#F5A623" }}>
                    {(story.profiles?.display_name || "Anonymous")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs" style={{ color: "#B8AE98" }}>
                  {story.profiles?.display_name || "Anonymous"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: "#6B6354" }}>
                <div className="flex items-center gap-1"><Clock size={10} /><span>{story.read_time} min</span></div>
                <ArrowUpRight size={13} className="group-hover:text-gold transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.15)" }}>
        <PenLine size={28} style={{ color: "#F5A623" }} />
      </div>
      <h3 className="font-display text-xl font-bold text-cream mb-2">Be the first to write</h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: "#6B6354" }}>
        No stories have been published yet. Your experience could be the first one.
      </p>
      <Link href="/write"
        className="font-semibold text-sm px-6 py-3 rounded-full transition-all hover:scale-105"
        style={{ background: "#F5A623", color: "#0B0907" }}>
        Write the first story
      </Link>
    </div>
  );
}

export default function FeaturedStories() {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }
    fetchFeed({ userId: user?.id, limit: 4 }).then(async data => {
      setStories(await localizeStories(dedupeTranslations(data), getPreferredLanguage()));
      setLoading(false);
    });
  }, [user?.id]);

  return (
    <section id="stories" className="py-24" style={{ background: "#0B0907" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-14">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-rule w-10" />
              <span className="text-xs tracking-widest uppercase" style={{ color: "#F5A623" }}>Real experiences</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-cream">
              Lives that read<br /><span className="italic" style={{ color: "#6B6354" }}>like your own</span>
            </h2>
          </div>
          <Link href="/explore" className="hidden md:flex items-center gap-2 text-sm group transition-colors"
            style={{ color: "#6B6354" }}>
            <span className="group-hover:text-gold transition-colors">All stories</span>
            <ArrowUpRight size={14} className="group-hover:text-gold transition-colors" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`skeleton rounded-2xl ${i === 0 ? "md:row-span-2" : ""}`}
                style={{ height: i === 0 ? 320 : 200, border: "1px solid rgba(255,255,255,0.04)" }}>
              </div>
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="grid grid-cols-1"><EmptyState /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ gridAutoRows: "minmax(200px,auto)" }}>
            {stories.map((s, i) => <Card key={s.id} story={s} delay={i * 100} />)}
          </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link href="/explore" className="text-sm" style={{ color: "#6B6354" }}>See all stories →</Link>
        </div>
      </div>
    </section>
  );
}
