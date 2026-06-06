import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout";
import { Activity, CheckCircle2, XCircle, Play, Pause, Trash2, Terminal, RefreshCw, Loader2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { CodeBlock } from "@/components/code-block";
import { api } from "@/lib/api";

type OpsMetrics = {
  totalEvents: number;
  botCount: number;
  humanCount: number;
  captchaCount: number;
  avgScore: number;
  botRate: number;
};

type LogLine = {
  ts: string;
  level: "INFO" | "WARN" | "ERROR";
  text: string;
};

function formatEventAsLog(evt: { verdict: string; score: number | null; sessionId: string; domain: string | null; eventType: string; flags: string[] | null }): LogLine {
  const score = (evt.score ?? 0).toFixed(3);
  const sid = evt.sessionId.slice(0, 12);
  const domain = evt.domain ? ` domain=${evt.domain}` : "";
  const flagStr = (evt.flags ?? []).length > 0 ? ` flags=[${evt.flags!.join(",")}]` : "";

  if (evt.verdict === "BOT") {
    return { ts: "", level: "WARN", text: `inference — BOT detected session=${sid} score=${score}${domain}${flagStr}` };
  }
  if (evt.verdict === "CAPTCHA") {
    return { ts: "", level: "INFO", text: `inference — CAPTCHA assigned session=${sid} score=${score}${domain}${flagStr}` };
  }
  return { ts: "", level: "INFO", text: `inference — HUMAN session=${sid} score=${score} event=${evt.eventType}${domain}` };
}

export default function Ops() {
  const [activeTab, setActiveTab] = useState("health");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [metrics, setMetrics] = useState<OpsMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    if (isPaused) return;
    setLogsLoading(true);
    try {
      const data = await api.dashboard.logs(50, 0);
      const lines: LogLine[] = (data.logs ?? []).map((evt: any) => {
        const line = formatEventAsLog(evt);
        line.ts = new Date(evt.createdAt).toISOString().substring(11, 23);
        return line;
      });
      setLogs(lines);
    } catch {}
    finally { setLogsLoading(false); }
  };

  const fetchMetrics = async () => {
    setMetricsLoading(true);
    try {
      const data = await api.analytics.overview("30d");
      setMetrics(data);
    } catch {}
    finally { setMetricsLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "logs") fetchLogs();
    if (activeTab === "metrics") fetchMetrics();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "logs" || isPaused) return;
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [activeTab, isPaused]);

  useEffect(() => {
    if (!isPaused && activeTab === "logs") {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isPaused, activeTab]);

  const tabs = [
    { id: "health", label: "Health" },
    { id: "logs", label: "Logs" },
    { id: "metrics", label: "Metrics" },
    { id: "topology", label: "Topology" },
  ];

  const metricsCards = metrics ? [
    { title: "poh_events_ingested_total", val: metrics.totalEvents.toLocaleString() },
    { title: "poh_bot_detection_rate", val: `${metrics.botRate}%` },
    { title: "poh_human_sessions_total", val: metrics.humanCount.toLocaleString() },
    { title: "poh_bot_sessions_total", val: metrics.botCount.toLocaleString() },
    { title: "poh_captcha_sessions_total", val: metrics.captchaCount.toLocaleString() },
    { title: "poh_avg_human_score", val: (metrics.avgScore ?? 0).toFixed(3) },
  ] : [];

  const prometheusText = metrics ? `# HELP poh_events_ingested_total Total telemetry events ingested (last 30 days)
# TYPE poh_events_ingested_total counter
poh_events_ingested_total ${metrics.totalEvents}

# HELP poh_bot_detection_rate Fraction of sessions classified as bot
# TYPE poh_bot_detection_rate gauge
poh_bot_detection_rate ${(metrics.botRate / 100).toFixed(4)}

# HELP poh_human_sessions_total Sessions classified as human
# TYPE poh_human_sessions_total counter
poh_human_sessions_total ${metrics.humanCount}

# HELP poh_bot_sessions_total Sessions classified as bot
# TYPE poh_bot_sessions_total counter
poh_bot_sessions_total ${metrics.botCount}

# HELP poh_captcha_sessions_total Sessions routed to CAPTCHA
# TYPE poh_captcha_sessions_total counter
poh_captcha_sessions_total ${metrics.captchaCount}

# HELP poh_avg_human_score Average human probability score
# TYPE poh_avg_human_score gauge
poh_avg_human_score ${(metrics.avgScore ?? 0).toFixed(4)}` : "";

  return (
    <Layout>
      <div className="w-full px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Operations Console</h1>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-green-500">All Systems Nominal</span>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-400">Partial Infrastructure View</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Health cards and topology reflect the designed architecture. Logs and Metrics tabs show live data from your actual session database.
            </p>
          </div>
        </div>

        <div className="flex space-x-2 border-b border-border/40 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "health" && (
          <div className="space-y-6 max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: "Edge Worker", status: "online", uptime: "99.99%", ts: "1s ago" },
                { name: "Kafka Broker", status: "online", uptime: "100%", ts: "1s ago" },
                { name: "Inference Engine", status: "online", uptime: "99.98%", ts: "2s ago" },
                { name: "ClickHouse", status: "degraded", uptime: "99.95%", ts: "5s ago" },
                { name: "Score API", status: "online", uptime: "99.99%", ts: "1s ago" },
                { name: "Dashboard UI", status: "online", uptime: "100%", ts: "1s ago" },
              ].map((s, i) => (
                <div key={i} className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate">{s.name}</span>
                    <div className={`h-2.5 w-2.5 rounded-full ${s.status === 'online' ? 'bg-green-500' : s.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  </div>
                  <div className="text-xs text-muted-foreground">Up: {s.uptime}</div>
                  <div className="text-xs text-muted-foreground">Seen: {s.ts}</div>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
              <h3 className="font-semibold mb-4 text-lg">Infrastructure Status</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3">Host</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">CPU %</th>
                      <th className="px-4 py-3">Mem %</th>
                      <th className="px-4 py-3">Disk %</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { host: "prod-inf-01", role: "inference", cpu: "34%", mem: "61%", disk: "42%", status: "healthy" },
                      { host: "prod-inf-02", role: "inference", cpu: "29%", mem: "58%", disk: "41%", status: "healthy" },
                      { host: "prod-ch-01", role: "clickhouse", cpu: "78%", mem: "84%", disk: "82%", status: "warning" },
                      { host: "prod-kfk-01", role: "kafka", cpu: "12%", mem: "44%", disk: "55%", status: "healthy" },
                      { host: "prod-kfk-02", role: "kafka", cpu: "14%", mem: "45%", disk: "56%", status: "healthy" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-border/20 hover:bg-secondary/50">
                        <td className="px-4 py-3 font-mono text-xs">{row.host}</td>
                        <td className="px-4 py-3">{row.role}</td>
                        <td className="px-4 py-3">{row.cpu}</td>
                        <td className="px-4 py-3">{row.mem}</td>
                        <td className="px-4 py-3">{row.disk}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${row.status === 'healthy' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
              <h3 className="font-semibold mb-4 text-lg">Deployment Verification</h3>
              <div className="space-y-3">
                {[
                  { id: 1, text: "Edge worker configured and routing to inference", pass: true },
                  { id: 2, text: "Kafka telemetry-events topic exists and replicated", pass: true },
                  { id: 3, text: "ClickHouse materialized views up to date", pass: false },
                  { id: 4, text: "Inference engine loaded ONNX model without errors", pass: true },
                ].map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    {item.pass ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-red-500" />}
                    <span className="font-mono text-xs text-muted-foreground">{item.id}.</span>
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="max-w-7xl mx-auto w-full flex flex-col h-[600px] border border-border/50 rounded-xl overflow-hidden bg-[#0a0a0a]">
            <div className="flex items-center justify-between px-4 py-3 bg-[#111] border-b border-border/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                <Terminal className="h-4 w-4" />
                inference log (live events)
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                <button
                  onClick={fetchLogs}
                  disabled={logsLoading}
                  className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors disabled:opacity-50"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${logsLoading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={() => setLogs([])}
                  className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors"
                  title="Clear logs"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed text-green-400 space-y-1">
              {logsLoading && logs.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading events…
                </div>
              ) : logs.length === 0 ? (
                <div className="text-muted-foreground">No events ingested yet.</div>
              ) : (
                logs.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.level === "ERROR" ? "text-red-400"
                      : line.level === "WARN" ? "text-yellow-400"
                      : ""
                    }
                  >
                    [{line.ts}] [{line.level}] {line.text}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {activeTab === "metrics" && (
          <div className="max-w-7xl mx-auto w-full space-y-6">
            {metricsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metricsCards.map((m, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between h-32">
                      <div className="text-xs text-muted-foreground font-mono truncate" title={m.title}>{m.title}</div>
                      <div className="text-2xl font-bold font-mono">{m.val}</div>
                      <div className="h-8 w-full opacity-50">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={Array.from({ length: 10 }, (_, j) => ({ value: j }))}>
                            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} isAnimationActive={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>

                {prometheusText && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Prometheus Metrics — live (last 30 days)</h3>
                    <CodeBlock language="text" code={prometheusText} />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "topology" && (
          <div className="max-w-7xl mx-auto w-full space-y-6">
            <div className="p-8 rounded-xl border border-border bg-card shadow-sm flex flex-col items-center">
              <div className="w-full max-w-4xl h-auto">
                <svg viewBox="0 0 800 400" className="w-full h-full text-foreground" style={{ backgroundColor: 'transparent' }}>
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" opacity="0.6" />
                    </marker>
                  </defs>

                  <rect x="300" y="20" width="200" height="40" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
                  <text x="400" y="45" textAnchor="middle" fontSize="14" fill="currentColor" fontWeight="bold">Global Load Balancer</text>

                  <path d="M 400 60 L 400 90 L 200 90 L 200 120" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" markerEnd="url(#arrow)"/>
                  <path d="M 400 60 L 400 90 L 600 90 L 600 120" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6" markerEnd="url(#arrow)" strokeDasharray="4 4"/>

                  <rect x="50" y="120" width="300" height="240" rx="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                  <text x="200" y="145" textAnchor="middle" fontSize="16" fill="hsl(var(--primary))" fontWeight="bold">Region A (us-east-1)</text>
                  <text x="200" y="165" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.7">PRIMARY</text>

                  <rect x="80" y="190" width="240" height="30" rx="4" fill="currentColor" opacity="0.1" />
                  <text x="200" y="210" textAnchor="middle" fontSize="12" fill="currentColor">Edge / Ingress</text>

                  <rect x="80" y="240" width="240" height="30" rx="4" fill="currentColor" opacity="0.1" />
                  <text x="200" y="260" textAnchor="middle" fontSize="12" fill="currentColor">Kafka / Redpanda</text>

                  <rect x="80" y="290" width="110" height="40" rx="4" fill="currentColor" opacity="0.1" />
                  <text x="135" y="315" textAnchor="middle" fontSize="12" fill="currentColor">Inference</text>

                  <rect x="210" y="290" width="110" height="40" rx="4" fill="currentColor" opacity="0.1" />
                  <text x="265" y="315" textAnchor="middle" fontSize="12" fill="currentColor">ClickHouse</text>

                  <path d="M 350 255 L 450 255" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.4" strokeDasharray="6 6" markerEnd="url(#arrow)" markerStart="url(#arrow)"/>
                  <text x="400" y="245" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6">Cross-region replication</text>

                  <rect x="450" y="120" width="300" height="240" rx="12" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                  <text x="600" y="145" textAnchor="middle" fontSize="16" fill="currentColor" fontWeight="bold" opacity="0.5">Region B (eu-west-1)</text>
                  <text x="600" y="165" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.4">STANDBY</text>

                  <rect x="480" y="190" width="240" height="30" rx="4" fill="currentColor" opacity="0.05" />
                  <text x="600" y="210" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.4">Edge / Ingress</text>

                  <rect x="480" y="240" width="240" height="30" rx="4" fill="currentColor" opacity="0.05" />
                  <text x="600" y="260" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.4">Kafka / Redpanda</text>

                  <rect x="480" y="290" width="110" height="40" rx="4" fill="currentColor" opacity="0.05" />
                  <text x="535" y="315" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.4">Inference</text>

                  <rect x="610" y="290" width="110" height="40" rx="4" fill="currentColor" opacity="0.05" />
                  <text x="665" y="315" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.4">ClickHouse</text>
                </svg>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-sm">
              <h3 className="font-semibold mb-4 text-lg">Failover Routing</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Global load balancer monitors Region A edge health. If 5xx errors exceed 10% or endpoint fails to respond for 5s, traffic shifts to Region B. Kafka cross-region replication (MirrorMaker) runs async to maintain data.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3">Trigger Condition</th>
                      <th className="px-4 py-3">Detection Time</th>
                      <th className="px-4 py-3">Failover Time</th>
                      <th className="px-4 py-3">RPO (Data Loss)</th>
                      <th className="px-4 py-3">RTO (Downtime)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/20">
                      <td className="px-4 py-3">Edge 5xx &gt; 10%</td>
                      <td className="px-4 py-3 font-mono">5s</td>
                      <td className="px-4 py-3 font-mono">&lt; 30s</td>
                      <td className="px-4 py-3 font-mono">~10s</td>
                      <td className="px-4 py-3 font-mono">&lt; 1m</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
