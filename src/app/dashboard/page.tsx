"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Heart, MessageCircle, Sparkles, BookOpen, PenLine, ArrowUpRight, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserInsights, fetchUserActivityTimeline, type StoryInsight, type UserInsightsTotals, type TimelinePoint } from "@/services/insights";
import { deleteStory } from "@/services/stories";
import { CATEGORIES } from "@/constants";
import { timeAgo } from "@/utils/time";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";

function StatCard({ icon: Icon, label, value }: { icon: typeof Eye; label: string; value: number }) {
  return (
    <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(245,166,35,0.12)", background: "rgba(255,255,255,0.02)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,166,35,0.12)", color: "#F5A623" }}>
          <Icon size={15} />
        </div>
        <p className="text-xs" style={{ color: "#6B6354" }}>{label}</p>
      </div>
      <p className="font-display text-3xl font-bold text-ink">{value.toLocaleString()}</p>
    </div>
  );
}

function StoryRow({ story, onDelete }: { story: StoryInsight; onDelete: (story: StoryInsight) => void }) {
  const cat = CATEGORIES.find(c => c.id === story.category);

  return (
    <div className="p-4 sm:p-5 rounded-xl transition-colors hover:border-saffron/30"
      style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {cat && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cat.color}18`, color: cat.color }}>
                {cat.emoji} {cat.label}
              </span>
            )}
            <span className="text-xs" style={{ color: "#6B6354" }}>{timeAgo(story.created_at)}</span>
            {!story.published && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#B8AE98" }}>
                Draft
              </span>
            )}
            {story.featured && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623" }}>
                Featured
              </span>
            )}
          </div>
          <Link href={`/story/${story.id}`}
            className="font-display font-bold text-ink hover:text-saffron transition-colors text-base leading-snug line-clamp-1 inline-flex items-center gap-1.5">
            {story.title} <ArrowUpRight size={14} className="flex-shrink-0 opacity-50" />
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/write?edit=${story.id}`}
            className="text-xs px-3 py-1.5 rounded-full transition-colors"
            style={{ border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623" }}>
            Edit
          </Link>
          <button onClick={() => onDelete(story)}
            title="Delete story"
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-5 flex-wrap text-sm" style={{ color: "#B8AE98" }}>
        <div className="flex items-center gap-1.5"><Eye size={13} style={{ color: "#6B6354" }} /> {(story.views_count ?? 0).toLocaleString()}</div>
        <div className="flex items-center gap-1.5"><Heart size={13} style={{ color: "#6B6354" }} /> {(story.likes_count ?? 0).toLocaleString()}</div>
        <div className="flex items-center gap-1.5"><MessageCircle size={13} style={{ color: "#6B6354" }} /> {story.commentCount.toLocaleString()}</div>
        {story.clapTotal > 0 && (
          <div className="flex items-center gap-1.5 text-xs">🕊️ {story.clapTotal.toLocaleString()}</div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [stories, setStories] = useState<StoryInsight[]>([]);
  const [totals, setTotals] = useState<UserInsightsTotals | null>(null);
  const [timeline, setTimeline] = useState<{ claps: TimelinePoint[]; comments: TimelinePoint[] } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<StoryInsight | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteStory(deleteTarget.id, deleteTarget.translation_group_id);
    if (!error) {
      setStories(prev => prev.filter(s => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
    setDeleting(false);
  };

  useEffect(() => {
    if (!loading && !user) router.replace("/auth?next=/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetchUserInsights(user.id).then(({ stories, totals }) => {
      setStories(stories);
      setTotals(totals);
      setDataLoading(false);
    });
    fetchUserActivityTimeline(user.id).then(setTimeline);
  }, [user]);

  if (loading || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0907" }}>
      <div className="w-6 h-6 rounded-full border-2 border-gold animate-spin" style={{ borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-rule w-10" />
              <span className="text-xs tracking-widest uppercase" style={{ color: "#F5A623" }}>Your dashboard</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-ink">
              Welcome back, {profile?.display_name || profile?.username || "writer"}
            </h1>
            <p className="text-muted mt-2">Track how your stories are resonating with readers.</p>
          </div>
          <Link href="/write"
            className="flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-full"
            style={{ background: "#F5A623", color: "#0B0907" }}>
            <PenLine size={14} /> New story
          </Link>
        </div>

        {dataLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 rounded-2xl skeleton" style={{ border: "1px solid rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : totals && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard icon={BookOpen} label="Stories" value={totals.totalStories} />
            <StatCard icon={Eye} label="Total reads" value={totals.totalViews} />
            <StatCard icon={Heart} label="Total likes" value={totals.totalLikes} />
            <StatCard icon={Sparkles} label="Claps" value={totals.totalClaps} />
          </div>
        )}

        {!dataLoading && stories.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display text-xl font-bold text-ink mb-4">Your insights</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {timeline && (
                <>
                  <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(245,166,35,0.12)", background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-xs mb-3" style={{ color: "#6B6354" }}>Claps received (last 14 days)</p>
                    <LineChart data={timeline.claps} color="#F5A623" />
                  </div>
                  <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(245,166,35,0.12)", background: "rgba(255,255,255,0.02)" }}>
                    <p className="text-xs mb-3" style={{ color: "#6B6354" }}>Comments received (last 14 days)</p>
                    <LineChart data={timeline.comments} color="#F5A623" />
                  </div>
                </>
              )}
            </div>
            <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(245,166,35,0.12)", background: "rgba(255,255,255,0.02)" }}>
              <p className="text-xs mb-3" style={{ color: "#6B6354" }}>Your top stories by engagement</p>
              <BarChart
                color="#F5A623"
                data={[...stories]
                  .map(s => ({ label: s.title, value: (s.views_count ?? 0) + s.clapTotal * 4 + s.commentCount * 3 }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 5)}
              />
            </div>
          </div>
        )}

        <h2 className="font-display text-xl font-bold text-ink mb-4">Your stories</h2>

        {dataLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl skeleton" style={{ border: "1px solid rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-20">
            <PenLine size={32} className="mx-auto mb-4" style={{ color: "#3A3028" }} />
            <p className="font-display text-xl font-bold text-ink mb-2">No stories yet</p>
            <p className="text-muted text-sm mb-6">Publish your first story to start tracking insights.</p>
            <Link href="/write"
              className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-full"
              style={{ background: "#F5A623", color: "#0B0907" }}>
              Write your first story
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stories.map(s => <StoryRow key={s.id} story={s} onDelete={setDeleteTarget} />)}
          </div>
        )}
      </div>

      {/* ── Delete confirm modal ───────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#1E1810", border: "1px solid rgba(239,68,68,0.2)" }}>
            <h4 className="font-semibold text-sm mb-2" style={{ color: "#f87171" }}>Delete &ldquo;{deleteTarget.title}&rdquo;?</h4>
            <p className="text-sm mb-6" style={{ color: "#6B6354" }}>This action cannot be undone. The story will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={handleConfirmDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold disabled:opacity-40"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-full text-sm"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#6B6354" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
