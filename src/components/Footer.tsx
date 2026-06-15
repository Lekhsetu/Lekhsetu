"use client";
import Link from "next/link";

const LINKS: Record<string, { label: string; href: string; soon?: boolean }[]> = {
  Platform: [
    { label: "Explore stories", href: "/explore" },
    { label: "Write a story", href: "/write" },
    { label: "Revenue sharing", href: "/revenue-sharing", soon: true },
  ],
  Company: [
    { label: "About us", href: "/about" },
    { label: "FAQ", href: "/faq" },
    { label: "Feedback", href: "/feedback" },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

// Round to 4dp — prevents floating-point divergence between Node.js (server)
// and browser V8 (client) when computing trig coordinates. Same fix as Hero.tsx.
const p4 = (n: number) => parseFloat(n.toFixed(4));

// Ashoka Chakra: 24 spokes evenly spaced at 15° intervals, inner r=0.7, outer r=4.2
const CHAKRA_SPOKES = Array.from({ length: 24 }, (_, i) => {
  const a = (i * 15) * Math.PI / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return { x1: p4(5 + c * 0.7), y1: p4(5 + s * 0.7), x2: p4(5 + c * 4.2), y2: p4(5 + s * 4.2) };
});

const SOC = [
  {l:"X",p:"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"},
  {l:"Instagram",p:"M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"},
  {l:"LinkedIn",p:"M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"},
];

export default function Footer() {
  return (
    <footer style={{borderTop:"1px solid rgba(245,166,35,0.08)",background:"#0B0907",paddingTop:"64px",paddingBottom:"40px"}}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-14">
          <div className="col-span-2">
            <div className="flex items-center mb-4">
              <img src="/logo-horizontal-dark.png" alt="Lekhsetu" className="h-8 w-auto" />
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs" style={{color:"#6B6354"}}>
              Bridge stories. Build knowledge. Grow together.<br/>
              <span style={{color:"#3A3028"}}>Free to read. Free to write. Always.</span>
            </p>
            <div className="flex gap-3">
              {SOC.map(s=>(
                <a key={s.l} href="#" aria-label={s.l}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{border:"1px solid rgba(255,255,255,0.08)",color:"#6B6354"}}
                  onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.color="#F5A623";(e.currentTarget as HTMLElement).style.borderColor="rgba(245,166,35,0.3)";}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.color="#6B6354";(e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.08)";}}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d={s.p}/></svg>
                </a>
              ))}
            </div>
          </div>
          {Object.entries(LINKS).map(([grp,items])=>(
            <div key={grp}>
              <h4 className="text-xs font-medium tracking-widest uppercase mb-4" style={{color:"#B8AE98"}}>{grp}</h4>
              <ul className="space-y-2.5">
                {items.map(item=>(
                  <li key={item.label}>
                    <Link href={item.href} className="text-sm transition-colors inline-flex items-center gap-2" style={{color:"#6B6354"}}
                      onMouseEnter={e=>(e.currentTarget.style.color="#B8AE98")}
                      onMouseLeave={e=>(e.currentTarget.style.color="#6B6354")}>
                      {item.label}
                      {item.soon && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium tracking-wide"
                          style={{ background: "rgba(245,166,35,0.12)", color: "#F5A623" }}>
                          Soon
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="h-rule mb-6"/>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs" style={{color:"#3A3028"}}>
          <span>© 2025 Lekhsetu. Built for writers everywhere.</span>
          <span className="font-display italic" style={{color:"#2A2218"}}>लेख + सेतु</span>

          {/* Made in India badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>

            {/* Indian flag — three horizontal stripes + Ashoka Chakra */}
            <div className="relative flex-shrink-0 rounded-sm overflow-hidden"
              style={{ width: 22, height: 15, boxShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
              {/* Saffron */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "33.33%", background: "#FF9933" }} />
              {/* White */}
              <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, height: "33.33%", background: "#FFFFFF" }}>
                {/* Ashoka Chakra */}
                <svg viewBox="0 0 10 10" style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", width: 7, height: 7 }}>
                  <circle cx="5" cy="5" r="4.5" fill="none" stroke="#000080" strokeWidth="0.7" />
                  <circle cx="5" cy="5" r="0.7" fill="#000080" />
                  {CHAKRA_SPOKES.map(({ x1, y1, x2, y2 }, i) => (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000080" strokeWidth="0.4" />
                  ))}
                </svg>
              </div>
              {/* Green */}
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "33.33%", background: "#138808" }} />
            </div>

            <span style={{ color: "#6B6354", fontSize: "11px", letterSpacing: "0.06em" }}>
              Made in <span style={{ color: "#B8AE98" }}>India</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
