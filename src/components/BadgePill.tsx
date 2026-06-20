import { BADGE_META, type BadgeType } from "@/services/badges";

interface BadgePillProps {
  type: BadgeType;
  size?: "sm" | "md";
}

export default function BadgePill({ type, size = "sm" }: BadgePillProps) {
  const meta = BADGE_META[type];
  if (!meta) return null;
  const cls = size === "md"
    ? "px-3 py-1.5 text-sm gap-1.5"
    : "px-2 py-0.5 text-xs gap-1";
  return (
    <span
      title={meta.description}
      className={`inline-flex items-center rounded-full font-medium whitespace-nowrap ${cls}`}
      style={{ background: `${meta.color}18`, color: meta.color, border: `1px solid ${meta.color}40` }}
    >
      {meta.emoji} {meta.label}
    </span>
  );
}
