import { useEffect, useRef } from "react";

export function useAutoResizeTextarea(value: string, breatheDelayMs = 3000) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const breatheTimer = useRef<number | undefined>(undefined);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    // Anchor the viewport before collapsing height so the caret's visual
    // position doesn't drift from its selectionStart byte-offset.
    const scrollY = window.scrollY;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
    window.scrollTo(0, scrollY);
  };

  const onChange = () => {
    // Resize is handled by useEffect([value]) after React commits the new
    // value, calling it here too would fire twice per keystroke (once on
    // the stale value, once on the updated value), doubling the scroll flash.
    const wrapper = wrapperRef.current;
    if (wrapper) wrapper.classList.remove("editor-breathing");
    clearTimeout(breatheTimer.current);
    breatheTimer.current = window.setTimeout(() => {
      if (wrapper) wrapper.classList.add("editor-breathing");
    }, breatheDelayMs);
  };

  useEffect(() => () => clearTimeout(breatheTimer.current), []);
  useEffect(() => { resize(); }, [value]);

  return { textareaRef, wrapperRef, onChange };
}
