"use client";

import { useState } from "react";

export type BarPoint = { label: string; value: number };

/** Lightweight interactive horizontal bar chart, no charting library needed. */
export default function BarChart({ data, color = "#F5A623" }: { data: BarPoint[]; color?: string }) {
  const [active, setActive] = useState<number | null>(null);

  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div
          key={i}
          className="rounded-lg -mx-2 px-2 py-1 transition-colors"
          style={{ background: active === i ? "rgba(245,166,35,0.08)" : "transparent", cursor: "default" }}
          onMouseEnter={() => setActive(i)}
          onMouseLeave={() => setActive(null)}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="truncate pr-2" style={{ color: "#3A3028", fontWeight: active === i ? 600 : 400 }}>{d.label}</span>
            <span className="flex-shrink-0 font-medium" style={{ color: active === i ? color : "#6B6354" }}>{d.value}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(11,9,7,0.06)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.value / max) * 100}%`, background: color, opacity: active === null || active === i ? 1 : 0.45 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
