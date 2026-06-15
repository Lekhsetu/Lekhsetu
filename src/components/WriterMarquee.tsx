"use client";
import {
  Briefcase, GraduationCap, Heart, Globe2, Sprout, Brain,
  Plane, Rocket, BookOpen, Users, Baby, Palette,
} from "lucide-react";

const PERSONAS = [
  { role: "Career switchers",      icon: Briefcase,     c: "#5BA3E0" },
  { role: "First-gen graduates",   icon: GraduationCap, c: "#F5A623" },
  { role: "New parents",           icon: Baby,          c: "#6DBF67" },
  { role: "Mental health advocates", icon: Heart,       c: "#F87171" },
  { role: "Returning expats",      icon: Globe2,        c: "#FCD34D" },
  { role: "Small-town dreamers",   icon: Sprout,        c: "#C084FC" },
  { role: "Climate researchers",   icon: Brain,         c: "#5BA3E0" },
  { role: "Solo travelers",        icon: Plane,         c: "#F5A623" },
  { role: "Startup founders",      icon: Rocket,        c: "#6DBF67" },
  { role: "Lifelong learners",     icon: BookOpen,      c: "#F87171" },
  { role: "Community organizers",  icon: Users,         c: "#FCD34D" },
  { role: "Creatives & artists",   icon: Palette,       c: "#C084FC" },
];

const Chip = ({ p }: { p: typeof PERSONAS[0] }) => (
  <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 rounded-full mx-2.5 transition-all duration-300 hover:scale-105"
    style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(30,24,16,0.8)" }}>
    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: `${p.c}18`, color: p.c }}>
      <p.icon size={16} />
    </div>
    <div className="text-sm font-medium whitespace-nowrap" style={{ color: "#F0EAD6" }}>{p.role}</div>
  </div>
);

export default function WriterMarquee() {
  const d = [...PERSONAS, ...PERSONAS];
  return (
    <section className="relative py-16 overflow-hidden"
      style={{
        background: "#141008",
        borderTop: "1px solid rgba(245,166,35,0.08)",
        borderBottom: "1px solid rgba(245,166,35,0.08)",
      }}>

      <div className="text-center mb-8">
        <span className="text-xs tracking-widest uppercase" style={{ color: "#6B6354" }}>
          Writing on Lekhsetu, from every corner of the world
        </span>
      </div>

      {/* Row 1 — hover pauses via CSS (.anim-marquee:hover) */}
      <div className="mb-4">
        <div className="flex anim-marquee">
          {d.map((p, i) => <Chip key={i} p={p} />)}
        </div>
      </div>

      {/* Row 2 */}
      <div>
        <div className="flex anim-marquee-rev">
          {[...d].reverse().map((p, i) => <Chip key={i} p={p} />)}
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
