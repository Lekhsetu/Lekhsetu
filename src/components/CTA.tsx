"use client";
import Link from "next/link";
import { ArrowRight, PenLine } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-28 relative overflow-hidden" style={{ background: "#0B0907" }}>

      {/* Morphing ink-blob backgrounds */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute anim-blob anim-breathe"
          style={{
            width: 520, height: 520,
            left: "-12%", top: "-35%",
            background: "radial-gradient(circle, rgba(245,166,35,0.055) 0%, transparent 70%)",
            borderRadius: "60% 40% 70% 30%/50% 60% 40% 70%",
          }} />
        <div className="absolute anim-blob anim-breathe"
          style={{
            width: 420, height: 420,
            right: "-10%", bottom: "-22%",
            background: "radial-gradient(circle, rgba(245,140,20,0.045) 0%, transparent 70%)",
            borderRadius: "40% 60% 30% 70%/70% 40% 60% 30%",
            animationDelay: "-5s, -3s",
          }} />
        <div className="absolute anim-blob anim-breathe"
          style={{
            width: 300, height: 300,
            left: "42%", top: "8%",
            background: "radial-gradient(circle, rgba(245,150,20,0.03) 0%, transparent 70%)",
            borderRadius: "70% 30% 50% 50%/30% 70% 60% 40%",
            animationDelay: "-8s, -6s",
          }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: "linear-gradient(rgba(245,166,35,1) 1px,transparent 1px),linear-gradient(90deg,rgba(245,166,35,1) 1px,transparent 1px)",
          backgroundSize: "72px 72px",
        }} />

      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">

        {/* Magnetic-pulsing pen icon */}
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 anim-magnetic transition-transform duration-300 hover:scale-110 hover:rotate-6"
          style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)" }}>
          <PenLine size={28} style={{ color: "#F5A623" }} />
        </div>

        <h2 className="font-display font-black text-cream mb-6 leading-tight"
          style={{ fontSize: "clamp(2.5rem,7vw,5rem)" }}>
          Your story is already<br />
          <span className="shimmer">written inside you.</span>
        </h2>

        <p className="text-lg mb-10 max-w-xl mx-auto leading-relaxed"
          style={{ color: "#B8AE98", fontWeight: 300 }}>
          Someone out there needs exactly what you&apos;ve lived through. Write in your language. Reach readers worldwide.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth?mode=signup"
            className="flex items-center gap-2 font-semibold px-8 py-4 rounded-full text-base transition-all hover:scale-105 active:scale-95 w-full sm:w-auto justify-center anim-magnetic"
            style={{ background: "#F5A623", color: "#0B0907" }}>
            Create free account <ArrowRight size={16} />
          </Link>
          <Link href="/explore"
            className="flex items-center gap-2 px-8 py-4 rounded-full text-base transition-all w-full sm:w-auto justify-center hover:border-gold-dim"
            style={{ border: "1px solid rgba(245,166,35,0.2)", color: "#B8AE98" }}>
            Browse stories
          </Link>
        </div>

        <p className="mt-8 text-xs" style={{ color: "#3A3028" }}>
          Free to read · Free account to write · 20+ languages supported
        </p>
      </div>
    </section>
  );
}
