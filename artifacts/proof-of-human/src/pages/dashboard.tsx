import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Activity, ShieldAlert, Cpu, Users, RefreshCw, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { api } from "@/lib/api";

type StatsData = {
  totalEvents: number;
  humanCount: number;
  botCount: number;
  avgScore: number;
  sessionsToday: number;
  humanRate: number;
  recentEvents: Array<{
    id: number;
    sessionId: string;
    userAgent: string | null;
    score: number | null;
    createdAt: string;
    verdict: string | null;
    domain: string | null;
    eventType: string;
  }>;
};

type ScoreDistBucket = { bucket: string; count: number };

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [scoreDist, setScoreDist] = useState<ScoreDistBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [data, dist] = await Promise.all([
        api.dashboard.stats(),
        api.dashboard.scoreDist(),
      ]);
      setStats(data);
      setScoreDist(dist);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to load stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const hasData = stats && stats.totalEvents > 0;

  const chartData = hasData
    ? stats.recentEvents
        .slice()
        .reverse()
        .map((e, i) => ({
          time: `${i + 1}`,
          events: 1,
          score: (e.score ?? 0) * 100,
        }))
    : Array.from({ length: 8 }, (_, i) => ({ time: `${i + 1}`, events: 0, score: 0 }));

  const scoreDistData = scoreDist.length > 0
    ? scoreDist
    : [
        { bucket: "0.0–0.2", count: 0 },
        { bucket: "0.2–0.4", count: 0 },
        { bucket: "0.4–0.6", count: 0 },
        { bucket: "0.6–0.8", count: 0 },
        { bucket: "0.8–1.0", count: 0 },
      ];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              System Online
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!hasData && !error && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
            <p className="text-muted-foreground mb-2">No events yet.</p>
            <p className="text-sm text-muted-foreground">
              Send your first event via the ingest endpoint using your API token from{" "}
              <a href="/onboarding" className="text-primary hover:underline">onboarding</a>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-sm font-medium">Total Events</span>
              <Activity className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold font-mono text-foreground">
              {(stats?.totalEvents ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-sm font-medium">Human Rate</span>
              <Cpu className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold font-mono text-green-400">
              {stats?.humanRate ?? 0}%
            </div>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-sm font-medium">Avg Score</span>
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold font-mono text-primary">
              {(stats?.avgScore ?? 0).toFixed(2)}
            </div>
          </div>
          <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between text-muted-foreground mb-4">
              <span className="text-sm font-medium">Sessions Today</span>
              <Users className="h-4 w-4" />
            </div>
            <div className="text-3xl font-bold font-mono text-foreground">
              {(stats?.sessionsToday ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-xl border border-border bg-card shadow-sm">
            <h3 className="font-semibold mb-6">Score Timeline (recent events)</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="time" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#111827", border: "1px solid #333" }}
                    itemStyle={{ color: "#00f0ff" }}
                    formatter={(v: any) => [`${Number(v).toFixed(0)}%`, "Score"]}
                  />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
            <h3 className="font-semibold mb-6">Score Distribution</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="bucket" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "#222" }}
                    contentStyle={{ backgroundColor: "#111827", border: "1px solid #333" }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <h3 className="font-semibold mb-6">Recent Inferences</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border/50">
                <tr>
                  <th className="px-4 py-3">Session ID</th>
                  <th className="px-4 py-3 hidden md:table-cell">Domain</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3 hidden sm:table-cell">Event</th>
                  <th className="px-4 py-3">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recentEvents ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No events yet. Send your first beacon event.
                    </td>
                  </tr>
                ) : (
                  (stats?.recentEvents ?? []).map((row, i) => (
                    <tr key={i} className="border-b border-border/20 hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.sessionId.slice(0, 12)}...</td>
                      <td className="px-4 py-3 truncate max-w-[160px] hidden md:table-cell">{row.domain || "—"}</td>
                      <td className="px-4 py-3 font-mono">{(row.score ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{row.eventType}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                          row.verdict === "HUMAN"
                            ? "bg-primary/20 text-primary"
                            : row.verdict === "BOT"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {row.verdict ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
