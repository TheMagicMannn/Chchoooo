import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { AlertTriangle, Shield, Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

type AlertRule = {
  id: number;
  name: string;
  condition: string;
  threshold: number;
  domain: string | null;
  action: string;
  enabled: boolean;
  triggeredCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
};

type DetectionEvent = {
  id: number;
  sessionId: string;
  verdict: string;
  score: number | null;
  domain: string | null;
  eventType: string;
  flags: string[] | null;
  country: string | null;
  createdAt: string;
};

type AlertStats = {
  botsToday: number;
  captchaToday: number;
  totalToday: number;
  activeRules: number;
};

export default function Alerts() {
  const [activeTab, setActiveTab] = useState<"rules" | "history">("rules");
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [stats, setStats] = useState<AlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [history, setHistory] = useState<DetectionEvent[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newCondition, setNewCondition] = useState("score_below");
  const [newThreshold, setNewThreshold] = useState("0.3");
  const [newAction, setNewAction] = useState("flag");
  const [newDomain, setNewDomain] = useState("");
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([api.alerts.list(), api.alerts.stats()]);
      setRules(r);
      setStats(s);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.alerts.history(50, 0);
      setHistory(data.events);
      setHistoryTotal(data.total);
    } catch {}
    finally { setHistoryLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (activeTab === "history" && history.length === 0) loadHistory();
  }, [activeTab]);

  const handleCreate = async () => {
    if (!newName.trim()) { setFormError("Name is required"); return; }
    const threshold = parseFloat(newThreshold);
    if (isNaN(threshold) || threshold < 0 || threshold > 1) { setFormError("Threshold must be between 0 and 1"); return; }
    setCreating(true);
    setFormError("");
    try {
      await api.alerts.create({
        name: newName.trim(),
        condition: newCondition,
        threshold,
        domain: newDomain.trim() || undefined,
        action: newAction,
      });
      setNewName(""); setNewThreshold("0.3"); setNewDomain(""); setShowForm(false);
      setSuccessMsg("Alert rule created");
      setTimeout(() => setSuccessMsg(""), 2000);
      load();
    } catch (e: any) {
      setFormError(e.message || "Failed to create rule");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.alerts.delete(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    try {
      await api.alerts.toggle(id, !enabled);
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !enabled } : r));
    } catch {}
  };

  const botRate = stats && stats.totalToday > 0
    ? Math.round((stats.botsToday / stats.totalToday) * 100)
    : 0;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Fraud Alerts</h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time bot detection rules and today's activity</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> New Rule
          </button>
        </div>

        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <div className="text-sm text-muted-foreground font-medium mb-1">Bots Today</div>
            <div className="text-2xl font-bold text-red-500 font-mono">{stats?.botsToday ?? 0}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <div className="text-sm text-muted-foreground font-medium mb-1">CAPTCHA Triggers</div>
            <div className="text-2xl font-bold text-yellow-500 font-mono">{stats?.captchaToday ?? 0}</div>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <div className="text-sm text-muted-foreground font-medium mb-1">Bot Rate Today</div>
            <div className={`text-2xl font-bold font-mono ${botRate > 20 ? 'text-red-500' : botRate > 10 ? 'text-yellow-500' : 'text-green-500'}`}>
              {botRate}%
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
            <div className="text-sm text-muted-foreground font-medium mb-1">Active Rules</div>
            <div className="text-2xl font-bold font-mono">{stats?.activeRules ?? 0}</div>
          </div>
        </div>

        <div className="flex gap-2 border-b border-border/40 mb-6">
          {(["rules", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "rules" ? "Detection Rules" : "Recent Detections"}
            </button>
          ))}
        </div>

        {showForm && (
          <div className="bg-card border border-primary/30 rounded-xl p-6 mb-6 shadow-lg">
            <h3 className="font-semibold text-lg mb-4">New Alert Rule</h3>
            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2 rounded mb-4">{formError}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Rule Name</label>
                <input
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="e.g. Block low-score checkouts"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Condition</label>
                <select
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                  value={newCondition}
                  onChange={(e) => setNewCondition(e.target.value)}
                >
                  <option value="score_below">Score below threshold</option>
                  <option value="bot_detected">Verdict is BOT</option>
                  <option value="captcha_required">Verdict is CAPTCHA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Threshold {newCondition === "score_below" ? "(0.0 – 1.0)" : "(ignored)"}
                </label>
                <input
                  type="number"
                  min="0" max="1" step="0.05"
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                  value={newThreshold}
                  onChange={(e) => setNewThreshold(e.target.value)}
                  disabled={newCondition !== "score_below"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Action</label>
                <select
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                >
                  <option value="flag">Flag for review</option>
                  <option value="block">Block session</option>
                  <option value="captcha">Require CAPTCHA</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Domain (optional)</label>
                <input
                  className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="yourstore.com (leave blank for all)"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {creating && <Loader2 className="w-3 h-3 animate-spin" />}
                Create Rule
              </button>
              <button
                onClick={() => { setShowForm(false); setFormError(""); }}
                className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeTab === "rules" && (
          loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : rules.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No alert rules yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first rule to start detecting and acting on bot sessions.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
              >
                Create First Rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`bg-card border rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    rule.enabled ? 'border-border' : 'border-border/40 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-md ${rule.enabled ? 'bg-primary/10' : 'bg-secondary'}`}>
                      <AlertTriangle className={`w-4 h-4 ${rule.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{rule.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {rule.condition === "score_below"
                          ? `Score below ${rule.threshold}`
                          : rule.condition === "bot_detected" ? "Verdict is BOT"
                          : rule.condition === "captcha_required" ? "Verdict is CAPTCHA"
                          : rule.condition === "score_above" ? `Score above ${rule.threshold}`
                          : rule.condition}
                        {" → "}{rule.action}
                        {rule.domain ? ` · ${rule.domain}` : " · All domains"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-xs text-muted-foreground">
                      Triggered: {rule.triggeredCount}x
                    </div>
                    <button
                      onClick={() => handleToggle(rule.id, rule.enabled)}
                      className={`w-10 h-6 rounded-full relative transition-colors ${rule.enabled ? 'bg-primary' : 'bg-secondary'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${rule.enabled ? 'right-1' : 'left-1'}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === "history" && (
          historyLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No detections yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                BOT and CAPTCHA verdicts will appear here as they are detected.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                <span className="text-sm font-medium">Recent Detections</span>
                <span className="text-xs text-muted-foreground">{historyTotal.toLocaleString()} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3">Session</th>
                      <th className="px-4 py-3">Verdict</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3 hidden md:table-cell">Domain</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Flags</th>
                      <th className="px-4 py-3 hidden sm:table-cell">Country</th>
                      <th className="px-4 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((evt) => (
                      <tr key={evt.id} className="border-b border-border/20 hover:bg-secondary/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {evt.sessionId.slice(0, 12)}…
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                            evt.verdict === "BOT"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {evt.verdict}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {(evt.score ?? 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {evt.domain || "—"}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {(evt.flags ?? []).slice(0, 3).map((f) => (
                              <span key={f} className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono">
                                {f}
                              </span>
                            ))}
                            {(evt.flags ?? []).length > 3 && (
                              <span className="text-xs text-muted-foreground">+{(evt.flags ?? []).length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                          {evt.country || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(evt.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}
