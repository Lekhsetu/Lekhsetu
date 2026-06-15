"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, Flag, Users, ShieldAlert, Eye, MessageSquare,
  Star, StarOff, Trash2, EyeOff, Ban, ShieldCheck, ArrowUpRight, MessageSquareHeart,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchPlatformStats, fetchAllStories, fetchAllReports, fetchAllUsers, fetchAllFeedback,
  fetchPlatformTimeline, fetchTopStoriesByEngagement,
  adminDeleteStory, adminSetFeatured, adminSetPublished, adminDismissReport,
  adminSetBanned, adminSetAdmin, adminDeleteFeedback,
  type PlatformStats, type AdminReport, type AdminFeedback,
} from "@/services/admin";
import type { TimelinePoint } from "@/services/insights";
import { CATEGORIES } from "@/constants";
import type { Story, Profile } from "@/types";
import { timeAgo } from "@/utils/time";
import LineChart from "@/components/charts/LineChart";
import BarChart from "@/components/charts/BarChart";

type Tab = "overview" | "stories" | "reports" | "users" | "feedback";

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

function OverviewTab({ stats, timeline, topStories }: {
  stats: PlatformStats | null;
  timeline: { users: TimelinePoint[]; stories: TimelinePoint[] } | null;
  topStories: { title: string; score: number }[];
}) {
  if (!stats) return <div className="h-40 rounded-2xl skeleton" />;
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} />
        <StatCard icon={FileText} label="Published stories" value={stats.totalStories} />
        <StatCard icon={FileText} label="Drafts" value={stats.totalDrafts} />
        <StatCard icon={Eye} label="Total reads" value={stats.totalViews} />
        <StatCard icon={MessageSquare} label="Total comments" value={stats.totalComments} />
        <StatCard icon={Flag} label="Open reports" value={stats.pendingReports} />
      </div>

      {timeline && (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(245,166,35,0.12)", background: "rgba(255,255,255,0.02)" }}>
            <p className="text-xs mb-3" style={{ color: "#6B6354" }}>New users (last 14 days)</p>
            <LineChart data={timeline.users} color="#F5A623" />
          </div>
          <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(245,166,35,0.12)", background: "rgba(255,255,255,0.02)" }}>
            <p className="text-xs mb-3" style={{ color: "#6B6354" }}>New published stories (last 14 days)</p>
            <LineChart data={timeline.stories} color="#F5A623" />
          </div>
        </div>
      )}

      {topStories.length > 0 && (
        <div className="rounded-2xl p-5" style={{ border: "1px solid rgba(245,166,35,0.12)", background: "rgba(255,255,255,0.02)" }}>
          <p className="text-xs mb-3" style={{ color: "#6B6354" }}>Top stories by engagement</p>
          <BarChart color="#F5A623" data={topStories.map(s => ({ label: s.title, value: s.score }))} />
        </div>
      )}
    </div>
  );
}

function StoriesTab({ stories, onChange }: { stories: Story[]; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  const toggleFeatured = async (s: Story) => {
    setBusy(s.id);
    await adminSetFeatured(s.id, !s.featured, s.translation_group_id);
    setBusy(null);
    onChange();
  };
  const togglePublished = async (s: Story) => {
    setBusy(s.id);
    await adminSetPublished(s.id, !s.published, s.translation_group_id);
    setBusy(null);
    onChange();
  };
  const remove = async (s: Story) => {
    if (!window.confirm(`Permanently delete "${s.title}"? This cannot be undone.`)) return;
    setBusy(s.id);
    await adminDeleteStory(s.id, s.translation_group_id);
    setBusy(null);
    onChange();
  };

  if (stories.length === 0) return <p className="text-sm text-muted py-10 text-center">No stories found.</p>;

  return (
    <div className="space-y-2">
      {stories.map(s => {
        const cat = CATEGORIES.find(c => c.id === s.category);
        const author = s.profiles?.display_name || s.profiles?.full_name || s.profiles?.username || "Unknown";
        return (
          <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl flex-wrap"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {cat && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cat.color}18`, color: cat.color }}>{cat.emoji} {cat.label}</span>}
                <span className="text-xs" style={{ color: "#6B6354" }}>{timeAgo(s.created_at)}</span>
                {!s.published && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "#B8AE98" }}>Draft</span>}
                {s.featured && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623" }}>Featured</span>}
              </div>
              <Link href={`/story/${s.id}`} className="font-display font-bold text-ink hover:text-saffron transition-colors text-sm line-clamp-1 inline-flex items-center gap-1.5">
                {s.title} <ArrowUpRight size={12} className="opacity-50" />
              </Link>
              <p className="text-xs mt-0.5" style={{ color: "#6B6354" }}>by {author} · {(s.views_count ?? 0).toLocaleString()} reads</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => toggleFeatured(s)} disabled={busy === s.id}
                title={s.featured ? "Unfeature" : "Feature"}
                className="p-2 rounded-lg transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623" }}>
                {s.featured ? <StarOff size={13} /> : <Star size={13} />}
              </button>
              <button onClick={() => togglePublished(s)} disabled={busy === s.id}
                title={s.published ? "Unpublish" : "Publish"}
                className="p-2 rounded-lg transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#B8AE98" }}>
                {s.published ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button onClick={() => remove(s)} disabled={busy === s.id}
                title="Delete"
                className="p-2 rounded-lg transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReportsTab({ reports, onChange }: { reports: AdminReport[]; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  const dismiss = async (r: AdminReport) => {
    setBusy(r.id);
    await adminDismissReport(r.id);
    setBusy(null);
    onChange();
  };
  const removeStory = async (r: AdminReport) => {
    if (!r.stories) return;
    if (!window.confirm(`Delete the reported story "${r.stories.title}"? This cannot be undone.`)) return;
    setBusy(r.id);
    await adminDeleteStory(r.stories.id);
    await adminDismissReport(r.id);
    setBusy(null);
    onChange();
  };

  if (reports.length === 0) return <p className="text-sm text-muted py-10 text-center">No reports. All clear.</p>;

  return (
    <div className="space-y-2">
      {reports.map(r => (
        <div key={r.id} className="p-3 rounded-xl" style={{ border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.03)" }}>
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div className="min-w-0">
              {r.stories ? (
                <Link href={`/story/${r.stories.id}`} className="font-display font-bold text-ink hover:text-saffron transition-colors text-sm inline-flex items-center gap-1.5">
                  {r.stories.title} <ArrowUpRight size={12} className="opacity-50" />
                </Link>
              ) : (
                <p className="text-sm text-muted italic">Story no longer exists</p>
              )}
              <p className="text-xs mt-1" style={{ color: "#6B6354" }}>
                Reported by {r.profiles?.display_name || r.profiles?.username || "a user"} · {timeAgo(r.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => dismiss(r)} disabled={busy === r.id}
                className="text-xs px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#B8AE98" }}>
                Dismiss
              </button>
              {r.stories && (
                <button onClick={() => removeStory(r)} disabled={busy === r.id}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors disabled:opacity-40"
                  style={{ border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
                  <Trash2 size={12} /> Delete story
                </button>
              )}
            </div>
          </div>
          <p className="text-sm" style={{ color: "#B8AE98" }}>&ldquo;{r.reason}&rdquo;</p>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ users, currentUserId, onChange }: { users: Profile[]; currentUserId?: string; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  const toggleBan = async (u: Profile) => {
    setBusy(u.id);
    await adminSetBanned(u.id, !u.is_banned);
    setBusy(null);
    onChange();
  };
  const toggleAdmin = async (u: Profile) => {
    if (u.id === currentUserId) return;
    setBusy(u.id);
    await adminSetAdmin(u.id, !u.is_admin);
    setBusy(null);
    onChange();
  };

  return (
    <div className="space-y-2">
      {users.map(u => (
        <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl flex-wrap"
          style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
          {u.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623" }}>
              {(u.display_name || u.username || "U")[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Link href={`/profile/${u.username}`} className="text-sm font-semibold text-ink hover:text-saffron transition-colors">
              {u.display_name || u.full_name || u.username}
            </Link>
            <p className="text-xs" style={{ color: "#6B6354" }}>@{u.username} · joined {timeAgo(u.created_at)}</p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {u.is_admin && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623" }}>Admin</span>
            )}
            {u.is_banned && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>Banned</span>
            )}
            <button onClick={() => toggleAdmin(u)} disabled={busy === u.id || u.id === currentUserId}
              title={u.is_admin ? "Remove admin" : "Make admin"}
              className="p-2 rounded-lg transition-colors disabled:opacity-30"
              style={{ border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623" }}>
              <ShieldCheck size={13} />
            </button>
            <button onClick={() => toggleBan(u)} disabled={busy === u.id || u.id === currentUserId}
              title={u.is_banned ? "Unban" : "Ban"}
              className="p-2 rounded-lg transition-colors disabled:opacity-30"
              style={{ border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              <Ban size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedbackTab({ feedback, onChange }: { feedback: AdminFeedback[]; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  const remove = async (f: AdminFeedback) => {
    setBusy(f.id);
    await adminDeleteFeedback(f.id);
    setBusy(null);
    onChange();
  };

  if (feedback.length === 0) return <p className="text-sm text-muted py-10 text-center">No feedback yet.</p>;

  return (
    <div className="space-y-2">
      {feedback.map(f => (
        <div key={f.id} className="p-3 rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
          <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623" }}>
                  {f.category}
                </span>
                <p className="text-xs" style={{ color: "#6B6354" }}>
                  {f.name || f.email || "Anonymous"} · {timeAgo(f.created_at)}
                  {f.page ? ` · ${f.page}` : ""}
                </p>
              </div>
            </div>
            <button onClick={() => remove(f)} disabled={busy === f.id}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 flex-shrink-0"
              style={{ border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
          <p className="text-sm whitespace-pre-wrap" style={{ color: "#B8AE98" }}>{f.message}</p>
          {f.email && <p className="text-xs mt-1.5" style={{ color: "#6B6354" }}>{f.email}</p>}
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);
  const [timeline, setTimeline] = useState<{ users: TimelinePoint[]; stories: TimelinePoint[] } | null>(null);
  const [topStories, setTopStories] = useState<{ title: string; score: number }[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || (profile && !profile.is_admin))) router.replace("/");
  }, [user, profile, loading, router]);

  const refresh = () => {
    setDataLoading(true);
    Promise.all([fetchPlatformStats(), fetchAllStories(), fetchAllReports(), fetchAllUsers(), fetchAllFeedback(), fetchPlatformTimeline(), fetchTopStoriesByEngagement()])
      .then(([s, st, r, u, f, tl, top]) => {
        setStats(s); setStories(st); setReports(r); setUsers(u); setFeedback(f); setTimeline(tl); setTopStories(top);
        setDataLoading(false);
      });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (profile?.is_admin) refresh();
  }, [profile?.is_admin]);

  if (loading || !profile?.is_admin) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0B0907" }}>
      <div className="w-6 h-6 rounded-full border-2 border-gold animate-spin" style={{ borderTopColor: "transparent" }} />
    </div>
  );

  const TABS: { id: Tab; label: string; Icon: typeof Eye; count?: number }[] = [
    { id: "overview", label: "Overview", Icon: LayoutDashboard },
    { id: "stories", label: "Stories", Icon: FileText, count: stories.length },
    { id: "reports", label: "Reports", Icon: Flag, count: reports.length },
    { id: "users", label: "Users", Icon: Users, count: users.length },
    { id: "feedback", label: "Feedback", Icon: MessageSquareHeart, count: feedback.length },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-rule w-10" />
          <span className="text-xs tracking-widest uppercase flex items-center gap-1.5" style={{ color: "#F5A623" }}>
            <ShieldAlert size={12} /> Admin
          </span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mb-8">Platform control</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 p-1 rounded-xl overflow-x-auto scrollbar-none" style={{ background: "rgba(255,255,255,0.04)" }}>
          {TABS.map(({ id, label, Icon, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className="flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-4 text-sm rounded-lg transition-all"
              style={tab === id
                ? { background: "rgba(245,166,35,0.12)", color: "#F5A623" }
                : { color: "#6B6354" }}>
              <Icon size={14} />{label}
              {typeof count === "number" && <span className="text-xs opacity-70">{count}</span>}
            </button>
          ))}
        </div>

        {dataLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl skeleton" />)}
          </div>
        ) : (
          <>
            {tab === "overview" && <OverviewTab stats={stats} timeline={timeline} topStories={topStories} />}
            {tab === "stories" && <StoriesTab stories={stories} onChange={refresh} />}
            {tab === "reports" && <ReportsTab reports={reports} onChange={refresh} />}
            {tab === "users" && <UsersTab users={users} currentUserId={user?.id} onChange={refresh} />}
            {tab === "feedback" && <FeedbackTab feedback={feedback} onChange={refresh} />}
          </>
        )}
      </div>
    </div>
  );
}
