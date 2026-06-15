"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function CustomCursor() {
  const pathname = usePathname();
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const readRef = useRef<HTMLSpanElement>(null);
  const pos     = useRef({ x: -200, y: -200 });
  const rpos    = useRef({ x: -200, y: -200 });
  const raf     = useRef(0);

  useEffect(() => {
    // Skip on the editor — the resize "bounce" on the ring lags behind the
    // mouse and looks like a stuck circle while editing text. Restore the
    // native cursor here since the custom one won't be rendered.
    if (window.matchMedia("(hover: none)").matches) {
      document.body.classList.add("native-cursor");
      document.body.classList.remove("write-cursor");
      if (dotRef.current) dotRef.current.style.display = "none";
      if (ringRef.current) ringRef.current.style.display = "none";
      return;
    }

    document.body.classList.remove("native-cursor");
    document.body.classList.remove("write-cursor");

    const dot  = dotRef.current;
    const ring = ringRef.current;
    const read = readRef.current;
    if (!dot || !ring) return;

    dot.style.display  = "block";
    ring.style.display = "block";

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      dot.style.left = pos.current.x + "px";
      dot.style.top  = pos.current.y + "px";
      rpos.current.x = lerp(rpos.current.x, pos.current.x, 0.14);
      rpos.current.y = lerp(rpos.current.y, pos.current.y, 0.14);
      ring.style.left = rpos.current.x + "px";
      ring.style.top  = rpos.current.y + "px";
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const isCard = !!t.closest("[data-cursor='card']");
      const isBtn  = !!t.closest("button, a, input, select, textarea, [role='button']");

      if (isCard) {
        ring.style.width = ring.style.height = "62px";
        ring.style.background    = "rgba(245,166,35,0.1)";
        ring.style.borderColor   = "rgba(245,166,35,0.7)";
        dot.style.transform      = "translate(-50%,-50%) scale(0.5)";
        if (read) read.style.opacity = "1";
      } else if (isBtn) {
        ring.style.width = ring.style.height = "54px";
        ring.style.background    = "rgba(245,166,35,0.12)";
        ring.style.borderColor   = "rgba(245,166,35,0.75)";
        dot.style.transform      = "translate(-50%,-50%) scale(1.4)";
        if (read) read.style.opacity = "0";
      } else {
        ring.style.width = ring.style.height = "40px";
        ring.style.background    = "transparent";
        ring.style.borderColor   = "rgba(245,166,35,0.4)";
        dot.style.transform      = "translate(-50%,-50%) scale(1)";
        if (read) read.style.opacity = "0";
      }
    };

    const onLeave = () => { dot.style.opacity = "0"; ring.style.opacity = "0"; };
    const onEnter = () => { dot.style.opacity = "1"; ring.style.opacity = "1"; };

    window.addEventListener("mousemove",  onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("mousemove",  onMove);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [pathname]);

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  style={{ display: "none" }} />
      <div ref={ringRef} className="cursor-ring" style={{ display: "none" }}>
        <span ref={readRef} className="cursor-read-label">read</span>
      </div>
    </>
  );
}
