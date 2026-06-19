"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Globe, ChevronDown } from "lucide-react";
import { LANGUAGES } from "@/constants";
import { getCachedTranslation, saveCachedTranslation, saveTranslationMemory } from "@/services/translationCache";

export type LanguageOption = { id: string; language: string };

export type TranslatedContent = { title: string; excerpt: string; content: string };

export default function LanguageSwitcher({
  current,
  options,
  storyId,
  storyTitle,
  storyExcerpt,
  storyContent,
  translatedLanguage,
  onTranslating,
  onTranslated,
  onShowOriginal,
}: {
  current: string;
  options: LanguageOption[];
  storyId?: string;
  storyTitle: string;
  storyExcerpt: string;
  storyContent: string;
  translatedLanguage?: string | null;
  onTranslating?: (targetCode: string) => void;
  onTranslated: (language: string, data: TranslatedContent) => void;
  onShowOriginal: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [translatingCode, setTranslatingCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const activeCode = translatedLanguage ?? current;
  const activeLang = LANGUAGES.find(l => l.code === activeCode);
  const availableCodes = new Set(options.map(o => o.language));
  const moreLanguages = LANGUAGES.filter(l => !availableCodes.has(l.code));

  const handleTranslate = async (code: string) => {
    setError(null);
    setOpen(false);
    setTranslatingCode(code);
    onTranslating?.(code);

    // Check cache first — zero API cost if already translated before
    if (storyId) {
      const cached = await getCachedTranslation(storyId, code);
      if (cached) {
        onTranslated(code, cached);
        setTranslatingCode(null);
        return;
      }
    }

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "translate_to",
          title: storyTitle,
          excerpt: storyExcerpt,
          content: storyContent,
          language: current,
          targetLanguage: code,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Translation failed");
      const result: TranslatedContent = {
        title: json.result.title,
        excerpt: json.result.excerpt ?? "",
        content: json.result.content,
      };
      onTranslated(code, result);
      // Save to cache + translation memory in background — never blocks the UI
      if (storyId) {
        saveCachedTranslation(storyId, code, result);
        saveTranslationMemory(current, code, storyContent, result.content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setTranslatingCode(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)}
        className="text-xs px-2.5 py-1 rounded-full border border-border text-muted hover:border-saffron hover:text-saffron transition-colors flex items-center gap-1.5">
        <Globe size={11} />
        {activeLang?.native ?? activeCode}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-20 rounded-xl border border-border bg-paper shadow-lg overflow-hidden w-56 max-h-80 overflow-y-auto">
          {options.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-muted">Available</p>
              {options.map(opt => {
                const lang = LANGUAGES.find(l => l.code === opt.language);
                const active = opt.language === current && !translatedLanguage;
                return (
                  <button key={opt.id}
                    onClick={() => {
                      setOpen(false);
                      if (opt.language === current) { if (translatedLanguage) onShowOriginal(); return; }
                      router.push(`/story/${opt.id}`);
                    }}
                    className="w-full text-left text-xs px-3 py-2 transition-colors flex items-center justify-between gap-2 hover:bg-cream"
                    style={active ? { color: "#B5701A", fontWeight: 600 } : { color: "#6B6354" }}>
                    <span>{lang?.native ?? opt.language}</span>
                    <span className="text-[10px]">{active ? "Current" : lang?.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {moreLanguages.length > 0 && (
            <div>
              {moreLanguages.map(lang => {
                const active = lang.code === translatedLanguage;
                return (
                  <button key={lang.code}
                    onClick={() => handleTranslate(lang.code)}
                    disabled={translatingCode !== null}
                    className="w-full text-left text-xs px-3 py-2 transition-colors flex items-center justify-between gap-2 hover:bg-cream disabled:opacity-50"
                    style={active ? { color: "#B5701A", fontWeight: 600 } : { color: "#6B6354" }}>
                    <span>{lang.native}</span>
                    <span className="text-[10px]">{active ? "Current" : lang.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {error && <p className="px-3 py-2 text-[10px]" style={{ color: "#f87171" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}
