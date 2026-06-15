"use client";
import { useState, useEffect } from "react";
import { CATEGORIES } from "@/constants";

const cat = (id: string) => CATEGORIES.find(c => c.id === id)!;

const T = [
  { q: "I wrote about failing my entrance exam three times before finally getting in. I needed to read that it doesn't have to happen the first time.", catId: "exams" },
  { q: "Six months after a layoff, I finally wrote down everything I felt. Putting it into words, and reading others who'd been through the same thing, made it easier to move on.", catId: "layoff" },
  { q: "I shared what it's like growing up between two cultures. The comments were full of people who'd never had the words for that feeling either.", catId: "culture" },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setActive(a => (a + 1) % T.length); setFade(true); }, 280);
    }, 5000);
    return () => clearInterval(iv);
  }, []);
  const t = T[active];
  const c = cat(t.catId);
  return (
    <section className="py-24 relative overflow-hidden" style={{ background: "#0E0B07" }}>
      <div className="absolute top-12 left-1/2 -translate-x-1/2 font-display select-none pointer-events-none"
        style={{ fontSize: "220px", lineHeight: 1, color: "rgba(245,166,35,0.04)" }}>&#8220;</div>
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="h-rule w-10" /><span className="text-xs tracking-widest uppercase" style={{ color: "#F5A623" }}>Stories like these</span><div className="h-rule w-10" />
        </div>
        <div className={`transition-all duration-280 ${fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          style={{ transition: "opacity 0.28s ease,transform 0.28s ease", transform: fade ? "translateY(0)" : "translateY(8px)" }}>
          <blockquote className="font-display text-xl md:text-2xl font-medium leading-relaxed mb-8 italic" style={{ color: "#F0EAD6" }}>
            &ldquo;{t.q}&rdquo;
          </blockquote>
          <div className="flex items-center justify-center">
            <span className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: `${c.color}20`, color: c.color }}>
              {c.emoji} {c.label}
            </span>
          </div>
        </div>
        <div className="flex justify-center gap-2 mt-10">
          {T.map((_, i) => (
            <button key={i} onClick={() => setActive(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: i === active ? "20px" : "6px", height: "6px", background: i === active ? "#F5A623" : "#3A3028" }} />
          ))}
        </div>
      </div>
    </section>
  );
}
