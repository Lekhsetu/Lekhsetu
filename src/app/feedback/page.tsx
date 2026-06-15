"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle, MessageSquareHeart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { submitFeedback, type FeedbackCategory } from "@/services/feedback";

const CATEGORIES: { id: FeedbackCategory; label: string }[] = [
  { id: "general", label: "General feedback" },
  { id: "bug", label: "Report a bug" },
  { id: "idea", label: "Feature idea" },
  { id: "content", label: "Content / story issue" },
  { id: "other", label: "Other" },
];

export default function FeedbackPage() {
  const { user, profile } = useAuth();
  const pathname = usePathname();

  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [name, setName]         = useState(profile?.display_name || profile?.full_name || "");
  const [email, setEmail]       = useState(user?.email || "");
  const [message, setMessage]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true); setError("");
    const { error: err } = await submitFeedback({
      userId: user?.id ?? null,
      name, email, category, message, page: pathname,
    });
    setSubmitting(false);
    if (err) { setError("Something went wrong. Please try again."); return; }
    setDone(true);
    setMessage("");
  };

  const input = "w-full bg-transparent text-sm px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-saffron transition-colors text-ink";

  return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-8">
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-rule w-10" />
            <span className="text-xs tracking-widest uppercase flex items-center gap-1.5" style={{ color: "#F5A623" }}>
              <MessageSquareHeart size={12} /> Feedback
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold text-ink mb-3">Help us improve Lekhsetu</h1>
          <p className="text-muted">
            Found a bug, have an idea, or just want to tell us something? We read every message.
          </p>
        </div>

        {done ? (
          <div className="rounded-2xl p-8 text-center border border-border">
            <CheckCircle size={32} className="mx-auto mb-3" style={{ color: "#16a34a" }} />
            <p className="font-display text-xl font-bold text-ink mb-2">Thanks for the feedback!</p>
            <p className="text-sm text-muted mb-6">We&apos;ve received your message and will take a look.</p>
            <button onClick={() => setDone(false)}
              className="text-sm px-5 py-2.5 rounded-full font-semibold"
              style={{ background: "#F5A623", color: "#0B0907" }}>
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-2xl p-5 border border-border">
              <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>What is this about?</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.id} type="button" onClick={() => setCategory(c.id)}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
                    style={category === c.id
                      ? { background: "#F5A623", color: "#0B0907" }
                      : { border: "1px solid var(--border)", color: "#6B6354" }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl p-5 border border-border">
                <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>Your name (optional)</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" maxLength={60} className={input} />
              </div>
              <div className="rounded-2xl p-5 border border-border">
                <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>Email (optional)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={input} />
              </div>
            </div>

            <div className="rounded-2xl p-5 border border-border">
              <label className="block text-xs font-medium mb-2" style={{ color: "#6B6354" }}>Your feedback</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} required rows={6} maxLength={2000}
                placeholder="Tell us what's on your mind…"
                className="w-full bg-transparent text-sm px-4 py-3 rounded-xl border border-border focus:outline-none focus:border-saffron resize-none text-ink" />
              <p className="text-xs text-right mt-1" style={{ color: "#6B6354" }}>{message.length}/2000</p>
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting || !message.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
              style={{ background: "#F5A623", color: "#0B0907" }}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <MessageSquareHeart size={14} />}
              {submitting ? "Sending…" : "Send feedback"}
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
