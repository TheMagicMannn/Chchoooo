import { ArrowUpRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { metrics, sparklines, protectionScore, type Metric } from "@/lib/dashboard-data";

function Sparkline({ data, color, id }: { data: { x: number; y: number }[]; color: string; id: string }) {
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2} fill={`url(#grad-${id})`} dot={false} animationDuration={900} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MetricCard({ m, index }: { m: Metric; index: number }) {
  return (
    <div
      className="poh-card-hover poh-fade-up group relative flex flex-col overflow-hidden rounded-2xl border border-[#161b29] bg-[#0b0f1a] p-5 hover:border-[#222a3d]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${m.color}, transparent)` }} />
      <span className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30" style={{ background: m.color }} />
      <div className="text-[12.5px] font-medium text-slate-400">{m.label}</div>
      <div className="mt-2 flex items-end gap-2">
        <div className="poh-mono text-[26px] font-bold leading-none text-white">{m.value}</div>
        <div className="mb-0.5 flex items-center gap-0.5 text-[12px] font-semibold text-emerald-400">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {m.change.replace("+", "")}
        </div>
      </div>
      <div className="mt-1.5 text-[11px] text-slate-500">{m.sub}</div>
      <div className="mt-3 -mx-1">
        <Sparkline data={sparklines[m.id]} color={m.color} id={m.id} />
      </div>
    </div>
  );
}

function ProtectionScoreCard() {
  const { value, max, label } = protectionScore;
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = value / max;
  return (
    <div className="poh-card-hover poh-fade-up flex flex-col rounded-2xl border border-[#161b29] bg-[#0b0f1a] p-5 hover:border-emerald-500/30" style={{ animationDelay: "300ms" }}>
      <div className="text-[12.5px] font-medium text-slate-400">Protection Score</div>
      <div className="mt-2 flex flex-1 items-center justify-center">
        <div className="relative h-[128px] w-[128px]">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={r} fill="none" stroke="#161b29" strokeWidth="9" />
            <circle
              cx="64" cy="64" r={r} fill="none" stroke="#34d399" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
              style={{ transition: "stroke-dashoffset 1.2s ease", filter: "drop-shadow(0 0 6px rgba(52,211,153,0.5))" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="poh-mono text-[30px] font-bold text-white">{value}</div>
            <div className="text-[11px] text-slate-500">/{max}</div>
          </div>
        </div>
      </div>
      <div className="mt-1 text-center text-[13px] font-semibold text-emerald-400">{label}</div>
    </div>
  );
}

export default function MetricCards() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {metrics.map((m, i) => (
        <MetricCard key={m.id} m={m} index={i} />
      ))}
      <ProtectionScoreCard />
    </div>
  );
}
