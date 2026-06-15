"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toggleClap } from "@/services/reactions";

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

export default function ClapButton({
  storyId,
  initialTotal = 0,
  initialMine = 0,
  size = "sm",
}: {
  storyId: string;
  initialTotal?: number;
  initialMine?: number;
  size?: "sm" | "lg";
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [addedTotal, setAddedTotal] = useState(0);
  const [reacted, setReacted] = useState(initialMine > 0);
  const [flying, setFlying] = useState(false);

  const total = initialTotal + addedTotal;
  const isLg = size === "lg";

  const handleClick = async () => {
    if (!user) { router.push("/auth"); return; }

    const next = !reacted;
    setReacted(next);
    setAddedTotal(t => t + (next ? 1 : -1));

    if (next) {
      setFlying(true);
      setTimeout(() => setFlying(false), 1000);
    }

    await toggleClap(storyId, user.id);
  };

  return (
    <button
      onClick={handleClick}
      title={reacted ? "Tap again to remove your reaction" : "Show this story some love"}
      className={`relative inline-flex items-center gap-2 rounded-full border transition-all active:scale-95 ${isLg ? "px-5 py-3" : "px-3 py-1.5"}`}
      style={reacted
        ? { background: "rgba(245,166,35,0.12)", borderColor: "rgba(245,166,35,0.4)", color: "#F5A623" }
        : { borderColor: "rgba(255,255,255,0.08)", color: "#6B6354" }}>
      {flying && (
        <span className="anim-bird-fly absolute left-1/2 top-1/2 text-lg pointer-events-none">
          🕊️
        </span>
      )}
      <span className={isLg ? "text-xl" : "text-base"}>🕊️</span>
      <span className={`font-semibold ${isLg ? "text-sm" : "text-xs"}`}>{formatCount(total)}</span>
    </button>
  );
}
