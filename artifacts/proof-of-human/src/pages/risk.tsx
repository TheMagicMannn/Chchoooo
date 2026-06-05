import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Loader2, AlertCircle, Shield, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";

type Breakdown = {
  byEventType: { eventType: string; total: number; human: number; bot: number }[];
  byDomain: { domain: string; total: number; human: number; bot: number; avgScore: number; humanRate: number }[];
  scoreDistribution: { bucket: string; count: number }[];
};

type Overview = {
  totalEvents: number;
  humanCount: number;
  botCount: number;
  captchaCount: number;
  avgScore: number;
  humanRate: number;
  botRate: number;
};

type Session = {
  id: number;
  sessionId: string;
  domain: string | null;
  score: number | null;
  verdict: string | null;
  eventType: string;
  country: string | null;
  createdAt: string;
};

const RANGES = ['24h', '7d', '30d'];

export default function Risk() {
  const [range, setRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("Scoring");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [highRisk, setHighRisk] = useState<Session[]>([]);
  const [hourly, setHourly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (r: string) => {
    setLoading(true);
    setError("");
    try {
      const [ov, bd, recent, h] = await Promise.all([
        api.analytics.overview(r),
        api.analytics.breakdown(r),
        api.analytics.recentSessions(50),
        api.analytics.hourly(r),
      ]);
      setOverview(ov);
      setBreakdown(bd);
      setHighRisk(recent.filter((s: Session) => (s.score ?? 1) < 0.4));
      setHourly(h.map((p: any) => ({
        ...p,
        t: (() => {
          try {
            const d = new Date(p.t);
            return r === '24h' || r === '1h' || r === '6h'
              ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
              : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          } catch { return p.t; }
        })(),
      })));
    } catch (e: any) {
      setError(e.message || "Failed to load risk data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(range); }, [range]);

  const tabs = ["Scoring", "Domain Risk", "Event Breakdown"];

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Risk & Detection</h1>
            <p className="text-muted-foreground text-sm mt-1">Real session scoring data from your connected sites</p>
          </div>
          <div className="flex items-center gap-2">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-xs px-2.5 py-1.5 rounded-md font-mono transition-colors ${
                  range === r ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {r}
              </button>
            ))}
            <button
              onClick={() => load(range)}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="text-xs text-muted-foreground mb-1">Total Sessions</div>
                <div className="text-2xl font-bold font-mono">{(overview?.totalEvents ?? 0).toLocaleString()}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="text-xs text-muted-foreground mb-1">Bot Rate</div>
                <div className={`text-2xl font-bold font-mono ${(overview?.botRate ?? 0) > 20 ? 'text-red-500' : (overview?.botRate ?? 0) > 10 ? 'text-yellow-500' : 'text-green-500'}`}>
                  {overview?.botRate ?? 0}%
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="text-xs text-muted-foreground mb-1">Avg Score</div>
                <div className="text-2xl font-bold font-mono text-primary">{(overview?.avgScore ?? 0).toFixed(3)}</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="text-xs text-muted-foreground mb-1">High-Risk Sessions</div>
                <div className="text-2xl font-bold font-mono text-red-500">{highRisk.length}</div>
              </div>
            </div>

            <div className="flex gap-2 border-b border-border/40 mb-6 overflow-x-auto">
              {tabs.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {activeTab === "Scoring" && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-1">Bot Rate Over Time</h3>
                  <p className="text-sm text-muted-foreground mb-4">Bot sessions per time bucket in the {range} window</p>
                  {hourly.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data for this range</div>
                  ) : (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hourly} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="t" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #333' }} />
                          <Line name="Bot" type="monotone" dataKey="bot" stroke="#ef4444" strokeWidth={2} dot={false} />
                          <Line name="Human" type="monotone" dataKey="human" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-1">Score Distribution</h3>
                  <p className="text-sm text-muted-foreground mb-4">Sessions below 0.4 are flagged as high-risk</p>
                  {(breakdown?.scoreDistribution?.reduce((a, b) => a + b.count, 0) ?? 0) === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
                  ) : (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={breakdown?.scoreDistribution ?? []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="bucket" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#111827', border: '1px solid #333' }} />
                          <Bar
                            dataKey="count"
                            fill="hsl(var(--primary))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <h3 className="font-semibold">High-Risk Sessions (score &lt; 0.4)</h3>
                  </div>
                  {highRisk.length === 0 ? (
                    <div className="p-8 text-center">
                      <Shield className="w-10 h-10 text-green-500/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No high-risk sessions in recent data. Your traffic looks clean!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/10 text-xs uppercase text-muted-foreground border-b border-border">
                          <tr>
                            <th className="px-4 py-3 text-left">Session</th>
                            <th className="px-4 py-3 text-left hidden md:table-cell">Domain</th>
                            <th className="px-4 py-3 text-left">Score</th>
                            <th className="px-4 py-3 text-left">Verdict</th>
                            <th className="px-4 py-3 text-left hidden sm:table-cell">Event</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {highRisk.slice(0, 20).map((s) => (
                            <tr key={s.id} className="hover:bg-secondary/20">
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.sessionId.slice(0, 12)}…</td>
                              <td className="px-4 py-3 text-xs hidden md:table-cell">{s.domain || '—'}</td>
                              <td className="px-4 py-3 font-mono text-red-400">{(s.score ?? 0).toFixed(3)}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-500">
                                  {s.verdict ?? '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{s.eventType}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "Domain Risk" && (
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Bot Rate by Domain</h3>
                </div>
                {(breakdown?.byDomain?.length ?? 0) === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No domain data. Include <code className="bg-secondary px-1 rounded text-xs">domain</code> in your ingest calls.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/10 border-b border-border text-xs uppercase text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 text-left">Domain</th>
                          <th className="px-4 py-3 text-right">Sessions</th>
                          <th className="px-4 py-3 text-right">Bots</th>
                          <th className="px-4 py-3 text-right">Human Rate</th>
                          <th className="px-4 py-3 text-right">Avg Score</th>
                          <th className="px-4 py-3 text-left">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {(breakdown?.byDomain ?? []).map((d) => {
                          const risk = d.humanRate < 70 ? 'High' : d.humanRate < 85 ? 'Medium' : 'Low';
                          const riskColor = risk === 'High' ? 'text-red-500 bg-red-500/10' : risk === 'Medium' ? 'text-yellow-500 bg-yellow-500/10' : 'text-green-500 bg-green-500/10';
                          return (
                            <tr key={d.domain} className="hover:bg-secondary/20">
                              <td className="px-4 py-3 font-mono text-sm">{d.domain}</td>
                              <td className="px-4 py-3 text-right">{d.total.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-red-500">{d.bot.toLocaleString()}</td>
                              <td className={`px-4 py-3 text-right font-medium ${d.humanRate > 85 ? 'text-green-500' : d.humanRate >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {d.humanRate}%
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-primary">{d.avgScore.toFixed(3)}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${riskColor}`}>{risk}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Event Breakdown" && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h3 className="font-semibold mb-4">Bot Sessions by Event Type</h3>
                  {(breakdown?.byEventType?.length ?? 0) === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
                  ) : (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={breakdown?.byEventType ?? []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                          <XAxis type="number" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="eventType" stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={90} />
                          <Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#111827', border: '1px solid #333' }} />
                          <Bar dataKey="human" name="Human" fill="hsl(var(--primary))" stackId="a" />
                          <Bar dataKey="bot" name="Bot" fill="#ef4444" stackId="a" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">Event Type Details</h3>
                  </div>
                  {(breakdown?.byEventType?.length ?? 0) === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">No event data</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/10 border-b border-border text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 text-left">Event Type</th>
                            <th className="px-4 py-3 text-right">Total</th>
                            <th className="px-4 py-3 text-right">Human</th>
                            <th className="px-4 py-3 text-right">Bot</th>
                            <th className="px-4 py-3 text-right">Bot Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {(breakdown?.byEventType ?? []).map((e) => {
                            const botRate = e.total > 0 ? Math.round((e.bot / e.total) * 100) : 0;
                            return (
                              <tr key={e.eventType} className="hover:bg-secondary/20">
                                <td className="px-4 py-3 font-mono text-sm">{e.eventType}</td>
                                <td className="px-4 py-3 text-right">{e.total.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-green-500">{e.human.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-red-500">{e.bot.toLocaleString()}</td>
                                <td className={`px-4 py-3 text-right font-medium ${botRate > 20 ? 'text-red-500' : botRate > 10 ? 'text-yellow-500' : 'text-green-500'}`}>
                                  {botRate}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
