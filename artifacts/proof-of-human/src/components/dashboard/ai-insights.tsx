import { Sparkles, Bug, DollarSign, ChevronRight } from "lucide-react";
import { aiInsights } from "@/lib/dashboard-data";

const iconMap = { Sparkles, Bug, DollarSign } as const;

export default function AIInsights() {
  return (
    <div className="poh-card-hover flex flex-col rounded-2xl border border-[#161b29] bg-[#0b0f1a] p-5 hover:border-[#222a3d]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-white">AI Insights</h3>
        <button className="text-[12px] font-medium text-emerald-400 hover:text-emerald-300">View All</button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {aiInsights.map((ins) => {
          const Icon = iconMap[ins.icon];
          return (
            <div key={ins.id} className="rounded-xl border border-[#161b29] bg-[#0d1220] p-3.5 transition-colors hover:border-[#222a3d]">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${ins.color}1f` }}>
                  <Icon className="h-[18px] w-[18px]" style={{ color: ins.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-white">{ins.title}</div>
                  <div className="mt-0.5 text-[12px] leading-snug text-slate-400">{ins.desc}</div>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px]">
                    {ins.meta && <span className="text-slate-500">{ins.meta}</span>}
                    <span className="font-semibold" style={{ color: ins.metaColor }}>{ins.metaValue}</span>
                  </div>
                  {ins.cta && (
                    <button className="mt-2 flex items-center gap-0.5 text-[12px] font-medium text-emerald-400 hover:text-emerald-300">
                      {ins.cta} <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
