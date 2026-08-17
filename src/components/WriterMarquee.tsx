"use client";
import { CATEGORIES } from "@/constants";

const Chip = ({ c }: { c: (typeof CATEGORIES)[number] }) => (
  <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-full mx-2.5 transition-all duration-300 hover:scale-105"
    style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(30,24,16,0.8)" }}>
    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base"
      style={{ background: `${c.color}18` }}>
      {c.emoji}
    </div>
    <div className="text-sm font-medium whitespace-nowrap" style={{ color: "#F0EAD6" }}>{c.label}</div>
  </div>
);

export default function WriterMarquee() {
  const d = [...CATEGORIES, ...CATEGORIES];
  return (
    <section className="relative py-16 overflow-hidden"
      style={{
        background: "#141008",
        borderTop: "1px solid rgba(245,166,35,0.08)",
        borderBottom: "1px solid rgba(245,166,35,0.08)",
      }}>

      <div className="text-center mb-8">
        <span className="text-xs tracking-widest uppercase" style={{ color: "#6B6354" }}>
          Every kind of story belongs here
        </span>
      </div>

      {/* Row 1, hover pauses via CSS (.anim-marquee:hover) */}
      <div className="mb-4">
        <div className="flex anim-marquee">
          {d.map((c, i) => <Chip key={i} c={c} />)}
        </div>
      </div>

      {/* Row 2 */}
      <div>
        <div className="flex anim-marquee-rev">
          {[...d].reverse().map((c, i) => <Chip key={i} c={c} />)}
        </div>
      </div>

      {/* Edge fades */}
      <div className="absolute inset-y-0 left-0 w-24 pointer-events-none"
        style={{ background: "linear-gradient(to right,#141008,transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-24 pointer-events-none"
        style={{ background: "linear-gradient(to left,#141008,transparent)" }} />
    </section>
  );
}
