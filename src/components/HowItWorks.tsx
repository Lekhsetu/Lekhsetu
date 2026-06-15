"use client";
import { useEffect, useRef } from "react";
import { PenLine, Users, Sparkles, Globe2 } from "lucide-react";

const STEPS = [
  {n:"01",icon:PenLine,title:"Write from experience",desc:"No credentials needed. Just your story, your insight, your truth, written the way only you can. Free forever.",c:"#F5A623"},
  {n:"02",icon:Users,  title:"Reach the right readers",desc:"Lekhsetu surfaces your writing to people who genuinely need it, by resonance, not by viral chasing.",c:"#5BA3E0"},
  {n:"03",icon:Sparkles,title:"Build your voice",desc:"A profile that grows with you. Track your impact. Hear from readers whose lives you've touched.",c:"#FCD34D"},
  {n:"04",icon:Globe2, title:"Become part of something global",desc:"Stories cross borders. Lekhsetu connects writers and readers across 190+ countries and a dozen languages.",c:"#6DBF67"},
];

function Step({s,i,align}:{s:typeof STEPS[0];i:number;align:"left"|"right"}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const el=ref.current; if(!el) return;
    el.style.opacity="0"; el.style.transform="translateY(20px)";
    const obs=new IntersectionObserver(([e])=>{
      if(e.isIntersecting){ setTimeout(()=>{ el.style.opacity="1"; el.style.transform="translateY(0)"; el.style.transition="opacity 0.6s ease,transform 0.6s ease"; },i*80); obs.disconnect(); }
    },{threshold:0.2}); obs.observe(el); return ()=>obs.disconnect();
  },[i]);
  return (
    <div ref={ref} className={`flex items-center gap-8 ${align==="right"?"md:flex-row-reverse":"md:flex-row"} flex-row`}>
      <div className={`flex-1 ${align==="right"?"md:text-right":""}`}>
        <div className="font-mono-code text-xs mb-2 tracking-wider" style={{color:"#3A3028"}}>{s.n}</div>
        <h3 className="font-display text-xl md:text-2xl font-semibold text-cream mb-2">{s.title}</h3>
        <p className="text-sm leading-relaxed max-w-xs" style={{color:"#6B6354"}}>{s.desc}</p>
      </div>
      <div className="relative flex-shrink-0 z-10">
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{border:`2px solid ${s.c}`,background:`${s.c}12`}}>
          <s.icon size={18} style={{color:s.c}} />
        </div>
        <div className="absolute inset-0 rounded-full anim-ping" style={{background:s.c}} />
      </div>
      <div className="flex-1 hidden md:block" />
    </div>
  );
}

export default function HowItWorks() {
  const lineRef = useRef<HTMLDivElement>(null);
  const secRef  = useRef<HTMLElement>(null);
  useEffect(()=>{
    const onScroll=()=>{
      const s=secRef.current; const l=lineRef.current; if(!s||!l) return;
      const r=s.getBoundingClientRect();
      const p=Math.max(0,Math.min(1,-r.top/(r.height-window.innerHeight)));
      l.style.height=`${p*100}%`;
    };
    window.addEventListener("scroll",onScroll,{passive:true});
    return ()=>window.removeEventListener("scroll",onScroll);
  },[]);

  return (
    <section ref={secRef} className="py-24" style={{background:"#0B0907"}}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-rule w-10"/><span className="text-xs tracking-widest uppercase" style={{color:"#F5A623"}}>How it works</span><div className="h-rule w-10"/>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-cream">
            Four steps from idea<br/><span className="italic" style={{color:"#6B6354"}}>to impact</span>
          </h2>
        </div>
        <div className="relative">
          <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{background:"rgba(255,255,255,0.06)"}}>
            <div ref={lineRef} className="absolute top-0 left-0 right-0 transition-[height] duration-75"
              style={{background:"rgba(245,166,35,0.5)",height:"0%"}} />
          </div>
          <div className="space-y-16">
            {STEPS.map((s,i)=><Step key={s.n} s={s} i={i} align={i%2===0?"left":"right"} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
