import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/app-layout';
import { RefreshCw, Globe, Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';

const TIME_RANGES = ['1h', '6h', '24h', '7d', '30d', '90d'];

type Overview = {
  totalEvents: number;
  humanCount: number;
  botCount: number;
  captchaCount: number;
  avgScore: number;
  humanRate: number;
  botRate: number;
  range: string;
};

type ChartPoint = { t: string; human: number; bot: number; total: number };
type GeoRow = { country: string; sessions: number; humanRate: number };
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

function formatBucket(raw: string, range: string): string {
  try {
    const d = new Date(raw);
    if (range === '1h' || range === '6h' || range === '24h') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return raw;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function Connect() {
  const [range, setRange] = useState('7d');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [geoData, setGeoData] = useState<GeoRow[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showDomainDrop, setShowDomainDrop] = useState(false);
  const [domains, setDomains] = useState<string[]>([]);

  const loadAll = useCallback(async (r: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [ov, hourly, geo, recent, domainList] = await Promise.all([
        api.analytics.overview(r),
        api.analytics.hourly(r),
        api.analytics.geo(r),
        api.analytics.recentSessions(10),
        api.domains.list(),
      ]);
      setOverview(ov);
      setChartData(hourly.map((p: any) => ({ ...p, t: formatBucket(p.t, r) })));
      setGeoData(geo);
      setSessions(recent);
      setDomains(['All Domains', ...domainList.map((d: any) => d.domain)]);
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAll(range);
  }, [range, loadAll]);

  useEffect(() => {
    const interval = setInterval(() => loadAll(range, true), 30000);
    return () => clearInterval(interval);
  }, [range, loadAll]);

  const hasData = overview && overview.totalEvents > 0;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-full">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <button
                onClick={() => setShowDomainDrop(!showDomainDrop)}
                className="bg-secondary px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
              >
                {domains[0] || 'All Domains'} <ChevronDown className="w-3 h-3" />
              </button>
              {showDomainDrop && (
                <div className="absolute top-full mt-1 left-0 bg-card border border-border rounded-lg shadow-lg z-10 w-48 overflow-hidden">
                  {domains.map((d) => (
                    <div
                      key={d}
                      className="px-4 py-2 hover:bg-secondary cursor-pointer text-sm"
                      onClick={() => setShowDomainDrop(false)}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-1 flex-wrap">
              {TIME_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`text-xs px-2 py-1 rounded-md font-mono transition-colors ${
                    range === r
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => loadAll(range, true)}
            disabled={refreshing}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {!hasData && !error && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center mb-6">
                <p className="text-muted-foreground mb-2">No events in this time range.</p>
                <p className="text-sm text-muted-foreground">
                  Send your first beacon via the{' '}
                  <a href="/onboarding" className="text-primary hover:underline">ingest endpoint</a>.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground mb-1">Sessions Analyzed</div>
                <div className="text-2xl font-bold font-mono">
                  {(overview?.totalEvents ?? 0).toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground/60 ml-2">{range}</span>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground mb-1">Human Rate</div>
                <div className="text-2xl font-bold text-green-500 font-mono">
                  {overview?.humanRate ?? 0}%
                  <span className="text-xs font-normal text-muted-foreground/60 ml-2">{range}</span>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground mb-1">Bots Blocked</div>
                <div className="text-2xl font-bold font-mono">
                  {(overview?.botCount ?? 0).toLocaleString()}
                  <span className="text-xs font-normal text-muted-foreground/60 ml-2">{range}</span>
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground mb-1">Avg Score</div>
                <div className="text-2xl font-bold text-primary font-mono">
                  {(overview?.avgScore ?? 0).toFixed(2)}
                  <span className="text-xs font-normal text-muted-foreground/60 ml-2">{range}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-4">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h3 className="text-lg font-semibold">
                  Traffic Quality{' '}
                  <span className="text-muted-foreground text-sm font-normal">· {range} view</span>
                </h3>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary"></div> Human
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> Bot
                  </div>
                </div>
              </div>
              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  No data for this time range
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="t" stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#666" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111827', border: '1px solid #333', borderRadius: '8px' }}
                        itemStyle={{ fontWeight: 500 }}
                      />
                      <Area name="Human" type="monotone" dataKey="human" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.08} />
                      <Area name="Bot" type="monotone" dataKey="bot" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
                {sessions.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">No sessions yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-muted-foreground border-b border-border text-left">
                        <tr>
                          <th className="pb-3 font-medium text-xs">Session</th>
                          <th className="pb-3 font-medium text-xs hidden sm:table-cell">Domain</th>
                          <th className="pb-3 font-medium text-xs">Score</th>
                          <th className="pb-3 font-medium text-xs">Verdict</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {sessions.map((s) => (
                          <tr key={s.id}>
                            <td className="py-2 font-mono text-xs text-muted-foreground">{s.sessionId.slice(0, 10)}…</td>
                            <td className="py-2 text-xs text-muted-foreground hidden sm:table-cell truncate max-w-[80px]">{s.domain || '—'}</td>
                            <td className={`py-2 text-xs font-mono ${(s.score ?? 1) < 0.3 ? 'text-red-400' : (s.score ?? 1) < 0.7 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {(s.score ?? 0).toFixed(2)}
                            </td>
                            <td className="py-2">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                                s.verdict === 'HUMAN' ? 'bg-green-500/20 text-green-500'
                                  : s.verdict === 'BOT' ? 'bg-red-500/20 text-red-500'
                                  : 'bg-yellow-500/20 text-yellow-500'
                              }`}>
                                {s.verdict ?? '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" /> Geographic Breakdown
                </h3>
                {geoData.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-6">
                    No country data yet. Include <code className="text-xs bg-secondary px-1 rounded">country</code> in your ingest calls.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-muted-foreground border-b border-border text-left">
                        <tr>
                          <th className="pb-3 font-medium">Country</th>
                          <th className="pb-3 font-medium text-right">Sessions</th>
                          <th className="pb-3 font-medium text-right">Human Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {geoData.map((g, i) => (
                          <tr key={i}>
                            <td className="py-3">{g.country}</td>
                            <td className="py-3 text-right text-muted-foreground">{g.sessions.toLocaleString()}</td>
                            <td className={`py-3 text-right font-medium ${
                              g.humanRate > 85 ? 'text-green-500' : g.humanRate >= 70 ? 'text-yellow-500' : 'text-red-500'
                            }`}>
                              {g.humanRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Verdict Breakdown</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Human', count: overview?.humanCount ?? 0, color: 'bg-green-500', textColor: 'text-green-500' },
                    { label: 'Bot', count: overview?.botCount ?? 0, color: 'bg-red-500', textColor: 'text-red-500' },
                    { label: 'CAPTCHA', count: overview?.captchaCount ?? 0, color: 'bg-yellow-500', textColor: 'text-yellow-500' },
                  ].map((v) => {
                    const total = overview?.totalEvents ?? 0;
                    const pct = total > 0 ? Math.round((v.count / total) * 100) : 0;
                    return (
                      <div key={v.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{v.label}</span>
                          <span className={`text-sm font-mono ${v.textColor}`}>{v.count.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className={`h-full ${v.color} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-2">Total Events ({range})</div>
                  <div className="text-3xl font-bold font-mono">{(overview?.totalEvents ?? 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
