"use client";

import { useState } from "react";

export type ChartPoint = { label: string; value: number };

/** Lightweight interactive SVG line/area chart for small time-series — no charting library needed. */
export default function LineChart({ data, color = "#F5A623", height = 100 }: { data: ChartPoint[]; color?: string; height?: number }) {
  const [active, setActive] = useState<number | null>(null);

  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 100;
  const stepX = data.length > 1 ? w / (data.length - 1) : 0;
  const coords = data.map((d, i) => {
    const x = data.length > 1 ? i * stepX : w / 2;
    const y = height - (d.value / max) * (height - 8) - 4;
    return { x, y };
  });
  const linePoints = coords.map(c => `${c.x},${c.y}`).join(" ");
  const areaPoints = `0,${height} ${linePoints} ${w},${height}`;

  const activePoint = active !== null ? coords[active] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height, overflow: "visible" }}
        onMouseLeave={() => setActive(null)}
      >
        <polyline points={areaPoints} fill={`${color}1A`} stroke="none" />
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {active !== null && (
          <line x1={coords[active].x} y1={0} x2={coords[active].x} y2={height} stroke={color} strokeWidth="0.5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" opacity={0.4} />
        )}
        {coords.map((c, i) => (
          <g key={i}>
            {/* invisible larger hit-area for hover/touch */}
            <circle
              cx={c.x}
              cy={c.y}
              r={4}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
              onTouchStart={() => setActive(i)}
              style={{ cursor: "pointer" }}
            />
            <circle
              cx={c.x}
              cy={c.y}
              r={active === i ? 2 : 1}
              fill={active === i ? color : "#fff"}
              stroke={color}
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
              pointerEvents="none"
            />
          </g>
        ))}
      </svg>
      {activePoint && (
        <div
          className="absolute pointer-events-none rounded-lg px-2 py-1 text-[11px] font-medium whitespace-nowrap shadow-sm"
          style={{
            left: `${activePoint.x}%`,
            top: `${(activePoint.y / height) * 100}%`,
            transform: `translate(${activePoint.x > 80 ? "-100%" : activePoint.x < 20 ? "0%" : "-50%"}, -130%)`,
            background: "#3A3028",
            color: "#FAF7F0",
            zIndex: 10,
          }}
        >
          {data[active!].label}: <span className="font-bold">{data[active!].value}</span>
        </div>
      )}
      <div className="flex justify-between text-[10px] mt-1" style={{ color: "#6B6354" }}>
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}
