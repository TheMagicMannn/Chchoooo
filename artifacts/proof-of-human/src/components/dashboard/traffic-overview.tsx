import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { trafficData, trafficLegend } from "@/lib/dashboard-data";

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-[#222a3d] bg-[#0d1220] px-3 py-2 shadow-xl">
      <div className="mb-1 text-[11px] font-medium text-slate-400">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[12px]">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize text-slate-300">{p.dataKey}</span>
          <span className="poh-mono ml-auto font-semibold text-white">{(p.value / 1000).toFixed(1)}K</span>
        </div>
      ))}
    </div>
  );
}

export default function TrafficOverview() {
  return (
    <div className="poh-card-hover rounded-2xl border border-[#161b29] bg-[#0b0f1a] p-5 hover:border-[#222a3d]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-white">Real-time Traffic Overview</h3>
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
          <span className="poh-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        {trafficLegend.map((l) => (
          <div key={l.key} className="flex items-center gap-1.5 text-[12px] text-slate-400">
            <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      <div className="mt-4 h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trafficData} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
            <defs>
              {trafficLegend.map((l) => (
                <linearGradient key={l.key} id={`tg-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={l.color} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={l.color} stopOpacity={0.03} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#161b29" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => (v === 0 ? "0" : `${v / 1000}K`)} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="all" stroke="#a78bfa" strokeWidth={2} fill="url(#tg-all)" />
            <Area type="monotone" dataKey="human" stroke="#38bdf8" strokeWidth={2} fill="url(#tg-human)" />
            <Area type="monotone" dataKey="bots" stroke="#f87171" strokeWidth={2} fill="url(#tg-bots)" />
            <Area type="monotone" dataKey="fraud" stroke="#fbbf24" strokeWidth={2} fill="url(#tg-fraud)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
