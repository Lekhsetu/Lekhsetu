"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export type TourStep = {
  ref: React.RefObject<HTMLElement | null>;
  title: string;
  desc: string;
  placement?: "bottom" | "top";
};

const TOUR_KEY = "lekhsetu_write_tour_done";

export function tourDone() {
  return typeof window !== "undefined" && localStorage.getItem(TOUR_KEY) === "1";
}

export function markTourDone() {
  localStorage.setItem(TOUR_KEY, "1");
}

export default function WriteTour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Skip steps whose target isn't rendered (e.g. prompts box hidden once a title exists)
    if (idx >= steps.length) { onDone(); return; }
    const el = steps[idx]?.ref.current;
    if (!el) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdx(i => i + 1);
      return;
    }

    const update = () => setRect(el.getBoundingClientRect());
    update();
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    const t = setTimeout(update, 280);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [idx, steps, onDone]);

  if (idx >= steps.length || !rect) return null;
  const step = steps[idx];
  const pad = 6;
  const isLast = idx === steps.length - 1;

  const placement = step.placement ?? (rect.bottom + 160 > window.innerHeight ? "top" : "bottom");
  const tooltipTop = placement === "bottom" ? rect.bottom + pad + 14 : undefined;
  const tooltipBottom = placement === "top" ? window.innerHeight - rect.top + pad + 14 : undefined;
  const tooltipLeft = Math.min(Math.max(rect.left, 12), Math.max(12, window.innerWidth - 312));

  return (
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: "none" }}>
      {/* Spotlight cutout */}
      <div
        className="fixed transition-all duration-300 ease-out rounded-xl"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: "0 0 0 9999px rgba(11,9,7,0.6)",
          border: "2px solid #F5A623",
          pointerEvents: "none",
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed w-72 rounded-2xl p-4 shadow-2xl"
        style={{
          top: tooltipTop,
          bottom: tooltipBottom,
          left: tooltipLeft,
          background: "#1E1810",
          border: "1px solid rgba(245,166,35,0.25)",
          pointerEvents: "auto",
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold" style={{ color: "#F0EAD6" }}>{step.title}</h3>
          <button onClick={() => { markTourDone(); onDone(); }} style={{ color: "#6B6354" }}>
            <X size={14} />
          </button>
        </div>
        <p className="text-xs leading-relaxed mb-3" style={{ color: "#B8AE98" }}>{step.desc}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: "#6B6354" }}>{idx + 1} / {steps.length}</span>
          <div className="flex gap-2">
            <button onClick={() => { markTourDone(); onDone(); }}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{ color: "#9C8B6F", border: "1px solid rgba(255,255,255,0.08)" }}>
              Skip
            </button>
            <button
              onClick={() => isLast ? (markTourDone(), onDone()) : setIdx(i => i + 1)}
              className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: "#F5A623", color: "#1E1810" }}>
              {isLast ? "End Tour" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
