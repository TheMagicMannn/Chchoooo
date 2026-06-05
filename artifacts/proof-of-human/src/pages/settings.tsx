import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { Globe, KeyRound, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, Copy, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

type Domain = { id: number; domain: string; createdAt: string };
type Token = { id: number; token: string; label: string; createdAt: string };

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"domains" | "tokens">("domains");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newDomain, setNewDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainError, setDomainError] = useState("");

  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [addingToken, setAddingToken] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [revealedTokens, setRevealedTokens] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [d, t] = await Promise.all([api.domains.list(), api.tokens.list()]);
      setDomains(d);
      setTokens(t);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 2500);
  };

  const handleAddDomain = async () => {
    const cleaned = newDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!cleaned) { setDomainError("Enter a domain name"); return; }
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleaned)) { setDomainError("Enter a valid domain (e.g. yoursite.com)"); return; }
    setAddingDomain(true);
    setDomainError("");
    try {
      const row = await api.domains.create(cleaned);
      setDomains((prev) => [...prev, row]);
      setNewDomain("");
      showSuccess(`Domain "${cleaned}" added`);
    } catch (e: any) {
      setDomainError(e.message || "Failed to add domain");
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (id: number, name: string) => {
    try {
      await api.domains.delete(id);
      setDomains((prev) => prev.filter((d) => d.id !== id));
      showSuccess(`Domain "${name}" removed`);
    } catch {}
  };

  const handleCreateToken = async () => {
    const label = newTokenLabel.trim() || "default";
    setAddingToken(true);
    setTokenError("");
    try {
      const row = await api.tokens.create(label);
      setTokens((prev) => [...prev, row]);
      setNewTokenLabel("");
      setRevealedTokens((prev) => new Set([...prev, row.id]));
      showSuccess("API token created");
    } catch (e: any) {
      setTokenError(e.message || "Failed to create token");
    } finally {
      setAddingToken(false);
    }
  };

  const handleRevokeToken = async (id: number) => {
    try {
      await api.tokens.delete(id);
      setTokens((prev) => prev.filter((t) => t.id !== id));
      showSuccess("Token revoked");
    } catch {}
  };

  const handleCopy = (token: string, id: number) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleReveal = (id: number) => {
    setRevealedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskToken = (t: string) => t.slice(0, 8) + "•".repeat(20) + t.slice(-4);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your domains and API tokens</p>
        </div>

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="flex gap-2 border-b border-border/40 mb-6">
          {(["domains", "tokens"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "domains" ? <Globe className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
              {t === "domains" ? "Domains" : "API Tokens"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === "domains" && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold mb-1">Add Domain</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Register a domain to start sending events from it via your API token.
                  </p>
                  {domainError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded mb-3">
                      {domainError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder="yoursite.com"
                      value={newDomain}
                      onChange={(e) => { setNewDomain(e.target.value); setDomainError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
                    />
                    <button
                      onClick={handleAddDomain}
                      disabled={addingDomain}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 shrink-0"
                    >
                      {addingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Add
                    </button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">Registered Domains</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{domains.length} domain{domains.length !== 1 ? "s" : ""} registered</p>
                  </div>
                  {domains.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      <Globe className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                      No domains yet. Add your first domain above.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {domains.map((d) => (
                        <div key={d.id} className="flex items-center justify-between px-4 py-3 hover:bg-secondary/20">
                          <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-primary shrink-0" />
                            <div>
                              <div className="font-mono text-sm font-medium">{d.domain}</div>
                              <div className="text-xs text-muted-foreground">Added {formatDate(d.createdAt)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                              Active
                            </div>
                            <button
                              onClick={() => handleDeleteDomain(d.id, d.domain)}
                              className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded"
                              title="Remove domain"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tokens" && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <h3 className="font-semibold mb-1">Generate API Token</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tokens authenticate your ingest calls. Keep them secret — treat like passwords.
                  </p>
                  {tokenError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded mb-3">
                      {tokenError}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                      placeholder="Token label (e.g. production, staging)"
                      value={newTokenLabel}
                      onChange={(e) => setNewTokenLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateToken()}
                    />
                    <button
                      onClick={handleCreateToken}
                      disabled={addingToken}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 shrink-0"
                    >
                      {addingToken ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Generate
                    </button>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">API Tokens</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{tokens.length} token{tokens.length !== 1 ? "s" : ""} active</p>
                  </div>
                  {tokens.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      <KeyRound className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                      No tokens yet. Generate your first token above.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {tokens.map((t) => (
                        <div key={t.id} className="px-4 py-3 hover:bg-secondary/20">
                          <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{t.label}</span>
                                <span className="text-xs text-muted-foreground">· Created {formatDate(t.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <code className="text-xs font-mono bg-secondary px-2 py-1 rounded text-muted-foreground flex-1 min-w-0 truncate">
                                  {revealedTokens.has(t.id) ? t.token : maskToken(t.token)}
                                </code>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => toggleReveal(t.id)}
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                                title={revealedTokens.has(t.id) ? "Hide" : "Reveal"}
                              >
                                {revealedTokens.has(t.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleCopy(t.token, t.id)}
                                className={`p-1.5 transition-colors rounded ${copiedId === t.id ? 'text-green-400' : 'text-muted-foreground hover:text-foreground'}`}
                                title="Copy token"
                              >
                                {copiedId === t.id ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleRevokeToken(t.id)}
                                className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded"
                                title="Revoke token"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-secondary/50 border border-border rounded-xl p-4 text-sm text-muted-foreground">
                  <strong className="text-foreground">Usage:</strong> Pass your token as a Bearer header when calling the ingest endpoint:
                  <code className="block mt-2 bg-background border border-border rounded px-3 py-2 text-xs font-mono text-green-400 overflow-x-auto">
                    Authorization: Bearer {"<your-token>"}
                  </code>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
