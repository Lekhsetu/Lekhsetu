"use client";
import { useState, useEffect } from "react";
import { CATEGORIES, LEGACY_CATEGORIES } from "@/constants";

const cat = (id: string) =>
  CATEGORIES.find(c => c.id === id) ??
  LEGACY_CATEGORIES.find(c => c.id === id) ??
  { color: "#e8751a", emoji: "📖", label: id };

const PROMPTS = [
  { q: "Failed an exam three times before finally getting in? That's exactly the kind of story someone needs to read tonight.", catId: "exams" },
  { q: "Most people never write down how a layoff actually felt. Yours could be the first honest account someone finds.", catId: "layoff" },
  { q: "Grew up between two cultures and never had the words for it? Someone reading this has felt the same thing and never said it out loud.", catId: "culture" },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setActive(a => (a + 1) % PROMPTS.length); setFade(true); }, 280);
    }, 5000);
    return () => clearInterval(iv);
  }, []);
  const t = PROMPTS[active];
  const c = cat(t.catId);
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "#0E0B07" }}>
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="h-rule w-10" /><span className="text-xs tracking-widest uppercase" style={{ color: "#F5A623" }}>The stories waiting to be written</span><div className="h-rule w-10" />
        </div>
        <div className={`transition-all duration-280 ${fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          style={{ transition: "opacity 0.28s ease,transform 0.28s ease", transform: fade ? "translateY(0)" : "translateY(8px)" }}>
          <p className="font-display text-xl md:text-2xl font-medium leading-relaxed mb-8" style={{ color: "#F0EAD6" }}>
            {t.q}
          </p>
          <div className="flex items-center justify-center">
            <span className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: `${c.color}20`, color: c.color }}>
              {c.emoji} {c.label}
            </span>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-10">
          {PROMPTS.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: i === active ? "20px" : "6px", height: "6px", background: i === active ? "#F5A623" : "#3A3028" }} />
          ))}
        </div>
      </div>
    </section>
  );
}
