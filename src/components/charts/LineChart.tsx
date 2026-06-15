export type ChartPoint = { label: string; value: number };

/** Lightweight SVG line/area chart for small time-series — no charting library needed. */
export default function LineChart({ data, color = "#F5A623", height = 100 }: { data: ChartPoint[]; color?: string; height?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 100;
  const stepX = data.length > 1 ? w / (data.length - 1) : 0;
  const points = data.map((d, i) => {
    const x = data.length > 1 ? i * stepX : w / 2;
    const y = height - (d.value / max) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const linePoints = points.join(" ");
  const areaPoints = `0,${height} ${linePoints} ${w},${height}`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <polyline points={areaPoints} fill={`${color}1A`} stroke="none" />
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between text-[10px] mt-1" style={{ color: "#6B6354" }}>
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}
