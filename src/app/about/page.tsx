import Link from "next/link";
import { PenLine, Heart, Users, Globe2, Sparkles, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "About Us: Lekhsetu" };

const VALUES = [
  { icon: PenLine, title: "Every story matters", desc: "From a first job rejection to a life-changing trip, if it taught you something, it belongs here." },
  { icon: Heart, title: "Honesty over polish", desc: "We'd rather read something real and a little rough than something perfect and empty." },
  { icon: Users, title: "Built for readers too", desc: "Lekhsetu isn't just a place to write. It's a place to find someone who's been where you are." },
  { icon: Globe2, title: "Open to everyone", desc: "Free to read, free to write, in any language you're comfortable in." },
  { icon: Sparkles, title: "Anonymous when you need it", desc: "Some stories are easier to tell without a name attached. We make that possible." },
  { icon: ShieldCheck, title: "Safe by design", desc: "Moderation, reporting, and clear community guidelines keep the platform respectful." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar theme="light" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-rule w-10" />
            <span className="text-xs tracking-widest uppercase" style={{ color: "#F5A623" }}>About Lekhsetu</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black text-ink mb-4">
            Where stories bridge lives.
          </h1>
          <p className="text-muted text-lg leading-relaxed">
            Lekhsetu, from <span className="italic">lekh</span> (writing) and <span className="italic">setu</span> (bridge),
            is a place where real experiences become a bridge to someone else&rsquo;s next decision.
            Career setbacks, life lessons, quiet wins, hard-earned advice: the things people usually
            only share with close friends, written down so they can help a stranger too.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-ink mb-4">What we&rsquo;re building</h2>
          <div className="space-y-3 text-sm leading-7 text-muted">
            <p>
              Most of the internet rewards hot takes and whatever the algorithm decides to push.
              Lekhsetu is built around something slower: <strong className="text-ink">writing that means something</strong>,
              told in 110 words, in the language you actually think in.
            </p>
            <p>
              A career change sits next to a short poem, next to a science explainer, next to a piece
              of fiction, next to a hard-earned life lesson. Different categories, same rule: it has to
              be genuinely yours, not generated, not padded, not written to please a feed.
            </p>
            <p>
              Writers can publish under their name or anonymously, organize stories by category, react
              to and comment on stories, and track how their writing is read and received, all in one
              simple, ad-free space.
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-ink mb-6">What we believe</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {VALUES.map(v => (
              <div key={v.title} className="rounded-2xl p-5 border border-border bg-paper">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: "rgba(245,166,35,0.12)", color: "#F5A623" }}>
                  <v.icon size={16} />
                </div>
                <h3 className="font-display font-bold text-ink mb-1.5">{v.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="font-display text-2xl font-bold text-ink mb-4">Made in India, for everyone</h2>
          <p className="text-sm leading-7 text-muted">
            Lekhsetu is built and run from India with readers and writers in mind across every
            background and language. Whether you&rsquo;re here to share your story or simply read
            someone else&rsquo;s, you&rsquo;re part of why this platform exists.
          </p>
          <p className="text-sm leading-7 mt-3 font-semibold text-ink">
            We respect all languages. All rights reserved &copy; Lekhsetu Private Limited.
          </p>
        </section>

        <div className="rounded-2xl p-6 sm:p-8 text-center" style={{ background: "#0B0907" }}>
          <h2 className="font-display text-2xl font-bold text-cream mb-2">Have a story to tell?</h2>
          <p className="text-sm mb-5" style={{ color: "#B8AE98" }}>
            It might be exactly what someone else needs to read today.
          </p>
          <Link href="/write"
            className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-full"
            style={{ background: "#F5A623", color: "#0B0907" }}>
            <PenLine size={14} /> Start writing
          </Link>
        </div>

        <div className="mt-10 pt-8 border-t border-border flex flex-wrap gap-4">
          <Link href="/faq" className="text-sm hover:text-saffron transition-colors text-muted">
            Frequently asked questions →
          </Link>
          <Link href="/privacy" className="text-sm hover:text-saffron transition-colors text-muted">
            Privacy Policy →
          </Link>
          <Link href="/terms" className="text-sm hover:text-saffron transition-colors text-muted">
            Terms of Service →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
