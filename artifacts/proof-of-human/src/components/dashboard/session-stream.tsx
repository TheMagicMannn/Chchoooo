import { useState, useEffect } from "react";
import { ShieldBan, ShieldQuestion, ShieldCheck, FileBarChart, Plug, SlidersHorizontal } from "lucide-react";
import { genSessions, quickActions, type Session } from "@/lib/dashboard-data";

const iconMap = { ShieldBan, ShieldQuestion, ShieldCheck, FileBarChart, Plug, SlidersHorizontal } as const;

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "#f87171" : score >= 60 ? "#fbbf24" : "#34d399";
  return (
    <span className="poh-mono inline-flex h-6 w-9 items-center justify-center rounded-md text-[12px] font-bold" style={{ color, background: `${color}1c` }}>
      {score}
    </span>
  );
}

export function SessionStream() {
  const [rows, setRows] = useState<Session[]>(() => genSessions(8));

  useEffect(() => {
    const t = setInterval(() => {
      setRows((prev) => {
        const next = genSessions(1)[0];
        return [next, ...prev.slice(0, 7)].map((r, i) => ({ ...r, time: i === 0 ? "now" : `${i + 1}s ago` }));
      });
    }, 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="poh-card-hover rounded-2xl border border-[#161b29] bg-[#0b0f1a] p-5 hover:border-[#222a3d]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-bold text-white">Live Session Stream</h3>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <span className="poh-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
          </span>
        </div>
        <button className="text-[12px] font-medium text-emerald-400 hover:text-emerald-300">View All</button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="text-[11px] text-slate-500">
              <th className="pb-3 text-left font-medium">Session ID</th>
              <th className="pb-3 text-left font-medium">Location</th>
              <th className="pb-3 text-left font-medium">Source</th>
              <th className="pb-3 text-left font-medium">Device</th>
              <th className="pb-3 text-center font-medium">Risk Score</th>
              <th className="pb-3 text-left font-medium">Verdict</th>
              <th className="pb-3 text-left font-medium">Threat Type</th>
              <th className="pb-3 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="poh-fade-up border-t border-[#141a27]">
                <td className="py-2.5 pr-2 poh-mono text-[12px] text-sky-400">{r.id.slice(0, 14)}...</td>
                <td className="py-2.5 pr-2 text-[12.5px] text-slate-300">{r.city}</td>
                <td className="py-2.5 pr-2 text-[12.5px] text-slate-400">{r.source}</td>
                <td className="py-2.5 pr-2 text-[12px] text-slate-400">{r.device}</td>
                <td className="py-2.5 text-center"><ScoreBadge score={r.score} /></td>
                <td className="py-2.5 pr-2"><span className="text-[12.5px] font-semibold" style={{ color: r.verdictColor }}>{r.verdict}</span></td>
                <td className="py-2.5 pr-2 text-[12.5px] text-slate-400">{r.threat}</td>
                <td className="py-2.5 text-right text-[11.5px] text-slate-500">{r.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function QuickActions() {
  return (
    <div className="poh-card-hover rounded-2xl border border-[#161b29] bg-[#0b0f1a] p-5 hover:border-[#222a3d]">
      <h3 className="text-[15px] font-bold text-white">Quick Actions</h3>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {quickActions.map((a) => {
          const Icon = iconMap[a.icon as keyof typeof iconMap];
          return (
            <button key={a.label} className="group flex flex-col items-center gap-2.5 rounded-xl border border-[#161b29] bg-[#0d1220] p-4 transition-colors hover:border-[#222a3d]">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110" style={{ background: `${a.color}1c` }}>
                <Icon className="h-[18px] w-[18px]" style={{ color: a.color }} />
              </span>
              <span className="text-center text-[12px] font-medium text-slate-300">{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
