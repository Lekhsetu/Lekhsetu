"use client";
import { useState } from "react";
import { Share2, Check } from "lucide-react";

type ShareButtonProps = {
  title: string;
  text?: string;
  url: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  iconSize?: number;
};

/** Shares a link via the native share sheet, or copies it to the clipboard as a fallback. */
export default function ShareButton({ title, text, url, label = "Share", className = "", style, iconSize = 18 }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing more we can do
    }
  };

  return (
    <button onClick={handleShare} title={label} className={className} style={style}>
      {copied ? <Check size={iconSize} /> : <Share2 size={iconSize} />}
      <span className="hidden sm:inline">{copied ? "Link copied!" : label}</span>
    </button>
  );
}
