"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PenLine, Calendar, BookOpen, Heart, Settings } from "lucide-react";
import Navbar from "@/components/Navbar";
import StoryCard from "@/components/StoryCard";
import Avatar from "@/components/Avatar";
import ShareButton from "@/components/ShareButton";
import { fetchProfileByUsername, fetchStoriesByAuthor } from "@/services/profiles";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES } from "@/constants";
import type { Profile, Story } from "@/types";
import { timeAgo } from "@/utils/time";
import { getPreferredLanguage } from "@/utils/geo";

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileByUsername(username).then(async p => {
      if (!p) { setLoading(false); return; }
      setProfile(p);
      const s = await fetchStoriesByAuthor(p.id, getPreferredLanguage());
      setStories(s);
      setLoading(false);
    });
  }, [username]);

  if (loading) return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28">
        <div className="animate-pulse space-y-4">
          <div className="h-20 w-20 rounded-full bg-border" />
          <div className="h-8 bg-border rounded w-48" />
          <div className="h-4 bg-border rounded w-64" />
        </div>
      </div>
    </div>
  );

  if (!profile) return notFound();

  const isMe = user?.id === profile.id;
  const displayName = profile.display_name || profile.full_name || profile.username;

  const usedCategories = [...new Set(stories.map(s => s.category))];
  const filteredStories = activeCategory
    ? stories.filter(s => s.category === activeCategory)
    : stories;

  const totalReads = stories.reduce((sum, s) => sum + (s.views_count ?? 0), 0);
  const totalLikes = stories.reduce((sum, s) => sum + (s.likes_count ?? 0), 0);
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;

  return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <Link href="/explore" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-8">
          <ArrowLeft size={14} /> Back
        </Link>

        {/* Profile header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
          <Avatar src={profile.avatar_url} name={displayName} size={96} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">{displayName}</h1>
                <p className="text-sm text-muted">@{profile.username}</p>
              </div>
              <div className="flex items-center gap-2">
                <ShareButton
                  title={`${displayName} on Lekhsetu`}
                  text={`Read ${displayName}'s stories on Lekhsetu.`}
                  url={typeof window !== "undefined" ? window.location.href : ""}
                  label="Share profile"
                  className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-medium border border-border text-muted hover:border-saffron hover:text-saffron transition-colors"
                />
                {isMe && (
                  <Link href="/settings"
                    className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-medium border border-border text-muted hover:border-saffron hover:text-saffron transition-colors">
                    <Settings size={12} /> Edit profile
                  </Link>
                )}
              </div>
            </div>
            {profile.bio && (
              <p className="text-sm leading-relaxed mt-3" style={{ color: "#6B6354", maxWidth: 520 }}>{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-6 sm:gap-10 mb-10 pb-6 border-b border-border">
          <div>
            <p className="font-display text-xl font-bold text-ink flex items-center gap-1.5">
              <BookOpen size={14} style={{ color: "#F5A623" }} /> {stories.length}
            </p>
            <p className="text-xs text-muted mt-0.5">Stories</p>
          </div>
          <div className="w-px h-8" style={{ background: "var(--border)" }} />
          <div>
            <p className="font-display text-xl font-bold text-ink">{fmt(totalReads)}</p>
            <p className="text-xs text-muted mt-0.5">Reads</p>
          </div>
          <div className="w-px h-8" style={{ background: "var(--border)" }} />
          <div>
            <p className="font-display text-xl font-bold text-ink flex items-center gap-1.5">
              <Heart size={14} style={{ color: "#F5A623" }} /> {fmt(totalLikes)}
            </p>
            <p className="text-xs text-muted mt-0.5">Reactions</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1.5 text-xs text-muted">
            <Calendar size={12} />
            Joined {timeAgo(profile.created_at)}
          </div>
        </div>

        {/* Category filter */}
        {usedCategories.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
            <button onClick={() => setActiveCategory(null)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                !activeCategory ? "bg-ink text-paper border-ink" : "border-border text-muted hover:border-saffron hover:text-saffron"
              }`}>
              All
            </button>
            {usedCategories.map(catId => {
              const cat = CATEGORIES.find(c => c.id === catId);
              if (!cat) return null;
              return (
                <button key={catId} onClick={() => setActiveCategory(activeCategory === catId ? null : catId)}
                  className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
                  style={activeCategory === catId
                    ? { background: cat.color, borderColor: cat.color, color: "#fff" }
                    : { borderColor: "rgba(11,9,7,0.1)", color: "#6B6354" }}>
                  {cat.emoji} {cat.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Stories */}
        {filteredStories.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={32} className="mx-auto mb-4" style={{ color: "#3A3028" }} />
            <p className="font-display text-xl font-bold text-ink mb-2">
              {isMe ? "You haven't published yet" : `${displayName} hasn't published yet`}
            </p>
            {isMe && (
              <Link href="/write"
                className="inline-flex items-center gap-2 mt-4 font-semibold text-sm px-5 py-2.5 rounded-full"
                style={{ background: "#F5A623", color: "#0B0907" }}>
                <PenLine size={14} /> Write your first story
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filteredStories.map((s, i) => (
              <div key={s.id} className="anim-fade-up" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}>
                <StoryCard story={s} featured />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
