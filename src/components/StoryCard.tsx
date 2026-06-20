import Link from "next/link";
import { Clock, ArrowUpRight, MessageCircle, Eye } from "lucide-react";
import type { Story } from "@/types";
import { CATEGORIES, LEGACY_CATEGORIES, LANGUAGES } from "@/constants";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m || 1}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

interface StoryCardProps {
  story: Story;
  featured?: boolean;
  index?: number;
  clapTotal?: number;
  commentCount?: number;
}

export default function StoryCard({ story, featured = false, index = 0, clapTotal = 0, commentCount = 0 }: StoryCardProps) {
  const cat = CATEGORIES.find(c => c.id === story.category) ?? LEGACY_CATEGORIES.find(c => c.id === story.category);
  const lang = LANGUAGES.find(l => l.code === story.language);
  // Pull the first non-empty sentence from the story as an emotional hook for the card.
  const hook = story.excerpt?.trim() ||
    story.content?.split(/\n+/).find(l => l.trim().length > 30)?.trim().slice(0, 160) || "";
  const authorName = story.profiles?.display_name || "Anonymous";

  if (featured) {
    return (
      <Link href={`/story/${story.id}`} className="group block h-full">
        <article className="border border-border rounded-2xl overflow-hidden hover:border-saffron/40 hover:shadow-lg transition-all duration-300 bg-paper h-full">
          <div className="h-1.5 w-full" style={{ background: cat?.color ?? "#e8751a" }} />
          <div className="p-5 md:p-7">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-cream text-muted border border-border">
                {cat?.emoji} {cat?.label}
              </span>
              {story.language !== "en" && lang && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-cream text-muted border border-border">
                  {lang.native}
                </span>
              )}
              <span className="text-xs text-muted">{timeAgo(story.created_at)}</span>
            </div>

            <h2 className="font-display text-xl md:text-2xl font-bold text-ink leading-snug mb-3 group-hover:text-saffron transition-colors">
              {story.title}
            </h2>

            {hook && (
              <blockquote className="relative pl-4 mb-5 border-l-2" style={{ borderColor: cat?.color ?? "#e8751a" }}>
                <p className="text-muted text-sm leading-relaxed italic line-clamp-2">&ldquo;{hook}&rdquo;</p>
              </blockquote>
            )}

            {/* Social proof */}
            <div className="flex items-center gap-4 text-xs text-muted mb-5 flex-wrap">
              {clapTotal > 0 && (
                <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: cat?.color }}>
                  <span>🕊️</span>
                  <span>{formatCount(clapTotal)}</span>
                </span>
              )}
              {commentCount > 0 && (
                <span className="inline-flex items-center gap-1"><MessageCircle size={12} /> {formatCount(commentCount)}</span>
              )}
              <span className="inline-flex items-center gap-1"><Eye size={12} /> {formatCount(story.views_count ?? 0)} reads</span>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                {story.profiles?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.profiles.avatar_url} alt={authorName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: cat?.color ?? "#e8751a" }}>
                    {authorName[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-ink">{authorName}</p>
                  <p className="text-xs text-muted">{story.profiles?.username ? `@${story.profiles.username}` : ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-semibold flex-shrink-0" style={{ color: cat?.color ?? "#e8751a" }}>
                <span className="inline-flex items-center gap-1 text-muted font-normal"><Clock size={11} />{story.read_time} min</span>
                <span className="inline-flex items-center gap-1 group-hover:gap-2 transition-all">Read story <ArrowUpRight size={13} /></span>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/story/${story.id}`} className="group block">
      <article className="py-5 border-b border-border last:border-0 hover:pl-2 transition-all duration-200"
        style={{ animationDelay: `${index * 80}ms` }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-xs" style={{ color: cat?.color }}>{cat?.emoji} {cat?.label}</span>
              {story.language !== "en" && lang && (
                <span className="text-xs text-muted">· {lang.native}</span>
              )}
              <span className="text-xs text-muted">· {timeAgo(story.created_at)}</span>
            </div>
            <h3 className="font-display text-base md:text-lg font-bold text-ink leading-snug mb-1.5 group-hover:text-saffron transition-colors line-clamp-2">
              {story.title}
            </h3>
            {hook && (
              <p className="text-sm italic line-clamp-1 mb-3" style={{ color: "#9C8B6F" }}>&ldquo;{hook}&rdquo;</p>
            )}
            <div className="flex items-center gap-3">
              {story.profiles?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.profiles.avatar_url} alt={authorName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ background: cat?.color ?? "#e8751a" }}>
                  {authorName[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs text-muted">{authorName}</span>
              <span className="text-xs text-muted flex items-center gap-1"><Clock size={10} /> {story.read_time} min</span>
            </div>
          </div>
          <ArrowUpRight size={16} className="shrink-0 text-muted group-hover:text-saffron transition-colors mt-1" />
        </div>
      </article>
    </Link>
  );
}
