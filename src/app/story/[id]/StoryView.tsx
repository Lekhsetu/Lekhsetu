"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, BookOpen, Flag, Send, Trash2,
  PenLine, Loader2, X, Layers, MessageCircle, Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import LanguageSwitcher, { type TranslatedContent } from "@/components/LanguageSwitcher";
import ClapButton from "@/components/ClapButton";
import ShareButton from "@/components/ShareButton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useReadProgress } from "@/hooks/useReadProgress";
import { fetchStoryById, fetchRelatedStories, incrementStoryView, deleteStory, fetchTranslationSiblings } from "@/services/stories";
import { getCachedTranslation, saveCachedTranslation, saveTranslationMemory } from "@/services/translationCache";
import { getPreferredLanguage } from "@/utils/geo";
import { fetchClapTotal, getUserClapCount, reportStory } from "@/services/reactions";
import { fetchComments, addComment, deleteComment } from "@/services/comments";
import { CATEGORIES, LANGUAGES } from "@/constants";
import type { Story, Comment } from "@/types";
import { timeAgo } from "@/utils/time";

// ─── Render body with basic markdown ─────────────────────────────────────────
function renderBody(body?: string) {
  if (!body) return <p style={{ color: "#6B6354" }}>No content found.</p>;

  return body.split("\n").map((line, i) => {
    if (line.startsWith("## "))
      return <h2 key={i} className="font-display text-2xl font-bold mt-10 mb-4" style={{ color: "#F0EAD6" }}>{line.slice(3)}</h2>;
    if (line.startsWith("# "))
      return <h1 key={i} className="font-display text-3xl font-bold mt-10 mb-4" style={{ color: "#F0EAD6" }}>{line.slice(2)}</h1>;
    if (line.startsWith("> "))
      return <blockquote key={i} className="border-l-4 pl-4 my-4 italic" style={{ borderColor: "#F5A623", color: "#6B6354" }}>{line.slice(2)}</blockquote>;
    if (line.startsWith("- ") || line.startsWith("* "))
      return <li key={i} className="ml-5 mb-1 list-disc" style={{ color: "#B8AE98" }}>{parseBold(line.slice(2))}</li>;
    if (line.startsWith("---"))
      return <hr key={i} className="my-8" style={{ borderColor: "rgba(255,255,255,0.08)" }} />;
    if (line.trim() === "")
      return <div key={i} className="h-3" />;
    return <p key={i} className="leading-[1.9] text-base md:text-lg" style={{ color: "#B8AE98" }}>{parseBold(line)}</p>;
  });
}

function parseBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} style={{ color: "#F0EAD6" }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
}

const REPORT_REASONS = [
  "Spam or misleading",
  "Hate speech or harassment",
  "Inappropriate content",
  "Plagiarism",
  "Other",
];

export default function StoryView({ id }: { id: string }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [related, setRelated] = useState<Story[]>([]);
  const [siblings, setSiblings] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [translation, setTranslation] = useState<{ language: string } & TranslatedContent | null>(null);
  const [translating, setTranslating] = useState<string | null>(null);
  const readProgress = useReadProgress();

  // Claps
  const [clapTotal, setClapTotal] = useState(0);
  const [myClaps, setMyClaps] = useState(0);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);

  // Report
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!supabase) { setLoading(false); setCommentsLoading(false); return; }
    fetchStoryById(id).then(async data => {
      if (!data) { setLoading(false); return; }

      // If a creator published this story in multiple languages, show the
      // reader the version matching their preferred (location-based) language.
      const preferred = getPreferredLanguage();
      if (data.translation_group_id) {
        const groupSiblings = await fetchTranslationSiblings(data.translation_group_id, data.id);
        if (preferred && data.language !== preferred) {
          const match = groupSiblings.find(s => s.language === preferred);
          if (match) {
            router.replace(`/story/${match.id}`);
            return;
          }
        }
        setSiblings(groupSiblings);
      }

      setStory(data);
      setLoading(false);
      await incrementStoryView(id, user?.id, data.translation_group_id);
      setRelated(await fetchRelatedStories(data.category, id, 3, data.translation_group_id));
      setClapTotal(await fetchClapTotal(id));
      const c = await fetchComments(id);
      setComments(c);
      setCommentsLoading(false);

      // No published version in the reader's regional language: serve from
      // cache if available, otherwise translate via AI and cache the result.
      if (preferred && preferred !== data.language) {
        const cached = await getCachedTranslation(id, preferred);
        if (cached) {
          setTranslation({ language: preferred, ...cached });
        } else {
          setTranslating(preferred);
          try {
            const res = await fetch("/api/ai", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "translate_to",
                title: data.title,
                excerpt: data.excerpt ?? "",
                content: data.content,
                language: data.language,
                targetLanguage: preferred,
              }),
            });
            const json = await res.json();
            if (res.ok && !json.error) {
              const result = {
                title: json.result.title,
                excerpt: json.result.excerpt ?? "",
                content: json.result.content,
              };
              setTranslation({ language: preferred, ...result });
              saveCachedTranslation(id, preferred, result);
              saveTranslationMemory(data.language, preferred, data.content, result.content);
            }
          } catch {
            // silently keep the original language on translation failure
          } finally {
            setTranslating(null);
          }
        }
      }
    });
    // user is intentionally excluded, re-running on auth resolve would double-count the view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Reset any AI translation when navigating to a different story.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTranslation(null);
  }, [id]);

  // Load the current user's clap count separately, avoids re-fetching
  // the whole story (and double-counting the view) when auth resolves.
  useEffect(() => {
    if (!supabase || !user) return;
    getUserClapCount(id, user.id).then(setMyClaps);
  }, [id, user]);

  // ── Comment submit ───────────────────────────────────────────────────────
  const handleComment = async () => {
    if (!user) { router.push("/auth"); return; }
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    const { error } = await addComment(id, user.id, commentText.trim());
    if (!error) {
      setCommentText("");
      const updated = await fetchComments(id);
      setComments(updated);
    }
    setCommentLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  // ── Report ───────────────────────────────────────────────────────────────
  const handleReport = async () => {
    if (!user || !reportReason) return;
    setReportLoading(true);
    await reportStory(id, user.id, reportReason);
    setReportSent(true);
    setReportLoading(false);
    setTimeout(() => setReportOpen(false), 2000);
  };

  // ── Delete story ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!user || !story || user.id !== story.author_id) return;
    setDeleting(true);
    const { error } = await deleteStory(id);
    if (!error) router.push("/explore");
    else setDeleting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="pt-28 max-w-3xl mx-auto px-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-border rounded w-24" />
          <div className="h-10 bg-border rounded w-3/4" />
          <div className="h-4 bg-border rounded" />
          <div className="h-4 bg-border rounded w-5/6" />
        </div>
      </div>
    </div>
  );

  if (!story) return notFound();

  const cat = CATEGORIES.find(c => c.id === story.category);
  const isAuthor = user?.id === story.author_id;
  const authorName = story.anonymous
    ? "Anonymous"
    : story.profiles?.display_name || story.profiles?.full_name || story.profiles?.username || "Anonymous";

  return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      {/* Read progress bar */}
      <div className="fixed top-0 left-0 h-0.5 z-[100] transition-all duration-100"
        style={{ width: `${readProgress}%`, background: cat?.color ?? "#F5A623" }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-6">
        <div className="flex items-center justify-between mb-8">
          <Link href="/explore"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors">
            <ArrowLeft size={14} /> Back to stories
          </Link>
          <div className="flex items-center gap-2">
            {/* Author: edit/delete */}
            {isAuthor && (
              <>
                <Link href={`/write?edit=${story.id}`}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{ border: "1px solid rgba(245,166,35,0.2)", color: "#B8AE98" }}>
                  <PenLine size={11} /> Edit
                </Link>
                <button onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{ border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
                  <Trash2 size={11} /> Delete
                </button>
              </>
            )}
            {/* Report button */}
            {!isAuthor && (
              <button onClick={() => setReportOpen(true)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)", color: "#6B6354" }}>
                <Flag size={11} /> Report
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white" style={{ background: cat?.color }}>
            {cat?.emoji} {cat?.label}
          </span>
          <LanguageSwitcher
            current={story.language}
            options={[{ id: story.id, language: story.language }, ...siblings.map(s => ({ id: s.id, language: s.language }))]}
            storyId={id}
            storyTitle={story.title}
            storyExcerpt={story.excerpt ?? ""}
            storyContent={story.content}
            translatedLanguage={translation?.language ?? null}
            onTranslating={code => { setTranslating(code); setTranslation(null); }}
            onTranslated={(language, data) => { setTranslating(null); setTranslation({ language, ...data }); }}
            onShowOriginal={() => { setTranslating(null); setTranslation(null); }}
          />
          {story.series_title && (
            <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ background: "rgba(245,166,35,0.08)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.15)" }}>
              <Layers size={10} />{story.series_title}{story.series_part ? ` · Part ${story.series_part}` : ""}
            </span>
          )}
        </div>

        {/* Byline */}
        <div className="flex flex-wrap items-center gap-2 mb-5 text-xs text-muted">
          {!story.anonymous && story.profiles?.username ? (
            <Link href={`/profile/${story.profiles.username}`}
              className="flex items-center gap-1.5 hover:text-saffron transition-colors">
              {story.profiles.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.profiles.avatar_url} alt={authorName} className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
              ) : (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: cat?.color }}>
                  {authorName[0]?.toUpperCase()}
                </span>
              )}
              {authorName}
            </Link>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: cat?.color }}>?</span>
              Anonymous
            </span>
          )}
          <span>·</span>
          <span>{timeAgo(story.created_at)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {story.read_time} min read
          </span>
        </div>

        {(translating || translation) && (
          <div className="flex items-center gap-2 mb-4 text-xs px-3 py-2 rounded-lg"
            style={{ background: "rgba(245,166,35,0.08)", color: "#B5701A", border: "1px solid rgba(245,166,35,0.15)" }}>
{translating
              ? <>Translating to {LANGUAGES.find(l => l.code === translating)?.native ?? translating}<span className="ml-1 inline-flex gap-0.5">{["·","·","·"].map((d,i)=><span key={i} className="animate-bounce" style={{animationDelay:`${i*150}ms`}}>{d}</span>)}</span></>
              : <>Translated to {LANGUAGES.find(l => l.code === translation!.language)?.native ?? translation!.language}<button onClick={() => setTranslation(null)} className="ml-auto underline hover:no-underline">Show original</button></>
            }
          </div>
        )}

        <h1 className={`font-display text-3xl md:text-5xl font-black text-ink leading-tight mb-8 transition-opacity duration-300 ${translating ? "opacity-40" : "opacity-100"}`}>
          {translation?.title ?? story.title}
        </h1>
      </div>

      {/* Story body */}
      <article className={`max-w-3xl mx-auto px-4 sm:px-6 pb-10 space-y-1 transition-opacity duration-300 ${translating ? "opacity-40 pointer-events-none select-none" : "opacity-100"}`}>
        {renderBody(translation?.content ?? story.content)}
      </article>

      {/* Tags */}
      {story.tags.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-8 flex flex-wrap gap-2">
          {story.tags.map(tag => (
            <Link key={tag} href={`/explore?q=${encodeURIComponent(tag)}`}
              className="text-xs px-2.5 py-1 rounded-full bg-cream border border-border text-muted hover:border-saffron hover:text-saffron transition-colors">
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* ── Engagement bar ────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-8">
        <div className="flex items-center gap-3 py-4 border-y" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <ClapButton storyId={id} initialTotal={clapTotal} initialMine={myClaps} size="lg" />
          <button onClick={() => commentInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors hover:border-saffron hover:text-saffron"
            style={{ borderColor: "rgba(255,255,255,0.08)", color: "#6B6354" }}>
            <MessageCircle size={18} />
            {comments.length > 0 ? comments.length : "Comment"}
          </button>
          <ShareButton
            title={story.title}
            text={`"${story.title}" on Lekhsetu. Read it for free.`}
            url={typeof window !== "undefined" ? window.location.href : ""}
            showWhatsApp
            className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition-colors hover:border-saffron hover:text-saffron ml-auto"
            style={{ borderColor: "rgba(255,255,255,0.08)", color: "#6B6354" }}
          />
        </div>
      </div>

      {/* ── Comments ──────────────────────────────────────────────────────── */}
      <div id="comments" className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <h3 className="font-display text-xl font-bold text-ink mb-6 flex items-center gap-2">
          <MessageCircle size={18} style={{ color: cat?.color }} />
          Comments {comments.length > 0 && <span className="text-muted text-sm font-normal">({comments.length})</span>}
        </h3>

        {/* Add comment */}
        <div className="mb-8">
          {user ? (
            <div className="flex items-start gap-3">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <span className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: cat?.color ?? "#F5A623" }}>
                  {(profile?.display_name || profile?.full_name || user.email || "U")[0]?.toUpperCase()}
                </span>
              )}
              <div className="flex-1 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}>
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleComment(); }}
                  placeholder="Share your thoughts…"
                  rows={3}
                  className="w-full bg-transparent text-sm p-4 resize-none focus:outline-none"
                  style={{ color: "#B8AE98" }}
                />
                <div className="flex justify-end px-4 pb-3">
                  <button onClick={handleComment} disabled={!commentText.trim() || commentLoading}
                    className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full font-semibold disabled:opacity-40 transition-all"
                    style={{ background: "#F5A623", color: "#0B0907" }}>
                    {commentLoading ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
              <p className="text-sm text-muted mb-3">Sign in to join the conversation</p>
              <Link href="/auth"
                className="text-xs px-4 py-2 rounded-full font-semibold"
                style={{ background: "#F5A623", color: "#0B0907" }}>
                Sign in
              </Link>
            </div>
          )}
        </div>

        {/* Comments list */}
        {commentsLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse h-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)" }} />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No comments yet. Be the first to share your thoughts.</p>
        ) : (
          <div className="space-y-3">
            {comments.map(comment => {
              const cName = comment.profiles?.display_name || comment.profiles?.full_name || comment.profiles?.username || "User";
              const isOwn = user?.id === comment.user_id;
              return (
                <div key={comment.id} className="group rounded-2xl p-4"
                  style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-start gap-3">
                    {comment.profiles?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={comment.profiles.avatar_url} alt={cName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <span className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: cat?.color ?? "#F5A623" }}>
                        {cName[0]?.toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Link href={`/profile/${comment.profiles?.username ?? ""}`}
                          className="text-xs font-semibold hover:text-saffron transition-colors" style={{ color: "#F0EAD6" }}>
                          {cName}
                        </Link>
                        <span className="text-xs text-muted">{timeAgo(comment.created_at)}</span>
                        {isOwn && (
                          <button onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                            style={{ color: "#6B6354" }}>
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "#B8AE98" }}>{comment.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Related stories ────────────────────────────────────────────────── */}
      {related.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 border-t border-border pt-10">
          <h3 className="font-display text-xl font-bold text-ink mb-5 flex items-center gap-2">
            <BookOpen size={18} style={{ color: cat?.color }} /> More in {cat?.label}
          </h3>
          <div className="space-y-0">
            {related.map((s, i) => (
              <div key={s.id} className="anim-fade-up" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
                <Link href={`/story/${s.id}`} className="group block py-4 border-b border-border last:border-0">
                  <p className="font-display font-bold text-ink group-hover:text-saffron transition-colors leading-snug mb-1">{s.title}</p>
                  <p className="text-sm text-muted line-clamp-1">{s.excerpt}</p>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Report modal ───────────────────────────────────────────────────── */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#1E1810", border: "1px solid rgba(245,166,35,0.15)" }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-sm" style={{ color: "#F0EAD6" }}>Report this story</h4>
              <button onClick={() => setReportOpen(false)} style={{ color: "#6B6354" }}><X size={16} /></button>
            </div>
            {reportSent ? (
              <p className="text-sm text-center py-4" style={{ color: "#B8AE98" }}>Thank you. We&apos;ll review this story.</p>
            ) : (
              <>
                <div className="space-y-2 mb-5">
                  {REPORT_REASONS.map(r => (
                    <button key={r} onClick={() => setReportReason(r)}
                      className="w-full text-left text-sm px-3 py-2.5 rounded-lg transition-colors"
                      style={reportReason === r
                        ? { background: "rgba(245,166,35,0.12)", color: "#F5A623" }
                        : { color: "#B8AE98", border: "1px solid transparent" }}>
                      {r}
                    </button>
                  ))}
                </div>
                <button onClick={handleReport} disabled={!reportReason || reportLoading}
                  className="w-full py-2.5 rounded-full text-sm font-semibold disabled:opacity-40"
                  style={{ background: "#F5A623", color: "#0B0907" }}>
                  {reportLoading ? "Submitting…" : "Submit report"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ───────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#1E1810", border: "1px solid rgba(239,68,68,0.2)" }}>
            <h4 className="font-semibold text-sm mb-2" style={{ color: "#f87171" }}>Delete this story?</h4>
            <p className="text-sm mb-6" style={{ color: "#6B6354" }}>This action cannot be undone. The story will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold disabled:opacity-40"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button onClick={() => setDeleteConfirm(false)}
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
