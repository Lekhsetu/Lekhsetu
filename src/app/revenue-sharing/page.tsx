import Link from "next/link";
import { ArrowLeft, Coins, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RevenueSharingPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Navbar theme="light" />
      <div className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(245,166,35,0.12)", color: "#F5A623" }}>
          <Coins size={28} />
        </div>

        <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium tracking-wide mb-4"
          style={{ background: "rgba(245,166,35,0.12)", color: "#F5A623" }}>
          <Sparkles size={11} /> Coming soon
        </span>

        <h1 className="font-display text-4xl font-bold text-ink mb-4">Your stories, your growth</h1>
        <p className="text-muted leading-relaxed mb-2">
          We&apos;re quietly building something for the writers who keep showing up, a way for your
          stories to start giving back to you too. Your words, your language, maybe even your income.
        </p>
        <p className="text-muted leading-relaxed">
          We warmly welcome writers and creators from every corner of the world. Full details on
          eligibility, payouts, and how earnings will be calculated will be announced here before launch.
          Keep writing, every story you publish today helps build the readership that will power your
          earnings when this goes live.
        </p>

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm mt-10 transition-colors hover:text-ink"
          style={{ color: "#6B6354" }}>
          <ArrowLeft size={14} /> Back to home
        </Link>
      </div>
      <Footer />
    </div>
  );
}
