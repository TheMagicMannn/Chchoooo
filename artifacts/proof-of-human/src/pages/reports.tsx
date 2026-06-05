import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { FileBarChart2, Download, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';

const RANGES = [
  { label: 'Last 24 hours', value: '24h' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
];

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
};

export default function Reports() {
  const [range, setRange] = useState('7d');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const load = async (r: string) => {
    setLoading(true);
    setError('');
    try {
      const [ov, bd] = await Promise.all([
        api.analytics.overview(r),
        api.analytics.breakdown(r),
      ]);
      setOverview(ov);
      setBreakdown(bd);
    } catch (e: any) {
      setError(e.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(range); }, [range]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const logs = await api.dashboard.logs(500, 0);
      const rows = logs.logs || [];
      const header = 'Timestamp,Session ID,Domain,Event Type,Score,Verdict,Country,Duration (ms),Referrer';
      const csvRows = rows.map((l: any) =>
        [
          new Date(l.createdAt).toISOString(),
          l.sessionId,
          l.domain || '',
          l.eventType,
          l.score?.toFixed(4) || '',
          l.verdict || '',
          l.country || '',
          l.durationMs || '',
          l.referrer || '',
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      const csv = [header, ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `poh-report-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2000);
    } catch {}
    setExporting(false);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <FileBarChart2 className="w-7 h-7" /> Reports
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Live analytics reports from your real session data</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => load(range)}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm font-medium hover:bg-secondary"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exportSuccess ? 'Downloaded!' : 'Export CSV'}
            </button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                range === r.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Total Sessions', value: (overview?.totalEvents ?? 0).toLocaleString(), color: '' },
                { label: 'Human Rate', value: `${overview?.humanRate ?? 0}%`, color: 'text-green-500' },
                { label: 'Bots Blocked', value: (overview?.botCount ?? 0).toLocaleString(), color: 'text-red-500' },
                { label: 'Avg Score', value: (overview?.avgScore ?? 0).toFixed(3), color: 'text-primary' },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Score Distribution</h3>
                {(breakdown?.scoreDistribution?.reduce((a, b) => a + b.count, 0) ?? 0) === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={breakdown?.scoreDistribution ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="bucket" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip
                          cursor={{ fill: '#222' }}
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #333' }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold mb-4">Events by Type</h3>
                {(breakdown?.byEventType?.length ?? 0) === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data</div>
                ) : (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={breakdown?.byEventType ?? []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                        <XAxis type="number" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="eventType" stroke="#666" fontSize={10} tickLine={false} axisLine={false} width={80} />
                        <Tooltip
                          cursor={{ fill: '#222' }}
                          contentStyle={{ backgroundColor: '#111827', border: '1px solid #333' }}
                        />
                        <Bar dataKey="human" name="Human" fill="hsl(var(--primary))" stackId="a" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="bot" name="Bot" fill="#ef4444" stackId="a" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Per-Domain Breakdown</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Sessions and bot rates by registered domain</p>
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
                        <th className="px-4 py-3 text-left font-medium">Domain</th>
                        <th className="px-4 py-3 text-right font-medium">Total</th>
                        <th className="px-4 py-3 text-right font-medium">Human</th>
                        <th className="px-4 py-3 text-right font-medium">Bot</th>
                        <th className="px-4 py-3 text-right font-medium">Human Rate</th>
                        <th className="px-4 py-3 text-right font-medium">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {(breakdown?.byDomain ?? []).map((d) => (
                        <tr key={d.domain} className="hover:bg-secondary/20">
                          <td className="px-4 py-3 font-mono text-sm">{d.domain}</td>
                          <td className="px-4 py-3 text-right">{d.total.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-green-500">{d.human.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-red-500">{d.bot.toLocaleString()}</td>
                          <td className={`px-4 py-3 text-right font-medium ${d.humanRate > 85 ? 'text-green-500' : d.humanRate >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {d.humanRate}%
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-primary">{d.avgScore.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
