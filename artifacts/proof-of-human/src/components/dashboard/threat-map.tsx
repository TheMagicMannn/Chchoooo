import { useState, useEffect, useMemo } from "react";
import { Maximize2, RefreshCw } from "lucide-react";
import { threatStats } from "@/lib/dashboard-data";
import { MAP_W, MAP_H, dots, origins, targets, arcs } from "@/lib/threat-geo";

export default function ThreatMap() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % arcs.length), 900);
    return () => clearInterval(t);
  }, []);

  const renderedDots = useMemo(
    () => dots.map((d, i) => <circle key={i} cx={d[0]} cy={d[1]} r="1.05" />),
    []
  );

  return (
    <div className="poh-card-hover relative overflow-hidden rounded-2xl border border-[#161b29] bg-[#0b0f1a] p-5 hover:border-[#222a3d]">
      <div className="relative z-10 flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-white">
          Threat Map <span className="text-[13px] font-normal text-slate-500">(Live)</span>
        </h3>
        <div className="flex items-center gap-1.5">
          <button className="flex h-7 w-7 items-center justify-center rounded-md border border-[#1b2233] text-slate-500 transition-colors hover:border-emerald-500/40 hover:text-white">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-md border border-[#1b2233] text-slate-500 transition-colors hover:border-emerald-500/40 hover:text-white">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative mt-4 w-full overflow-hidden rounded-xl border border-[#11151f] bg-gradient-to-b from-[#080b14] to-[#06121a]">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 80% at 50% 40%, rgba(16,185,129,0.08), transparent 70%)" }} />
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block w-full" style={{ aspectRatio: `${MAP_W}/${MAP_H}` }}>
          <defs>
            <radialGradient id="poh-originGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#fb7185" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="poh-arcGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
            </linearGradient>
            <filter id="poh-soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
          </defs>

          <g fill="#1f2c3f">{renderedDots}</g>

          {origins.map((o) => (
            <circle key={`halo-${o.id}`} cx={o.x} cy={o.y} r={26 + o.intensity * 22} fill="url(#poh-originGlow)" opacity={0.55 + o.intensity * 0.4} />
          ))}

          {arcs.map((a) => (
            <path key={`base-${a.id}`} d={a.d} fill="none" stroke="#1c3a33" strokeWidth="1" opacity="0.5" />
          ))}

          {arcs.map((a, i) => {
            const isOn = i === active || i === (active + 3) % arcs.length;
            if (!isOn) return null;
            return (
              <g key={`fire-${a.id}`}>
                <path d={a.d} fill="none" stroke="url(#poh-arcGrad)" strokeWidth="1.6" filter="url(#poh-soft)" />
                <path d={a.d} fill="none" stroke="#5eead4" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="6 220" className="poh-dash" style={{ animationDuration: "1.4s" }} />
              </g>
            );
          })}

          {origins.map((o) => (
            <g key={`o-${o.id}`}>
              <circle cx={o.x} cy={o.y} r="3.4" fill="#fb7185" />
              <circle cx={o.x} cy={o.y} r="3.4" fill="none" stroke="#fb7185" strokeWidth="1.2" className="poh-map-ping" />
            </g>
          ))}

          {targets.map((t) => (
            <g key={`t-${t.id}`}>
              <circle cx={t.x} cy={t.y} r={t.primary ? 5 : 3.6} fill="#34d399" />
              {t.primary && (
                <>
                  <circle cx={t.x} cy={t.y} r="5" fill="none" stroke="#34d399" strokeWidth="1.4" className="poh-map-ping" />
                  <circle cx={t.x} cy={t.y} r="8" fill="none" stroke="#34d399" strokeWidth="0.8" opacity="0.4" />
                </>
              )}
            </g>
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <div className="poh-mono text-[20px] font-bold text-emerald-400">{threatStats.sources}</div>
          <div className="text-[11px] text-slate-500">Attack Sources · Countries</div>
        </div>
        <div>
          <div className="poh-mono text-[20px] font-bold text-rose-400">{threatStats.active}</div>
          <div className="text-[11px] text-slate-500">Active Attacks · Right now</div>
        </div>
        <div>
          <div className="text-[14px] font-bold text-white">{threatStats.topTarget}</div>
          <div className="text-[11px] text-slate-500">Top Target · {threatStats.topPct} of attacks</div>
        </div>
      </div>
    </div>
  );
}
