"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, PenLine, ChevronLeft, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import StoryCard from "@/components/StoryCard";
import Navbar from "@/components/Navbar";
import TrendingSidebar from "@/components/TrendingSidebar";
import { supabase } from "@/lib/supabase";
import { fetchPublishedStories, fetchFeed, localizeStories, dedupeTranslations } from "@/services/stories";
import { getPreferredLanguage } from "@/utils/geo";
import { fetchClapTotalsBulk } from "@/services/reactions";
import { fetchCommentCountsBulk } from "@/services/comments";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES } from "@/constants";
import type { Story } from "@/types";

function ExploreContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [activeCat, setActiveCat] = useState<string | null>(searchParams.get("cat") ?? null);
  const [sort, setSort] = useState<"for-you" | "latest">("for-you");
  const [stories, setStories] = useState<Story[]>([]);
  const [clapTotals, setClapTotals] = useState<Record<string, number>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (el.scrollWidth <= el.clientWidth) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  const scrollByAmount = (amount: number) => {
    scrollerRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  };

  useEffect(() => {
    if (!supabase) {
      const t = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(t);
    }
    const request = sort === "for-you"
      ? fetchFeed({ userId: user?.id, category: activeCat })
      : fetchPublishedStories({ category: activeCat });

    request.then(async data => {
      let results: Story[] = await localizeStories(dedupeTranslations(data), getPreferredLanguage());
      if (query.trim()) {
        const lq = query.toLowerCase();
        results = results.filter((s: Story) =>
          s.title.toLowerCase().includes(lq) ||
          (s.excerpt ?? "").toLowerCase().includes(lq) ||
          (s.tags ?? []).some((t: string) => t.toLowerCase().includes(lq))
        );
      }
      setStories(results);
      setLoading(false);

      const ids = results.map(s => s.id);
      fetchClapTotalsBulk(ids).then(setClapTotals);
      fetchCommentCountsBulk(ids).then(setCommentCounts);
    });
  }, [activeCat, query, sort, user?.id]);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl font-black text-ink mb-2">Explore stories</h1>
          <p className="text-muted">Real first jobs, failures, heartbreaks, and comebacks — told by people who lived them.</p>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search stories, topics, or tags…"
            value={query}
            onChange={e => { setQuery(e.target.value); setLoading(true); }}
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-paper text-sm focus:outline-none transition-colors text-ink placeholder-muted"
          />
          {query && (
            <button onClick={() => { setQuery(""); setLoading(true); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink text-xs">
              Clear
            </button>
          )}
        </div>

        {/* Category filter – horizontal scroll with edge fades */}
        <div className="relative mb-8 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div ref={scrollerRef} onWheel={handleWheel} className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => { setActiveCat(null); setLoading(true); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                !activeCat ? "scale-105" : "hover:scale-105"
              }`}
              style={!activeCat
                ? { background: "#0B0907", color: "#FDFBF7", boxShadow: "0 6px 18px rgba(11,9,7,0.18)" }
                : { background: "rgba(11,9,7,0.04)", color: "#6B6354", border: "1px solid rgba(11,9,7,0.08)" }}>
              ✨ All
            </button>
            {CATEGORIES.map(cat => {
              const active = activeCat === cat.id;
              return (
                <button key={cat.id} onClick={() => { setActiveCat(active ? null : cat.id); setLoading(true); }}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    active ? "scale-105" : "hover:scale-105"
                  }`}
                  style={active
                    ? { background: cat.color, color: "#fff", boxShadow: `0 6px 18px ${cat.color}40` }
                    : { background: `${cat.color}12`, color: cat.color, border: `1px solid ${cat.color}22` }}>
                  <span>{cat.emoji}</span> {cat.label}
                </button>
              );
            })}
          </div>
          {/* Edge fades */}
          <div className="absolute top-0 bottom-2 left-0 w-8 pointer-events-none" style={{ background: "linear-gradient(to right, #FDFBF7, transparent)" }} />
          <div className="absolute top-0 bottom-2 right-0 w-8 pointer-events-none" style={{ background: "linear-gradient(to left, #FDFBF7, transparent)" }} />
          {/* Scroll arrows */}
          <button onClick={() => scrollByAmount(-240)} aria-label="Scroll categories left"
            className="hidden sm:flex items-center justify-center absolute left-1 -translate-y-1/2 w-7 h-7 rounded-full transition-transform hover:scale-110"
            style={{ top: "calc(50% - 4px)", background: "#FDFBF7", border: "1px solid rgba(11,9,7,0.08)", color: "#6B6354", boxShadow: "0 4px 10px rgba(11,9,7,0.08)" }}>
            <ChevronLeft size={15} />
          </button>
          <button onClick={() => scrollByAmount(240)} aria-label="Scroll categories right"
            className="hidden sm:flex items-center justify-center absolute right-1 -translate-y-1/2 w-7 h-7 rounded-full transition-transform hover:scale-110"
            style={{ top: "calc(50% - 4px)", background: "#FDFBF7", border: "1px solid rgba(11,9,7,0.08)", color: "#6B6354", boxShadow: "0 4px 10px rgba(11,9,7,0.08)" }}>
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          <div>
            <div className="flex items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-muted" />
                <span className="text-sm text-muted">
                  {loading ? "Loading…" : `${stories.length} ${stories.length === 1 ? "story" : "stories"}`}
                </span>
              </div>
              <div className="flex items-center gap-1 p-1 rounded-full" style={{ background: "rgba(11,9,7,0.04)", border: "1px solid rgba(11,9,7,0.08)" }}>
                {(["for-you", "latest"] as const).map(opt => (
                  <button key={opt} onClick={() => { if (sort !== opt) { setSort(opt); setLoading(true); } }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                    style={sort === opt
                      ? { background: "#0B0907", color: "#FDFBF7" }
                      : { color: "#6B6354" }}>
                    {opt === "for-you" ? "For You" : "Latest"}
                  </button>
                ))}
              </div>
            </div>

            {sort === "for-you" && !loading && stories.length > 0 && (
              <div className="flex items-center gap-2 mb-5 text-xs font-medium px-3 py-2 rounded-xl"
                style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.18)", color: "#B8851A" }}>
                {user ? <Sparkles size={13} /> : <TrendingUp size={13} />}
                <span>{user ? "Personalized for you — ranked by what you read and react to" : "Trending now — what readers are engaging with"}</span>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col gap-5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-paper animate-pulse" style={{ height: 220 }} />
                ))}
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-3xl mb-3">✍️</p>
                <p className="font-display text-xl font-bold text-ink mb-1">
                  {!supabase ? "Backend not connected" : "No stories yet"}
                </p>
                <p className="text-muted text-sm mb-6">
                  {!supabase
                    ? "Add your Supabase credentials to .env.local to load real stories."
                    : query || activeCat ? "Try a different search or category." : "Be the first to publish a story."}
                </p>
                {!query && !activeCat && supabase && (
                  <Link href="/write"
                    className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-full"
                    style={{ background: "#F5A623", color: "#0B0907" }}>
                    <PenLine size={14} /> Write the first story
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {stories.map((s, i) => (
                  <div key={s.id} className="anim-fade-up" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}>
                    <StoryCard story={s} featured clapTotal={clapTotals[s.id] ?? 0} commentCount={commentCounts[s.id] ?? 0} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <TrendingSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paper">
        <div className="pt-24 max-w-6xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-10 bg-border rounded-xl w-64 mb-4" />
            <div className="h-5 bg-border rounded w-80" />
          </div>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
