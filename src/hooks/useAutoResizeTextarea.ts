import { useEffect, useRef } from "react";

export function useAutoResizeTextarea(value: string, breatheDelayMs = 3000) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const breatheTimer = useRef<number | undefined>(undefined);

  const resize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; }
  };

  const onChange = () => {
    resize();
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
