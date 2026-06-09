import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { campaigns, fraudDistribution, riskOverTime, recentAlerts } from "@/lib/dashboard-data";

export function CampaignTable() {
  return (
    <div className="poh-card-hover rounded-2xl border border-[#161b29] bg-[#0b0f1a] p-5 hover:border-[#222a3d]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-white">Campaign Fraud Analysis</h3>
        <button className="text-[12px] font-medium text-emerald-400 hover:text-emerald-300">View All</button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[11px] text-slate-500">
              <th className="pb-3 text-left font-medium">Campaign</th>
              <th className="pb-3 text-left font-medium">Fraud Rate</th>
              <th className="pb-3 text-right font-medium">Bot Traffic</th>
              <th className="pb-3 text-right font-medium">Ad Spend Saved</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.name} className="border-t border-[#141a27]">
                <td className="py-3 pr-2">
                  <div className="text-[13px] font-medium text-white">{c.name}</div>
                  <div className="text-[11px] text-slate-500">{c.platform}</div>
                </td>
                <td className="py-3 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="poh-mono text-[13px] font-semibold text-white">{c.rate}%</span>
                    <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-[#1b2233] sm:block">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-red-500" style={{ width: `${c.rate * 2}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right poh-mono text-[13px] text-slate-300">{c.bots}</td>
                <td className="py-3 text-right poh-mono text-[13px] font-semibold text-emerald-400">{c.saved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DonutCard({ title, centerValue, centerLabel, data, legend }: {
  title: string; centerValue: string; centerLabel: string;
  data: { name: string; value: number; color: string }[];
  legend: { name: string; value: number; color: string }[];
}) {
  return (
    <div className="poh-card-hover rounded-2xl border border-[#161b29] bg-[#0b0f1a] p-5 hover:border-[#222a3d]">
      <h3 className="text-[15px] font-bold text-white">{title}</h3>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-[150px] w-[150px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={2} startAngle={90} endAngle={-270} stroke="none">
                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="poh-mono text-[20px] font-bold text-white">{centerValue}</div>
            <div className="text-[10.5px] text-slate-500">{centerLabel}</div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {legend.map((l) => (
            <div key={l.name} className="flex items-center gap-2 text-[12px]">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
              <span className="text-slate-400">{l.name}</span>
              <span className="poh-mono ml-auto font-semibold text-white">{l.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FraudDistribution() {
  return <DonutCard title="Fraud Score Distribution" centerValue="28.1%" centerLabel="High Risk" data={fraudDistribution} legend={fraudDistribution} />;
}

export function RecentAlerts() {
  return <DonutCard title="Recent Alerts" centerValue={recentAlerts.total} centerLabel="Total" data={recentAlerts.items} legend={recentAlerts.items} />;
}

export function RiskOverTime() {
  return (
    <div className="poh-card-hover rounded-2xl border border-[#161b29] bg-[#0b0f1a] p-5 hover:border-[#222a3d]">
      <h3 className="text-[15px] font-bold text-white">Risk Score Over Time</h3>
      <div className="mt-4 h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={riskOverTime} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="poh-riskLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#141a27" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
            <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "#0d1220", border: "1px solid #222a3d", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#94a3b8" }} />
            <Line type="monotone" dataKey="score" stroke="url(#poh-riskLine)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: "#f87171" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
