import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import { Activity, Database, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";

export default function Enterprise() {
  const [activeTab, setActiveTab] = useState("SLA");
  const tabs = ["SLA", "AI Models", "False Positives", "Customer Success"];

  const EnterpriseBadge = () => <span className="text-xs font-mono bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded ml-2">ENTERPRISE</span>;
  const MVPBadge = () => <span className="text-xs font-mono bg-primary/20 text-primary px-1.5 py-0.5 rounded ml-2">MVP</span>;

  const uptimeData = Array.from({ length: 30 }).map((_, i) => ({
    day: i + 1,
    uptime: i === 12 ? 99.91 : i === 24 ? 99.95 : 100
  }));

  const modelData = [
    { name: "v2.3.1", f1: 0.9789 },
    { name: "v2.3.2", f1: 0.9812 },
    { name: "v2.4.0", f1: 0.9831 },
    { name: "v2.4.1", f1: 0.9847 }
  ];

  const funnelData = [
    { name: "Signed up", count: 1247 },
    { name: "Installed tag", count: 891 },
    { name: "First session", count: 743 },
    { name: "Dashboard view", count: 634 },
    { name: "Integration", count: 312 },
    { name: "Upgraded", count: 189 }
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6">Enterprise Operations</h1>
        
        <div className="flex overflow-x-auto space-x-2 border-b border-border/40 mb-8 pb-px hide-scrollbar">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t} <EnterpriseBadge />
            </button>
          ))}
        </div>

        {activeTab === "SLA" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2"><Activity className="w-5 h-5" /> SLA Monitoring</h2>
              <p className="text-muted-foreground mt-2 max-w-3xl">
                Track compliance with enterprise Service Level Agreements for uptime and latency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground mb-1">Uptime</div>
                <div className="text-2xl font-bold font-mono">99.994% <span className="text-sm text-muted-foreground font-normal">/ 99.99% SLA</span></div>
                <div className="mt-2 text-sm text-green-500 font-medium">Within SLA</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground mb-1">Inference P99</div>
                <div className="text-2xl font-bold font-mono">6.8ms <span className="text-sm text-muted-foreground font-normal">/ 10ms SLA</span></div>
                <div className="mt-2 text-sm text-green-500 font-medium">Within SLA</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="text-sm font-medium text-muted-foreground mb-1">Data Freshness</div>
                <div className="text-2xl font-bold font-mono">2.1s <span className="text-sm text-muted-foreground font-normal">/ 5s SLA</span></div>
                <div className="mt-2 text-sm text-green-500 font-medium">Within SLA</div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-medium mb-6">Uptime % (Last 30 Days)</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={uptimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="day" stroke="#666" tick={{fontSize: 12}} />
                    <YAxis stroke="#666" domain={[99.8, 100]} tickFormatter={(v) => v + "%"} tick={{fontSize: 12}} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #333' }} />
                    <Line type="stepAfter" dataKey="uptime" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-border bg-muted/20">
                  <h3 className="font-medium">Incident History</h3>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/10 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Duration</th>
                        <th className="px-4 py-3 text-left font-medium">Impact</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      <tr className="hover:bg-muted/5">
                        <td className="px-4 py-3 whitespace-nowrap">Jan 8, 2024</td>
                        <td className="px-4 py-3">4 min</td>
                        <td className="px-4 py-3">Inference degraded (P99 spike)</td>
                        <td className="px-4 py-3"><span className="text-green-500 font-medium">Resolved</span></td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="px-4 py-3 whitespace-nowrap">Dec 22, 2023</td>
                        <td className="px-4 py-3">0 min</td>
                        <td className="px-4 py-3">None (maintenance)</td>
                        <td className="px-4 py-3"><span className="text-green-500 font-medium">Resolved</span></td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="px-4 py-3 whitespace-nowrap">Dec 3, 2023</td>
                        <td className="px-4 py-3">12 min</td>
                        <td className="px-4 py-3">Edge worker degraded EU</td>
                        <td className="px-4 py-3"><span className="text-green-500 font-medium">Resolved</span></td>
                      </tr>
                      <tr className="hover:bg-muted/5">
                        <td className="px-4 py-3 whitespace-nowrap">Nov 14, 2023</td>
                        <td className="px-4 py-3">2 min</td>
                        <td className="px-4 py-3">Kafka consumer lag spike</td>
                        <td className="px-4 py-3"><span className="text-green-500 font-medium">Resolved</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-medium mb-6">Regional Failover Status</h3>
                
                <div className="flex flex-col gap-4 mb-8">
                  <div className="border border-primary bg-primary/5 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium">us-east-1 (Primary)</div>
                      <div className="text-sm text-muted-foreground">Serving 100% of global traffic</div>
                    </div>
                    <div className="flex items-center gap-2 bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">Active</span>
                    </div>
                  </div>

                  <div className="border border-border bg-secondary/30 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-muted-foreground">eu-west-1 (Standby)</div>
                      <div className="text-sm text-muted-foreground/60">Kafka replicated lag: 142ms</div>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full border border-border">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ready</span>
                    </div>
                  </div>

                  <div className="border border-border bg-secondary/30 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-medium text-muted-foreground">ap-southeast-1 (Standby)</div>
                      <div className="text-sm text-muted-foreground/60">Kafka replicated lag: 310ms</div>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full border border-border">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ready</span>
                    </div>
                  </div>
                </div>

                <button disabled className="w-full py-2 bg-red-500/10 text-red-500/50 border border-red-500/20 rounded-md text-sm font-medium cursor-not-allowed">
                  Trigger Failover Drill (Disabled)
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "AI Models" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2"><Cpu className="w-5 h-5" /> Model Versioning</h2>
              <p className="text-muted-foreground mt-2 max-w-3xl">
                Track inference model performance over time and rollback if false positive rates spike.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-border bg-muted/20">
                  <h3 className="font-medium">Model Registry</h3>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/10 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium">Version</th>
                        <th className="px-6 py-3 text-left font-medium">Trained</th>
                        <th className="px-6 py-3 text-left font-medium">F1 Score</th>
                        <th className="px-6 py-3 text-left font-medium">Sessions</th>
                        <th className="px-6 py-3 text-left font-medium">Status</th>
                        <th className="px-6 py-3 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      <tr className="hover:bg-muted/5">
                        <td className="px-6 py-4 font-mono font-medium">v2.4.1</td>
                        <td className="px-6 py-4 text-muted-foreground">Jan 10, 2024</td>
                        <td className="px-6 py-4 font-mono text-green-400">0.9847</td>
                        <td className="px-6 py-4">12.4M</td>
                        <td className="px-6 py-4"><span className="bg-green-500/20 text-green-500 px-2 py-0.5 rounded text-xs font-semibold">Active</span></td>
                        <td className="px-6 py-4"><button className="text-primary text-xs font-medium hover:underline">Rollback</button></td>
                      </tr>
                      <tr className="hover:bg-muted/5 opacity-70">
                        <td className="px-6 py-4 font-mono">v2.4.0</td>
                        <td className="px-6 py-4 text-muted-foreground">Dec 28, 2023</td>
                        <td className="px-6 py-4 font-mono">0.9831</td>
                        <td className="px-6 py-4">8.2M</td>
                        <td className="px-6 py-4"><span className="bg-secondary px-2 py-0.5 rounded text-xs">Archived</span></td>
                        <td className="px-6 py-4"><button className="text-muted-foreground text-xs font-medium hover:underline">Restore</button></td>
                      </tr>
                      <tr className="hover:bg-muted/5 opacity-70">
                        <td className="px-6 py-4 font-mono">v2.3.2</td>
                        <td className="px-6 py-4 text-muted-foreground">Nov 15, 2023</td>
                        <td className="px-6 py-4 font-mono">0.9812</td>
                        <td className="px-6 py-4">15.1M</td>
                        <td className="px-6 py-4"><span className="bg-secondary px-2 py-0.5 rounded text-xs">Archived</span></td>
                        <td className="px-6 py-4"><button className="text-muted-foreground text-xs font-medium hover:underline">Restore</button></td>
                      </tr>
                      <tr className="hover:bg-muted/5 opacity-70">
                        <td className="px-6 py-4 font-mono">v2.3.1</td>
                        <td className="px-6 py-4 text-muted-foreground">Oct 3, 2023</td>
                        <td className="px-6 py-4 font-mono">0.9789</td>
                        <td className="px-6 py-4">9.8M</td>
                        <td className="px-6 py-4"><span className="bg-secondary px-2 py-0.5 rounded text-xs">Archived</span></td>
                        <td className="px-6 py-4"><button className="text-muted-foreground text-xs font-medium hover:underline">Restore</button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
                <h3 className="font-medium mb-6">Model Performance (F1)</h3>
                <div className="h-48 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#666" tick={{fontSize: 12}} />
                      <YAxis stroke="#666" domain={[0.97, 0.99]} tick={{fontSize: 12}} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#111827', border: '1px solid #333' }} />
                      <Bar dataKey="f1" fill="hsl(var(--primary))">
                        {modelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === modelData.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary)/0.5)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-medium mb-6">Feature Importance</h3>
                <div className="space-y-4">
                  {[
                    { label: "Mouse trajectory entropy", val: "28%" },
                    { label: "Keystroke cadence", val: "22%" },
                    { label: "Scroll velocity", val: "18%" },
                    { label: "Network fingerprint", val: "17%" },
                    { label: "Session timing", val: "15%" },
                  ].map((f, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{f.label}</span>
                        <span className="font-mono text-muted-foreground">{f.val}</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary/70" style={{ width: f.val }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-medium mb-2">Automated Retraining Schedule</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Next scheduled retrain: <strong className="text-foreground">Feb 1, 2024</strong><br/>
                    Trigger: 30-day cycle or F1 drift &gt; 0.5%
                  </p>
                </div>
                <button className="w-full py-2 bg-secondary border border-border hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors">
                  Trigger Manual Retrain
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "False Positives" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> False Positive Review</h2>
              <p className="text-muted-foreground mt-2 max-w-3xl">
                Sessions flagged as bots but disputed by users. Review these to improve model accuracy.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="px-3 py-1 bg-secondary rounded-md">Flagged this month: <strong>23</strong></div>
              <div className="px-3 py-1 bg-secondary rounded-md text-green-500">Confirmed false positive: <strong>7</strong></div>
              <div className="px-3 py-1 bg-secondary rounded-md text-red-500">Confirmed bot: <strong>14</strong></div>
              <div className="px-3 py-1 bg-secondary rounded-md text-yellow-500 border border-yellow-500/20">Under review: <strong>2</strong></div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">Session</th>
                      <th className="px-6 py-3 text-left font-medium">Score</th>
                      <th className="px-6 py-3 text-left font-medium">Site</th>
                      <th className="px-6 py-3 text-left font-medium">Reported By</th>
                      <th className="px-6 py-3 text-left font-medium">Report</th>
                      <th className="px-6 py-3 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr className="hover:bg-muted/5">
                      <td className="px-6 py-4 font-mono text-xs">sess_4a2b</td>
                      <td className="px-6 py-4 font-mono text-red-400">0.28</td>
                      <td className="px-6 py-4">yourstore.com</td>
                      <td className="px-6 py-4"><span className="bg-secondary px-2 py-0.5 rounded text-xs">User complaint</span></td>
                      <td className="px-6 py-4 italic text-muted-foreground">"I'm real, why was I blocked?"</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="px-2 py-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded border border-green-500/20 text-xs font-medium transition-colors">Confirm FP</button>
                          <button className="px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded border border-red-500/20 text-xs font-medium transition-colors">Confirm Bot</button>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/5">
                      <td className="px-6 py-4 font-mono text-xs">sess_7c1d</td>
                      <td className="px-6 py-4 font-mono text-red-400">0.31</td>
                      <td className="px-6 py-4">client-demo.com</td>
                      <td className="px-6 py-4"><span className="bg-secondary px-2 py-0.5 rounded text-xs">User complaint</span></td>
                      <td className="px-6 py-4 italic text-muted-foreground">"Accessibility tool triggered detection?"</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="px-2 py-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded border border-green-500/20 text-xs font-medium transition-colors">Confirm FP</button>
                          <button className="px-2 py-1 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded border border-red-500/20 text-xs font-medium transition-colors">Confirm Bot</button>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-muted/5 opacity-50">
                      <td className="px-6 py-4 font-mono text-xs">sess_9e3f</td>
                      <td className="px-6 py-4 font-mono text-red-400">0.22</td>
                      <td className="px-6 py-4">yourstore.com</td>
                      <td className="px-6 py-4"><span className="bg-secondary px-2 py-0.5 rounded text-xs">Merchant review</span></td>
                      <td className="px-6 py-4 italic text-muted-foreground">"This was a real order"</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Resolved (FP)</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg text-sm text-primary/80">
              Confirmed false positives are automatically added to the training dataset. The model is scheduled to retrain if 10 confirmed FPs are recorded within a 7-day window.
            </div>
          </div>
        )}

        {activeTab === "Customer Success" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">Customer Success</h2>
              <p className="text-muted-foreground mt-2 max-w-3xl">
                Customer onboarding analytics — track how customers adopt and gain value from the platform.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="font-medium mb-6">Onboarding Funnel</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#111827', border: '1px solid #333' }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#ccc', fontSize: 12 }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-center">
                <h3 className="font-medium mb-6">Time-to-Value Metrics</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <div className="text-muted-foreground">Median time to first session</div>
                    <div className="font-medium text-lg font-mono">18 minutes</div>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <div className="text-muted-foreground">Median time to integration</div>
                    <div className="font-medium text-lg font-mono">3.2 days</div>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/50 pb-4">
                    <div className="text-muted-foreground">30-day retention</div>
                    <div className="font-medium text-lg text-green-500">84%</div>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <div className="text-muted-foreground">NPS Score</div>
                    <div className="font-medium text-xl">71</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/20">
                <h3 className="font-medium">Top Feature Adoption</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/10 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Feature</th>
                    <th className="px-6 py-3 text-left font-medium">Adoption Rate</th>
                    <th className="px-6 py-3 text-left font-medium">Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr className="hover:bg-muted/5">
                    <td className="px-6 py-3 font-medium">Bot detection (basic)</td>
                    <td className="px-6 py-3"><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-secondary rounded overflow-hidden"><div className="h-full bg-primary" style={{width: '94%'}}></div></div> 94%</div></td>
                    <td className="px-6 py-3"><MVPBadge /></td>
                  </tr>
                  <tr className="hover:bg-muted/5">
                    <td className="px-6 py-3 font-medium">CAPTCHA escalation</td>
                    <td className="px-6 py-3"><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-secondary rounded overflow-hidden"><div className="h-full bg-primary" style={{width: '67%'}}></div></div> 67%</div></td>
                    <td className="px-6 py-3"><MVPBadge /></td>
                  </tr>
                  <tr className="hover:bg-muted/5">
                    <td className="px-6 py-3 font-medium">GA4 integration</td>
                    <td className="px-6 py-3"><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-secondary rounded overflow-hidden"><div className="h-full bg-primary" style={{width: '52%'}}></div></div> 52%</div></td>
                    <td className="px-6 py-3"><MVPBadge /></td>
                  </tr>
                  <tr className="hover:bg-muted/5">
                    <td className="px-6 py-3 font-medium">Shopify integration</td>
                    <td className="px-6 py-3"><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-secondary rounded overflow-hidden"><div className="h-full bg-primary" style={{width: '38%'}}></div></div> 38%</div></td>
                    <td className="px-6 py-3"><MVPBadge /></td>
                  </tr>
                  <tr className="hover:bg-muted/5">
                    <td className="px-6 py-3 font-medium">Webhook alerts</td>
                    <td className="px-6 py-3"><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-secondary rounded overflow-hidden"><div className="h-full bg-primary" style={{width: '31%'}}></div></div> 31%</div></td>
                    <td className="px-6 py-3"><MVPBadge /></td>
                  </tr>
                  <tr className="hover:bg-muted/5">
                    <td className="px-6 py-3 font-medium text-muted-foreground">Bot fingerprinting</td>
                    <td className="px-6 py-3 text-muted-foreground"><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-secondary rounded overflow-hidden"><div className="h-full bg-purple-500/50" style={{width: '28%'}}></div></div> 28%</div></td>
                    <td className="px-6 py-3"><EnterpriseBadge /></td>
                  </tr>
                  <tr className="hover:bg-muted/5">
                    <td className="px-6 py-3 font-medium text-muted-foreground">False positive review</td>
                    <td className="px-6 py-3 text-muted-foreground"><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-secondary rounded overflow-hidden"><div className="h-full bg-purple-500/50" style={{width: '12%'}}></div></div> 12%</div></td>
                    <td className="px-6 py-3"><EnterpriseBadge /></td>
                  </tr>
                  <tr className="hover:bg-muted/5">
                    <td className="px-6 py-3 font-medium text-muted-foreground">AI model versioning</td>
                    <td className="px-6 py-3 text-muted-foreground"><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-secondary rounded overflow-hidden"><div className="h-full bg-purple-500/50" style={{width: '8%'}}></div></div> 8%</div></td>
                    <td className="px-6 py-3"><EnterpriseBadge /></td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </AppLayout>
  );
}
