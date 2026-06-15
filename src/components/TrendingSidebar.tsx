"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, BookOpen, Users } from "lucide-react";
import { fetchCategoryCounts, fetchCommunityStats, fetchFeed, dedupeTranslations } from "@/services/stories";
import { CATEGORIES } from "@/constants";
import type { Story } from "@/types";

export default function TrendingSidebar() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ storyCount: 0, writerCount: 0 });
  const [topStory, setTopStory] = useState<Story | null>(null);

  useEffect(() => {
    fetchCategoryCounts().then(setCounts);
    fetchCommunityStats().then(setStats);
    fetchFeed({ limit: 5 }).then(data => setTopStory(dedupeTranslations(data)[0] ?? null));
  }, []);

  const trendingCats = CATEGORIES
    .map(c => ({ ...c, count: counts[c.id] ?? 0 }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <aside className="space-y-5">
      <div className="rounded-2xl border border-border p-5 bg-paper">
        <h3 className="font-display text-sm font-bold text-ink mb-4 flex items-center gap-2">
          <Users size={14} className="text-saffron" /> Community
        </h3>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-2xl font-bold text-ink">{stats.storyCount}</p>
            <p className="text-xs text-muted">Stories shared</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-ink">{stats.writerCount}</p>
            <p className="text-xs text-muted">Writers</p>
          </div>
        </div>
      </div>

      {topStory && (
        <div className="rounded-2xl border border-border p-5 bg-paper">
          <h3 className="font-display text-sm font-bold text-ink mb-3 flex items-center gap-2">
            <Flame size={14} className="text-saffron" /> Story of the Week
          </h3>
          <Link href={`/story/${topStory.id}`} className="group block">
            <p className="text-sm font-semibold text-ink leading-snug group-hover:text-saffron transition-colors line-clamp-2 mb-1.5">
              {topStory.title}
            </p>
            <p className="text-xs text-muted">by {topStory.profiles?.display_name || "Anonymous"}</p>
          </Link>
        </div>
      )}

      {trendingCats.length > 0 && (
        <div className="rounded-2xl border border-border p-5 bg-paper">
          <h3 className="font-display text-sm font-bold text-ink mb-3 flex items-center gap-2">
            <BookOpen size={14} className="text-saffron" /> Trending Topics
          </h3>
          <div className="flex flex-col -mx-2">
            {trendingCats.map(c => (
              <Link key={c.id} href={`/explore?cat=${c.id}`}
                className="flex items-center justify-between text-sm py-2 px-2 rounded-lg hover:bg-cream transition-colors">
                <span className="text-ink">{c.emoji} {c.label}</span>
                <span className="text-xs text-muted">{c.count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
