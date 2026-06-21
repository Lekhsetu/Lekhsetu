"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Eye, Bold, Italic, List, Link2, Quote, Send,
  Sparkles, ChevronDown, EyeOff, Layers, Lightbulb,
  Loader2, X, CheckCheck, FileText, SpellCheck2, Languages,
  PenLine,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { publishStory, updateStory, fetchStoryById } from "@/services/stories";
import { getCachedTranslation } from "@/services/translationCache";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { LANGUAGES, CATEGORIES } from "@/constants";

const MIN_WORDS = 100;
import type { Story } from "@/types";

// ─── Writing prompts ────────────────────────────────────────────────────────
const PROMPTS = [
  "Write about a moment that completely changed how you see the world.",
  "Describe a failure that taught you more than any success.",
  "What did your first job teach you that no school could?",
  "Tell the story of a stranger who impacted your life.",
  "Write about a time you had to choose between two difficult paths.",
  "Describe the best advice you ever received, and why it took time to understand.",
  "What does home mean to you? Tell a story about it.",
  "Write about a skill you learned the hard way.",
  "Describe a conversation you wish you had sooner.",
  "What would you tell your 18-year-old self?",
  "Write about a place that exists only in your memory.",
  "Tell the story of a risk that was worth taking.",
  "Describe a moment when you felt truly understood.",
  "What is the most important lesson your culture taught you?",
  "Write about the moment you stopped caring what others thought.",
];

// ─── Ink splash animation ────────────────────────────────────────────────────
const SPLASH = Array.from({ length: 22 }, (_, i) => {
  const angle = (i / 22) * 360;
  const r = 55 + (i % 4) * 44;
  return {
    tx: Math.cos((angle * Math.PI) / 180) * r,
    ty: Math.sin((angle * Math.PI) / 180) * r,
    size: 4 + (i % 4) * 3,
    delay: (i % 7) * 0.07,
    color: ["#F5A623", "#FFD080", "rgba(245,166,35,0.65)", "#F5A623"][i % 4],
  };
});

function GoldenInkSplash() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      <div style={{ position: "relative" }}>
        {SPLASH.map((p, i) => (
          <div
            key={i}
            className="ink-splash-p absolute rounded-full"
            style={{
              width: p.size, height: p.size,
              background: p.color,
              animationDelay: `${p.delay}s`,
              ["--tx" as string]: `${p.tx}px`,
              ["--ty" as string]: `${p.ty}px`,
              top: "50%", left: "50%",
              marginTop: -(p.size / 2),
              marginLeft: -(p.size / 2),
            }}
          />
        ))}
      </div>
    </div>
  );
}

const DRAFT_KEY = "lekhsetu_draft";

function WritePageInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("en");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [preview, setPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [seriesTitle, setSeriesTitle] = useState("");
  const [seriesPart, setSeriesPart] = useState<number | "">("");
  const [showSeries, setShowSeries] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState("");
  const [aiAction, setAiAction] = useState<string>("");
  const [aiUsedToday, setAiUsedToday] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    try {
      const stored = JSON.parse(localStorage.getItem("lekh_ai_usage") ?? "{}");
      const now = new Date();
      const weekKey = `${now.getFullYear()}-W${Math.ceil((now.getDate() - now.getDay() + 1) / 7)}`;
      return stored.week === weekKey ? (stored.count ?? 0) : 0;
    } catch { return 0; }
  });
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [activePromptIdx, setActivePromptIdx] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const [isEditing, setIsEditing] = useState(false);
  const [promptTranslations, setPromptTranslations] = useState<Record<string, string>>({});
  const [promptTranslating, setPromptTranslating] = useState(false);

  const { textareaRef: bodyRef, wrapperRef: editorAreaRef, onChange: onBodyResize } = useAutoResizeTextarea(body);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [catOpen, setCatOpen] = useState(false);
  const promptsRef = useRef<HTMLDivElement>(null);
  const publishRef = useRef<HTMLButtonElement>(null);
  const seriesRef = useRef<HTMLButtonElement>(null);
  const visibilityRef = useRef<HTMLButtonElement>(null);
  const langPickerRef = useRef<HTMLDivElement>(null);

  // Auto-translate (English in, selected language out) state — when a
  // non-English language is selected, newly-typed English text is translated
  // into that language's native script automatically as the user writes.
  const [titleTranslating, setTitleTranslating] = useState(false);
  const [bodyTranslating, setBodyTranslating] = useState(false);
  const titleAnchorRef = useRef(0);
  const bodyAnchorRef = useRef(0);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleBusyRef = useRef(false);
  const bodyBusyRef = useRef(false);
  const translateGenRef = useRef(0);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.replace("/auth?next=/write&mode=signup");
  }, [user, loading, router]);

  // Load story for editing
  useEffect(() => {
    if (!editId || !user) return;
    fetchStoryById(editId).then(story => {
      if (!story || story.author_id !== user.id) return;
      setTitle(story.title);
      setBody(story.content);
      setCategory(story.category);
      setLanguage(story.language);
      setTags(story.tags ?? []);
      setAnonymous(story.anonymous ?? false);
      setSeriesTitle(story.series_title ?? "");
      setSeriesPart(story.series_part ?? "");
      if (story.series_title) setShowSeries(true);
      setIsEditing(true);
    });
  }, [editId, user]);

  // Draft restore on mount
  useEffect(() => {
    if (editId || draftRestored) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (draft.title || draft.body) setShowDraftBanner(true);
    } catch {}
  }, [editId, draftRestored]);

  const restoreDraft = () => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      setTitle(draft.title ?? "");
      setBody(draft.body ?? "");
      setCategory(draft.category ?? "");
      setLanguage(draft.language ?? "en");
      setTags(draft.tags ?? []);
      setAnonymous(draft.anonymous ?? false);
    } catch {}
    setShowDraftBanner(false);
    setDraftRestored(true);
  };

  // Auto-save draft every 3s
  useEffect(() => {
    if (isEditing) return;
    const t = setInterval(() => {
      if (title || body) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, body, category, language, tags, anonymous }));
      }
    }, 3000);
    return () => clearInterval(t);
  }, [title, body, category, language, tags, anonymous, isEditing]);


  // Translate the active writing prompt into the selected language
  useEffect(() => {
    if (language === "en") return;
    const key = `${language}:${activePromptIdx}`;
    if (promptTranslations[key]) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPromptTranslating(true);
    fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "localize", content: PROMPTS[activePromptIdx], title: "", language }),
    })
      .then(res => res.json())
      .then(json => {
        if (cancelled || !json.result) return;
        setPromptTranslations(prev => ({ ...prev, [key]: json.result.trim() }));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setPromptTranslating(false); });
    return () => { cancelled = true; };
  }, [language, activePromptIdx, promptTranslations]);



  // ── Toolbar formatting ──────────────────────────────────────────────────────
  const insertFormat = useCallback((type: "bold" | "italic" | "list" | "link" | "quote" | "divider") => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.slice(start, end);

    const map: Record<string, { before: string; after: string; placeholder: string }> = {
      bold:    { before: "**", after: "**", placeholder: "bold text" },
      italic:  { before: "*",  after: "*",  placeholder: "italic text" },
      list:    { before: "\n- ", after: "", placeholder: "list item" },
      link:    { before: "[",  after: "](url)", placeholder: "link text" },
      quote:   { before: "\n> ", after: "", placeholder: "your quote" },
      divider: { before: "\n\n---\n\n", after: "", placeholder: "" },
    };

    const { before, after, placeholder } = map[type];
    const insert = selected || placeholder;
    const newBody = body.slice(0, start) + before + insert + after + body.slice(end);
    setBody(newBody);
    onBodyResize();
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + insert.length);
    }, 0);
  }, [body, bodyRef, onBodyResize]);

  // Translates an English snippet into the selected language's native script.
  const translateSegment = async (text: string): Promise<string> => {
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "translate_live", content: text, title: "", language }),
      });
      const json = await res.json();
      return typeof json.result === "string" && json.result.trim() ? json.result.trim() : text;
    } catch {
      return text;
    }
  };

  // Translates the text typed since `anchorRef`, in place, and advances the anchor.
  // `gen` guards against a switch of writing language while a translation is
  // in flight — without it, a stale response could overwrite the freshly
  // cleared editor, and the busy flag would be left stuck "true" forever.
  const runTranslate = async (
    value: string,
    anchorRef: React.MutableRefObject<number>,
    busyRef: React.MutableRefObject<boolean>,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    setTranslating: (b: boolean) => void,
    taRef: React.RefObject<HTMLTextAreaElement | null>,
    afterUpdate?: () => void
  ) => {
    const gen = translateGenRef.current;
    const anchor = Math.min(anchorRef.current, value.length);
    const segment = value.slice(anchor);
    if (!segment.trim()) return;
    if (!/[a-zA-Z]/.test(segment)) {
      // Already in the target script (e.g. typed via a native keyboard) — nothing to translate.
      anchorRef.current = value.length;
      return;
    }
    busyRef.current = true;
    setTranslating(true);
    const translated = await translateSegment(segment.trim());
    busyRef.current = false;
    setTranslating(false);
    if (gen !== translateGenRef.current) return; // language changed mid-translation — discard

    const suffix = /[ \n]$/.test(segment) ? segment.slice(-1) : "";
    setValue(prev => {
      const head = prev.slice(0, anchor);
      const tail = prev.slice(anchor + segment.length);
      const replaced = head + translated + suffix + tail;
      anchorRef.current = (head + translated + suffix).length;
      return replaced;
    });
    const ta = taRef.current;
    if (ta && document.activeElement === ta) {
      requestAnimationFrame(() => {
        const end = ta.value.length;
        ta.setSelectionRange(end, end);
      });
    }
    afterUpdate?.();
  };

  // Auto-translates the typed text into the selected language once a phrase
  // or sentence is finished (on . ! ? or newline), with a pause-based
  // fallback once typing stops — so the AI gets enough context for a good
  // translation instead of mistranslating single words in isolation.
  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setBody(newValue);
    onBodyResize();

    if (language === "en") return;
    if (bodyTimerRef.current) clearTimeout(bodyTimerRef.current);

    if (/[.!?\n]$/.test(newValue) && !bodyBusyRef.current) {
      runTranslate(newValue, bodyAnchorRef, bodyBusyRef, setBody, setBodyTranslating, bodyRef, onBodyResize);
      return;
    }

    bodyTimerRef.current = setTimeout(() => {
      if (!bodyBusyRef.current) runTranslate(newValue, bodyAnchorRef, bodyBusyRef, setBody, setBodyTranslating, bodyRef, onBodyResize);
    }, 700);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTitle(val);

    if (language === "en") return;
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);

    if (/[.!?\n]$/.test(val) && !titleBusyRef.current) {
      runTranslate(val, titleAnchorRef, titleBusyRef, setTitle, setTitleTranslating, titleRef);
      return;
    }

    titleTimerRef.current = setTimeout(() => {
      if (!titleBusyRef.current) runTranslate(val, titleAnchorRef, titleBusyRef, setTitle, setTitleTranslating, titleRef);
    }, 700);
  };

  const wc = body.split(/\s+/).filter(Boolean).length;
  const rt = Math.max(1, Math.ceil(wc / 200));

  const commitTags = async (raw: string) => {
    const candidates = raw
      .split(/[,\s#]+/)
      .map(t => t.trim().toLowerCase().replace(/[,#]/g, ""))
      .filter(t => t.length > 0);

    for (const candidate of candidates) {
      if (!candidate) continue;
      setTags(prev => {
        if (prev.includes(candidate) || prev.length >= 5) return prev;
        return [...prev, candidate];
      });
    }
    setTagInput("");
  };

  const addTag = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      await commitTags(tagInput);
    }
  };

  const handleTagPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes(",") || pasted.includes(" ") || pasted.includes("#")) {
      e.preventDefault();
      commitTags(pasted);
    }
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/#/g, "");
    if (val.includes(",")) {
      commitTags(val);
    } else {
      setTagInput(val);
    }
  };

  // ── AI assistant ───────────────────────────────────────────────────────────
  const AI_DAILY_LIMIT = 5;

  const incrementAiUsage = () => {
    const now = new Date();
    const weekKey = `${now.getFullYear()}-W${Math.ceil((now.getDate() - now.getDay() + 1) / 7)}`;
    const next = aiUsedToday + 1;
    localStorage.setItem("lekh_ai_usage", JSON.stringify({ week: weekKey, count: next }));
    setAiUsedToday(next);
    return next;
  };

  const runAi = async (action: string) => {
    if (!body.trim()) return;
    if (aiUsedToday >= AI_DAILY_LIMIT) {
      setAiAction(action);
      setAiResult("__limit__");
      setAiOpen(true);
      return;
    }
    setAiAction(action);
    setAiLoading(true);
    setAiResult("");
    setAiOpen(true);

    // For translate action on an existing story — check cache first.
    // Target is Hindi when source is English, English otherwise.
    if (action === "translate" && editId) {
      const targetLang = language === "en" ? "hi" : "en";
      const cached = await getCachedTranslation(editId, targetLang);
      if (cached) {
        setAiResult(cached.content);
        setAiLoading(false);
        return;
      }
    }

    incrementAiUsage();
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content: body, title, language }),
      });
      const json = await res.json();
      setAiResult(json.result ?? json.error ?? "Something went wrong.");
    } catch {
      setAiResult("AI is unavailable right now. Please try again.");
    }
    setAiLoading(false);
  };

  const applyAiResult = () => {
    if (aiAction === "excerpt") {
      // Just show it — user can copy
    } else if (aiAction === "continue") {
      setBody(body.trimEnd() + "\n\n" + aiResult);
      onBodyResize();
    } else {
      setBody(aiResult);
      onBodyResize();
    }
    setAiOpen(false);
    setAiResult("");
  };

  // ── Publish / Update ───────────────────────────────────────────────────────
  const handlePublish = async () => {
    if (!title.trim() || !body.trim() || !category || wc < MIN_WORDS) return;
    setError(""); setPublishing(true);
    if (!supabase || !user) {
      setError("Not connected. Please sign in and ensure the backend is configured.");
      setPublishing(false); return;
    }

    const excerpt = body.split("\n\n").find(p => p.trim().length > 40)?.slice(0, 200) ?? body.slice(0, 200);
    const payload = {
      title: title.trim(), content: body.trim(), excerpt, category, language,
      tags, readTime: rt, anonymous,
      seriesTitle: seriesTitle.trim() || undefined,
      seriesPart: seriesPart !== "" ? Number(seriesPart) : undefined,
    };

    if (isEditing && editId) {
      const { error: err } = await updateStory(editId, payload);
      if (err) { setError(err.message); setPublishing(false); return; }
      setPublished(true);
      setPublishedId(editId);
    } else {
      const { data, error: err } = await publishStory({ authorId: user.id, ...payload });
      if (err) { setError(err.message); setPublishing(false); return; }
      localStorage.removeItem(DRAFT_KEY);
      setPublished(true);
      setPublishedId((data as Story)?.id ?? null);
    }
    setPublishing(false);
  };

  const selectedLang = LANGUAGES.find(l => l.code === language);
  const isRTL = language === "ur" || language === "ar";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center paper-page">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#F5A623", borderTopColor: "transparent" }} />
    </div>
  );

  if (published) return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden paper-page">
      <GoldenInkSplash />
      <div className="text-center max-w-md relative z-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(217,140,31,0.35)" }}>
          <CheckCheck size={28} style={{ color: "#B5701A" }} />
        </div>
        <h2 className="font-display text-3xl font-bold mb-3" style={{ color: "#2B2014" }}>
          {isEditing ? "Story updated!" : "Story published!"}
        </h2>
        <p className="mb-8 text-sm" style={{ color: "#7A6A50" }}>
          Your story is live and can be read by anyone. It will find the people who need it.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          {publishedId && (
            <Link href={`/story/${publishedId}`}
              className="px-6 py-3 rounded-full font-semibold text-sm transition-all hover:scale-105"
              style={{ background: "#F5A623", color: "#2B2014" }}>
              Read your story
            </Link>
          )}
          <Link href="/explore"
            className="px-6 py-3 rounded-full text-sm transition-all"
            style={{ border: "1px solid rgba(217,140,31,0.3)", color: "#5A4D38" }}>
            See all stories
          </Link>
          <button onClick={() => { setPublished(false); setTitle(""); setBody(""); setTags([]); setAnonymous(false); setSeriesTitle(""); setSeriesPart(""); setIsEditing(false); }}
            className="px-6 py-3 rounded-full text-sm transition-all"
            style={{ border: "1px solid rgba(0,0,0,0.08)", color: "#9C8B6F" }}>
            Write another
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen paper-page">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md"
        style={{ borderBottom: "1px solid rgba(120,90,50,0.18)", background: "rgba(244,236,220,0.85)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-sm flex-shrink-0" style={{ color: "#7A6A50" }}>
            <ArrowLeft size={15} /><span className="hidden sm:inline">Lekhsetu</span>
          </Link>
          <div className="flex items-center gap-2 flex-1 justify-end">
            {isEditing && (
              <span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(245,166,35,0.15)", color: "#B5701A" }}>
                Editing
              </span>
            )}
            <span className="text-xs font-mono hidden sm:block" style={{ color: "#9C8B6F" }}>{wc} words · {rt} min</span>
            <button onClick={() => setPreview(!preview)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all"
              style={{ border: "1px solid rgba(120,90,50,0.25)", color: "#5A4D38" }}>
              <Eye size={11} />{preview ? "Edit" : "Preview"}
            </button>
            <div className="flex flex-col items-end gap-0.5">
              <button ref={publishRef} onClick={handlePublish} disabled={!title.trim() || !body.trim() || !category || wc < MIN_WORDS || publishing}
                className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full font-semibold transition-all disabled:opacity-30"
                style={{ background: "#F5A623", color: "#2B2014" }}>
                {publishing ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                {publishing ? "Saving…" : isEditing ? "Update" : "Publish"}
              </button>
              {!publishing && (!category || wc < MIN_WORDS) && (title.trim() || body.trim()) && (
                <span className="text-[10px]" style={{ color: "#9C8B6F" }}>
                  {!category ? "Pick a category" : `${MIN_WORDS - wc} more words needed`}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Draft restore banner */}
      {showDraftBanner && !draftRestored && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
          <div className="flex items-center justify-between px-4 py-3 rounded-xl"
            style={{ background: "rgba(217,140,31,0.08)", border: "1px solid rgba(217,140,31,0.25)" }}>
            <p className="text-sm" style={{ color: "#5A4D38" }}>You have an unsaved draft. Restore it?</p>
            <div className="flex gap-2">
              <button onClick={restoreDraft}
                className="text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ background: "#F5A623", color: "#2B2014" }}>Restore</button>
              <button onClick={() => { localStorage.removeItem(DRAFT_KEY); setShowDraftBanner(false); }}
                className="text-xs px-3 py-1.5 rounded-full"
                style={{ color: "#9C8B6F", border: "1px solid rgba(0,0,0,0.08)" }}>Discard</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!preview ? (
          <>
            {/* Toolbar */}
            <div className="sticky z-50 flex items-center gap-1 flex-wrap gap-y-2 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 mb-4"
              style={{
                top: "57px",
                borderBottom: "1px solid rgba(120,90,50,0.12)",
                background: "rgba(244,236,220,0.97)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}>

              {/* Format buttons */}
              {([
                { Icon: Bold,   action: "bold" as const,    title: "Bold (**text**)" },
                { Icon: Italic, action: "italic" as const,  title: "Italic (*text*)" },
                { Icon: List,   action: "list" as const,    title: "List item" },
                { Icon: Link2,  action: "link" as const,    title: "Link [text](url)" },
                { Icon: Quote,  action: "quote" as const,   title: "Block quote" },
              ]).map(({ Icon, action, title: t }) => (
                <button key={action} title={t} onClick={() => insertFormat(action)}
                  className="w-8 h-8 flex items-center justify-center rounded transition-all hover:bg-black/5 active:scale-90"
                  style={{ color: "#9C8B6F" }}>
                  <Icon size={13} />
                </button>
              ))}

              <div className="w-px h-5 mx-1" style={{ background: "rgba(120,90,50,0.15)" }} />

              {/* Language */}
              <div className="flex items-center gap-1">
                <div className="relative">
                  {langOpen && createPortal(<div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />, document.body)}
                  <button onClick={() => setLangOpen(!langOpen)}
                    className="relative z-50 flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-all"
                    style={{ border: "1px solid rgba(120,90,50,0.2)", color: "#5A4D38" }}>
                    {selectedLang?.native ?? "English"} <ChevronDown size={10} />
                  </button>
                  {langOpen && (
                    <div className="absolute left-0 top-full mt-1 w-52 max-h-64 overflow-y-auto rounded-xl shadow-xl z-50 py-1"
                      style={{ background: "#FBF6EA", border: "1px solid rgba(120,90,50,0.18)" }}>
                      {LANGUAGES.map(l => (
                        <button key={l.code} onClick={() => {
                          if (l.code === language) { setLangOpen(false); return; }
                          if ((title.trim() || body.trim()) && !window.confirm("Switching the writing language will clear your title and story so far, so you can write fresh in the new language. Continue?")) {
                            return;
                          }
                          setTitle("");
                          setBody("");
                          titleAnchorRef.current = 0;
                          bodyAnchorRef.current = 0;
                          if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
                          if (bodyTimerRef.current) clearTimeout(bodyTimerRef.current);
                          translateGenRef.current++;
                          titleBusyRef.current = false;
                          bodyBusyRef.current = false;
                          setTitleTranslating(false);
                          setBodyTranslating(false);
                          onBodyResize();
                          setLanguage(l.code);
                          setLangOpen(false);
                        }}
                          className="flex items-center justify-between w-full px-4 py-2 text-xs text-left transition-colors hover:bg-black/5"
                          style={{ color: language === l.code ? "#B5701A" : "#5A4D38" }}>
                          <span>{l.label}</span>
                          <span style={{ color: "#9C8B6F" }}>{l.native}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Auto-translate indicator */}
              {language !== "en" && (titleTranslating || bodyTranslating) && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                  style={{ color: "#B5701A" }} title={`Translating to ${selectedLang?.label}…`}>
                  <Loader2 size={11} className="animate-spin" /> Translating…
                </span>
              )}

              {/* Category */}
              <div className="relative">
                {catOpen && createPortal(<div className="fixed inset-0 z-40" onClick={() => setCatOpen(false)} />, document.body)}
                <button onClick={() => setCatOpen(!catOpen)}
                  className="flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-all relative z-50"
                  style={category
                    ? { border: `1px solid ${CATEGORIES.find(c => c.id === category)!.color}55`, color: CATEGORIES.find(c => c.id === category)!.color, background: CATEGORIES.find(c => c.id === category)!.color + "12" }
                    : { border: "1px solid rgba(217,140,31,0.4)", color: "#D98C1F", background: "rgba(217,140,31,0.07)" }
                  }>
                  {category
                    ? <>{CATEGORIES.find(c => c.id === category)!.emoji} {CATEGORIES.find(c => c.id === category)!.label}</>
                    : <>Category <span style={{ fontWeight: 700 }}>*</span></>}
                  <ChevronDown size={10} style={{ marginLeft: 2, opacity: 0.6, transform: catOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                </button>
                {catOpen && (
                  <div className="absolute left-0 top-full mt-1 w-48 max-h-72 overflow-y-auto rounded-xl shadow-xl z-50 py-1 scrollbar-none"
                    style={{ background: "#FBF6EA", border: "1px solid rgba(120,90,50,0.18)", boxShadow: "0 8px 28px rgba(0,0,0,0.12)" }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat.id}
                        onClick={() => { setCategory(cat.id); setCatOpen(false); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors hover:bg-black/5"
                        style={{ color: category === cat.id ? cat.color : "#5A4D38", background: category === cat.id ? cat.color + "12" : "transparent" }}>
                        <span>{cat.emoji}</span>
                        <span className="flex-1">{cat.label}</span>
                        {category === cat.id && <span style={{ color: cat.color, fontWeight: 700 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-px h-5 mx-1" style={{ background: "rgba(120,90,50,0.15)" }} />

              {/* Series toggle */}
              <button ref={seriesRef} onClick={() => setShowSeries(!showSeries)} title="Add to a series"
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-all"
                style={showSeries
                  ? { background: "rgba(245,166,35,0.12)", color: "#B5701A", border: "1px solid rgba(217,140,31,0.25)" }
                  : { border: "1px solid rgba(120,90,50,0.15)", color: "#9C8B6F" }}>
                <Layers size={11} /> Series
              </button>

              {/* Anonymous toggle */}
              <button ref={visibilityRef} onClick={() => setAnonymous(!anonymous)} title="Post anonymously"
                className="flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-all"
                style={anonymous
                  ? { background: "rgba(245,166,35,0.12)", color: "#B5701A", border: "1px solid rgba(217,140,31,0.25)" }
                  : { border: "1px solid rgba(120,90,50,0.15)", color: "#9C8B6F" }}>
                <EyeOff size={11} /> {anonymous ? "Anonymous" : "Public"}
              </button>


              {/* AI assistant */}
              <div className="relative ml-auto">
                {aiOpen && !aiLoading && !aiResult && createPortal(<div className="fixed inset-0 z-40" onClick={() => setAiOpen(false)} />, document.body)}
                <button onClick={() => setAiOpen(!aiOpen)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full transition-all relative z-50"
                  style={{ background: "rgba(245,166,35,0.1)", color: aiUsedToday >= AI_DAILY_LIMIT ? "#6B6354" : "#F5A623", border: "1px solid rgba(245,166,35,0.2)" }}>
                  <Sparkles size={11} /> AI
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{AI_DAILY_LIMIT - aiUsedToday}/{AI_DAILY_LIMIT}</span>
                </button>
                {aiOpen && !aiLoading && !aiResult && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl shadow-2xl z-50 p-2 backdrop-blur-xl"
                    style={{
                      background: "linear-gradient(160deg, rgba(20,15,9,0.97), rgba(8,6,3,0.97))",
                      border: "1px solid rgba(245,166,35,0.2)",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)",
                    }}>
                    {[
                      { label: "Continue writing", desc: "Beat writer's block, AI picks up where you left off", action: "continue",  Icon: PenLine,     c: "#FCD34D" },
                      { label: "Improve writing",  desc: "Polish tone & flow, keep your voice",     action: "improve",   Icon: Sparkles,    c: "#F5A623" },
                      { label: "Generate excerpt",  desc: "Short, compelling summary for the preview card", action: "excerpt",    Icon: FileText,    c: "#5BA3E0" },
                      { label: "Fix grammar",       desc: "Clean up spelling & punctuation, meaning unchanged", action: "grammar",   Icon: SpellCheck2, c: "#6DBF67" },
                      { label: language === "en" ? "Translate to Hindi" : "Translate to English", desc: "Reach readers in another language", action: "translate", Icon: Languages, c: "#C084FC" },
                    ].map(({ label, desc, action, Icon, c }) => (
                      <button key={action} disabled={!body.trim()} onClick={() => runAi(action)}
                        className="group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:translate-x-0.5 disabled:opacity-40 disabled:hover:translate-x-0"
                        style={{ background: "transparent" }}
                        onMouseEnter={e => { if (body.trim()) e.currentTarget.style.background = `linear-gradient(90deg, ${c}1A, transparent)`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                          style={{ background: `${c}18`, color: c }}>
                          <Icon size={14} />
                        </div>
                        <div>
                          <div className="text-xs font-medium" style={{ color: "#F0EAD6" }}>{label}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: "#6B6354" }}>{desc}</div>
                        </div>
                      </button>
                    ))}
                    {!body.trim() && (
                      <p className="text-[11px] px-3 pt-1 pb-1" style={{ color: "#6B6354" }}>
                        Write a bit first, AI works with your story so far.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Series fields */}
            {showSeries && (
              <div className="flex gap-3 mb-5 items-center">
                <input
                  value={seriesTitle}
                  onChange={e => setSeriesTitle(e.target.value)}
                  placeholder="Series name (e.g. My Career Journey)"
                  className="flex-1 bg-transparent text-sm focus:outline-none px-3 py-2 rounded-lg"
                  style={{ border: "1px solid rgba(217,140,31,0.2)", color: "#5A4D38" }}
                />
                <input
                  type="number"
                  value={seriesPart}
                  onChange={e => setSeriesPart(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Part #"
                  min={1}
                  className="w-20 bg-transparent text-sm focus:outline-none px-3 py-2 rounded-lg text-center"
                  style={{ border: "1px solid rgba(217,140,31,0.2)", color: "#5A4D38" }}
                />
              </div>
            )}

            {/* Writing prompts (shown when title is empty) */}
            {!title.trim() && !isEditing && (
              <div ref={promptsRef} className="mb-6 p-4 rounded-xl" style={{ border: "1px solid rgba(120,90,50,0.1)", background: "rgba(120,90,50,0.04)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={13} style={{ color: "#D98C1F" }} />
                  <span className="text-xs font-medium" style={{ color: "#9C8B6F" }}>Writing prompts</span>
                </div>
                <p className={`text-sm leading-relaxed ${language !== "en" ? "mb-1" : "mb-3"}`} style={{ color: "#5A4D38" }}>
                  {language !== "en" && promptTranslations[`${language}:${activePromptIdx}`]
                    ? promptTranslations[`${language}:${activePromptIdx}`]
                    : PROMPTS[activePromptIdx]}
                </p>
                {language !== "en" && (
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: "#B0A48C" }}>
                    {promptTranslations[`${language}:${activePromptIdx}`]
                      ? PROMPTS[activePromptIdx]
                      : promptTranslating ? "Translating…" : ""}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <button onClick={() => setTitle(
                      language !== "en" && promptTranslations[`${language}:${activePromptIdx}`]
                        ? promptTranslations[`${language}:${activePromptIdx}`]
                        : PROMPTS[activePromptIdx]
                    )}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{ background: "rgba(217,140,31,0.12)", color: "#B5701A", border: "1px solid rgba(217,140,31,0.25)" }}>
                    Use this prompt
                  </button>
                  <button onClick={() => setActivePromptIdx((activePromptIdx + 1) % PROMPTS.length)}
                    className="text-xs" style={{ color: "#B0A48C" }}>
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Editor */}
            <div ref={editorAreaRef}>
              <textarea
                ref={titleRef}
                value={title}
                onChange={handleTitleChange}
                dir={isRTL ? "rtl" : "ltr"}
                placeholder={language === "en" ? "Your story's title…" : `Your story's title, in ${selectedLang?.label}…`}
                rows={2}
                className="paper-input w-full bg-transparent font-display text-3xl md:text-4xl font-bold resize-none focus:outline-none mb-5 leading-tight"
                style={{ color: "#2B2014", textAlign: isRTL ? "right" : "left" }}
              />

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6 items-center">
                {tags.map(t => (
                  <span key={t} onClick={() => setTags(tags.filter(x => x !== t))}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full cursor-pointer"
                    style={{ border: "1px solid #D98C1F", background: "rgba(217,140,31,0.1)", color: "#B5701A" }}>
                    #{t} ×
                  </span>
                ))}
                {tags.length < 5 && (
                  <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{ border: "1px solid rgba(120,90,50,0.2)", color: "#9C8B6F" }}>
                    #
                    <input
                      value={tagInput}
                      onChange={handleTagChange}
                      onKeyDown={addTag}
                      onPaste={handleTagPaste}
                      placeholder={tags.length === 0 ? "tag1, tag2, tag3…" : "add more"}
                      className="paper-input bg-transparent focus:outline-none"
                      style={{ color: "#7A6A50", minWidth: 90 }}
                    />
                  </span>
                )}
              </div>

              {/* Body */}
              <textarea
                ref={bodyRef}
                value={body}
                onChange={handleBodyChange}
                dir={isRTL ? "rtl" : "ltr"}
                rows={20}
                placeholder={`Tell your story in ${selectedLang?.label ?? "English"}.\n\nWhat did you learn? What do others need to hear?\nWrite freely, your voice matters.\n\nTip: **bold**, *italic*, > quote, - list item`}
                className="paper-input w-full bg-transparent resize-none focus:outline-none text-base leading-8 font-serif"
                style={{ color: "#3A2E1F", minHeight: 400, textAlign: isRTL ? "right" : "left" }}
              />
            </div>

            {error && (
              <p className="mt-4 text-xs px-3 py-2 rounded-lg"
                style={{ background: "rgba(239,68,68,0.08)", color: "#B91C1C", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </p>
            )}
          </>
        ) : (
          /* Preview mode */
          <article dir={isRTL ? "rtl" : "ltr"} style={{ textAlign: isRTL ? "right" : "left" }}>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedLang && language !== "en" && (
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ border: "1px solid rgba(180,140,60,0.35)", color: "#7A6A50" }}>
                  {selectedLang.native}
                </span>
              )}
              {anonymous && (
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.05)", color: "#7A6A50" }}>
                  Anonymous
                </span>
              )}
              {seriesTitle && (
                <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(217,140,31,0.1)", color: "#B5701A", border: "1px solid rgba(217,140,31,0.2)" }}>
                  <Layers size={10} className="inline mr-1" />{seriesTitle}{seriesPart ? ` · Part ${seriesPart}` : ""}
                </span>
              )}
              {tags.map(t => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(217,140,31,0.1)", color: "#B5701A", border: "1px solid rgba(217,140,31,0.2)" }}>
                  #{t}
                </span>
              ))}
            </div>
            <h1 className="font-display text-4xl font-bold mb-3" style={{ color: "#2B2014" }}>{title || "Untitled"}</h1>
            <div className="text-xs mb-8" style={{ color: "#9C8B6F" }}>{rt} min read · {wc} words</div>
            {body.split("\n\n").map((p, i) => (
              <p key={i} className="leading-8 mb-5 font-serif" style={{ color: "#3A2E1F" }}>{p}</p>
            ))}
          </article>
        )}
      </div>

      {/* AI result panel */}
      {aiOpen && (aiLoading || aiResult) && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-2xl rounded-2xl p-6"
            style={{ background: "#1E1810", border: "1px solid rgba(245,166,35,0.2)", maxHeight: "80vh", overflowY: "auto" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} style={{ color: "#F5A623" }} />
                <span className="font-medium text-sm" style={{ color: "#F0EAD6" }}>
                  {aiAction === "improve" ? "Improved writing" :
                   aiAction === "excerpt" ? "Generated excerpt" :
                   aiAction === "grammar" ? "Grammar fixed" :
                   aiAction === "continue" ? "Continuation" : "Translation"}
                </span>
              </div>
              <button onClick={() => { setAiOpen(false); setAiResult(""); }}
                style={{ color: "#6B6354" }}><X size={16} /></button>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center">
                <Loader2 size={20} className="animate-spin" style={{ color: "#F5A623" }} />
                <span className="text-sm" style={{ color: "#6B6354" }}>Thinking…</span>
              </div>
            ) : aiResult === "__limit__" ? (
              <div className="text-center py-8">
                <div style={{ fontSize: 40, marginBottom: 16 }}>✋</div>
                <p className="font-semibold text-sm mb-2" style={{ color: "#F0EAD6" }}>Daily AI limit reached</p>
                <p className="text-xs leading-relaxed" style={{ color: "#6B6354" }}>
                  You have used all {AI_DAILY_LIMIT} free AI assists for this week. Your limit resets every Monday.
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm leading-relaxed mb-5 whitespace-pre-wrap" style={{ color: "#B8AE98" }}>{aiResult}</p>
                <div className="flex gap-3">
                  {aiAction !== "excerpt" && (
                    <button onClick={applyAiResult}
                      className="px-4 py-2 rounded-full text-sm font-semibold"
                      style={{ background: "#F5A623", color: "#0B0907" }}>
                      {aiAction === "continue" ? "Add to story" : "Apply to story"}
                    </button>
                  )}
                  <button onClick={() => { setAiOpen(false); setAiResult(""); }}
                    className="px-4 py-2 rounded-full text-sm"
                    style={{ border: "1px solid rgba(255,255,255,0.1)", color: "#6B6354" }}>
                    Dismiss
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center paper-page">
        <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "#F5A623", borderTopColor: "transparent" }} />
      </div>
    }>
      <WritePageInner />
    </Suspense>
  );
}
