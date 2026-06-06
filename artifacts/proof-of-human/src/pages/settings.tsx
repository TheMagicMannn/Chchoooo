import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import {
  Globe, KeyRound, Plus, Trash2, Loader2, CheckCircle2, AlertCircle,
  Copy, Eye, EyeOff, RefreshCw, ShieldCheck, Clock, Link2, Unlink, ExternalLink,
  ChevronDown, Activity,
} from "lucide-react";
import { api } from "@/lib/api";

type Domain = {
  id: number;
  domain: string;
  verified: boolean;
  verificationToken: string | null;
  createdAt: string;
};

type Token = {
  id: number;
  token: string;
  label: string;
  linkedDomainId: number | null;
  linkedDomain: string | null;
  usageCount: number;
  lastUsedAt: string | null;
  createdAt: string;
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"domains" | "tokens">("domains");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [plan, setPlan] = useState<string>("free");
  const [domainLimit, setDomainLimit] = useState<number | null>(2);
  const [tokenLimit, setTokenLimit] = useState<number | null>(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newDomain, setNewDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);
  const [domainError, setDomainError] = useState("");
  const [newlyAddedDomain, setNewlyAddedDomain] = useState<Domain | null>(null);

  const [newTokenLabel, setNewTokenLabel] = useState("");
  const [addingToken, setAddingToken] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [revealedTokens, setRevealedTokens] = useState<Set<number>>(new Set());
  const [copiedId, setCopiedId] = useState<number | string | null>(null);

  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<number, { ok: boolean; msg: string }>>({});

  const [linkingTokenId, setLinkingTokenId] = useState<number | null>(null);
  const [linkDropdownOpen, setLinkDropdownOpen] = useState<number | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [d, t] = await Promise.all([api.domains.list(), api.tokens.list()]);
      setDomains(d.domains);
      setPlan(d.plan);
      setDomainLimit(d.domainLimit);
      setTokens(t.tokens);
      setTokenLimit(t.tokenLimit);
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
    setNewlyAddedDomain(null);
    try {
      const row = await api.domains.create(cleaned);
      setDomains((prev) => [...prev, row]);
      setNewDomain("");
      setNewlyAddedDomain(row);
      showSuccess(`Domain "${cleaned}" added — add the DNS record below to verify`);
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
      if (newlyAddedDomain?.id === id) setNewlyAddedDomain(null);
      setTokens((prev) => prev.map((t) => t.linkedDomainId === id ? { ...t, linkedDomainId: null, linkedDomain: null } : t));
      showSuccess(`Domain "${name}" removed`);
    } catch {}
  };

  const handleVerifyDomain = async (id: number) => {
    setVerifyingId(id);
    try {
      const result = await api.domains.verify(id);
      if (result.verified) {
        setDomains((prev) => prev.map((d) => d.id === id ? { ...d, verified: true } : d));
        if (newlyAddedDomain?.id === id) setNewlyAddedDomain(null);
        setVerifyResults((prev) => ({ ...prev, [id]: { ok: true, msg: "Domain verified!" } }));
        showSuccess("Domain verified successfully");
      } else if (result.dnsError) {
        setVerifyResults((prev) => ({ ...prev, [id]: { ok: false, msg: "DNS lookup failed — record may not have propagated yet (can take up to 48h)" } }));
      } else {
        setVerifyResults((prev) => ({ ...prev, [id]: { ok: false, msg: "TXT record not found. Add the record below and try again." } }));
      }
    } catch (e: any) {
      setVerifyResults((prev) => ({ ...prev, [id]: { ok: false, msg: e.message || "Verification failed" } }));
    } finally {
      setVerifyingId(null);
    }
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

  const handleLinkDomain = async (tokenId: number, domainId: number | null) => {
    setLinkingTokenId(tokenId);
    setLinkDropdownOpen(null);
    try {
      const updated = await api.tokens.linkDomain(tokenId, domainId);
      setTokens((prev) => prev.map((t) => t.id === tokenId ? { ...t, linkedDomainId: updated.linkedDomainId, linkedDomain: updated.linkedDomain } : t));
      showSuccess(domainId ? "Token linked to domain" : "Domain link removed");
    } catch (e: any) {
      setError(e.message || "Failed to update token");
    } finally {
      setLinkingTokenId(null);
    }
  };

  const handleCopy = (text: string, id: number | string) => {
    navigator.clipboard.writeText(text);
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

  const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const day = Math.floor(h / 24);
    return `${day}d ago`;
  };

  const DnsBadge = ({ domain }: { domain: Domain }) => {
    if (domain.verified) {
      return (
        <div className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3" /> Verified
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" /> Pending DNS
      </div>
    );
  };

  const DnsRecord = ({ domain }: { domain: Domain }) => {
    if (!domain.verificationToken || domain.verified) return null;
    const txtName = `_poh-verify.${domain.domain}`;
    const txtValue = `poh-site-verification=${domain.verificationToken}`;
    return (
      <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 space-y-3">
        <p className="text-xs font-medium text-amber-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> Add this DNS TXT record to verify ownership
        </p>
        <div className="grid grid-cols-1 gap-2 text-xs font-mono">
          <div>
            <span className="text-muted-foreground block mb-1">Name / Host</span>
            <div className="flex items-center gap-2 bg-secondary rounded px-3 py-2">
              <span className="flex-1 text-foreground break-all">{txtName}</span>
              <button onClick={() => handleCopy(txtName, `dns-name-${domain.id}`)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                {copiedId === `dns-name-${domain.id}` ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Type</span>
            <div className="bg-secondary rounded px-3 py-2 text-foreground">TXT</div>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Value</span>
            <div className="flex items-center gap-2 bg-secondary rounded px-3 py-2">
              <span className="flex-1 text-foreground break-all">{txtValue}</span>
              <button onClick={() => handleCopy(txtValue, `dns-val-${domain.id}`)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                {copiedId === `dns-val-${domain.id}` ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">DNS changes can take a few minutes to 48 hours to propagate. Click "Check DNS" once you've added the record.</p>
      </div>
    );
  };

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
                {(() => {
                  const atLimit = domainLimit !== null && domains.length >= domainLimit;
                  return (
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="font-semibold">Add Domain</h3>
                        {domainLimit !== null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            atLimit ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-secondary text-muted-foreground"
                          }`}>
                            {domains.length} / {domainLimit} domains used
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Register a domain to start sending events from it via your API token.
                        {domainLimit !== null && <> Free plan is limited to <strong>{domainLimit} domains</strong> per account.</>}
                      </p>
                      {atLimit && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm px-4 py-3 rounded-lg mb-3 flex items-center justify-between gap-3">
                          <span>You've reached the {domainLimit}-domain limit for the <strong>{plan}</strong> plan.</span>
                          <a href="/billing" className="shrink-0 text-xs font-semibold underline hover:text-amber-300">Upgrade →</a>
                        </div>
                      )}
                      {domainError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded mb-3">
                          {domainError}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="yoursite.com"
                          value={newDomain}
                          disabled={atLimit}
                          onChange={(e) => { setNewDomain(e.target.value); setDomainError(""); }}
                          onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
                        />
                        <button
                          onClick={handleAddDomain}
                          disabled={addingDomain || atLimit}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          {addingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Add
                        </button>
                      </div>

                      {newlyAddedDomain && !newlyAddedDomain.verified && (
                        <div className="mt-4 border-t border-border pt-4">
                          <p className="text-sm font-medium text-green-400 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Domain added! Now verify ownership via DNS.
                          </p>
                          <DnsRecord domain={newlyAddedDomain} />
                          <button
                            onClick={() => handleVerifyDomain(newlyAddedDomain.id)}
                            disabled={verifyingId === newlyAddedDomain.id}
                            className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-md text-sm font-medium hover:bg-primary/20 disabled:opacity-50"
                          >
                            {verifyingId === newlyAddedDomain.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Check DNS
                          </button>
                          {verifyResults[newlyAddedDomain.id] && (
                            <p className={`text-xs mt-2 flex items-center gap-1.5 ${verifyResults[newlyAddedDomain.id].ok ? "text-green-400" : "text-amber-400"}`}>
                              {verifyResults[newlyAddedDomain.id].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                              {verifyResults[newlyAddedDomain.id].msg}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">Registered Domains</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {domains.length} domain{domains.length !== 1 ? "s" : ""} registered
                      {domainLimit !== null ? ` · ${domainLimit - domains.length} slot${domainLimit - domains.length !== 1 ? "s" : ""} remaining` : ""}
                    </p>
                  </div>
                  {domains.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      <Globe className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                      No domains yet. Add your first domain above.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {domains.map((d) => (
                        <div key={d.id} className="px-4 py-3 hover:bg-secondary/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Globe className="w-4 h-4 text-primary shrink-0" />
                              <div>
                                <div className="font-mono text-sm font-medium">{d.domain}</div>
                                <div className="text-xs text-muted-foreground">Added {formatDate(d.createdAt)}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <DnsBadge domain={d} />
                              {!d.verified && (
                                <button
                                  onClick={() => handleVerifyDomain(d.id)}
                                  disabled={verifyingId === d.id}
                                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border border-border rounded-md hover:bg-secondary transition-colors disabled:opacity-50"
                                  title="Check DNS verification"
                                >
                                  {verifyingId === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                  Check DNS
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteDomain(d.id, d.domain)}
                                className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded"
                                title="Remove domain"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {!d.verified && d.verificationToken && (
                            <DnsRecord domain={d} />
                          )}
                          {verifyResults[d.id] && (
                            <p className={`text-xs mt-2 flex items-center gap-1.5 ${verifyResults[d.id].ok ? "text-green-400" : "text-amber-400"}`}>
                              {verifyResults[d.id].ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                              {verifyResults[d.id].msg}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tokens" && (
              <div className="space-y-4">
                {(() => {
                  const atLimit = tokenLimit !== null && tokens.length >= tokenLimit;
                  return (
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <h3 className="font-semibold">Generate API Token</h3>
                        {tokenLimit !== null && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            atLimit ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-secondary text-muted-foreground"
                          }`}>
                            {tokens.length} / {tokenLimit} tokens used
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Tokens authenticate your ingest calls. Keep them secret — treat like passwords.
                        {tokenLimit !== null && <> Free plan is limited to <strong>{tokenLimit} tokens</strong> per account.</>}
                      </p>
                      {atLimit && (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm px-4 py-3 rounded-lg mb-3 flex items-center justify-between gap-3">
                          <span>You've reached the {tokenLimit}-token limit for the <strong>{plan}</strong> plan.</span>
                          <a href="/billing" className="shrink-0 text-xs font-semibold underline hover:text-amber-300">Upgrade →</a>
                        </div>
                      )}
                      {tokenError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded mb-3">
                          {tokenError}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder="Token label (e.g. production, staging)"
                          value={newTokenLabel}
                          disabled={atLimit}
                          onChange={(e) => setNewTokenLabel(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCreateToken()}
                        />
                        <button
                          onClick={handleCreateToken}
                          disabled={addingToken || atLimit}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          {addingToken ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          Generate
                        </button>
                      </div>
                    </div>
                  );
                })()}

                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">API Tokens</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {tokens.length} token{tokens.length !== 1 ? "s" : ""} active
                        {tokenLimit !== null ? ` · ${tokenLimit - tokens.length} slot${tokenLimit - tokens.length !== 1 ? "s" : ""} remaining` : ""}
                      </p>
                    </div>
                    <a
                      href="/integrations"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View in Integrations
                    </a>
                  </div>
                  {tokens.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      <KeyRound className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                      No tokens yet. Generate your first token above.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {tokens.map((t) => (
                        <div key={t.id} className="px-4 py-4 hover:bg-secondary/20">
                          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-sm font-medium">{t.label}</span>
                                <span className="text-xs text-muted-foreground">· Created {formatDate(t.createdAt)}</span>
                                <a
                                  href="/integrations#api-keys"
                                  className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors ml-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> Integrations
                                </a>
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
                                className={`p-1.5 transition-colors rounded ${copiedId === t.id ? "text-green-400" : "text-muted-foreground hover:text-foreground"}`}
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

                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Activity className="w-3.5 h-3.5" />
                              <span className="font-mono">{t.usageCount.toLocaleString()}</span>
                              <span>events</span>
                            </div>
                            {t.lastUsedAt ? (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                Last used {formatRelative(t.lastUsedAt)}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground/50">Never used</div>
                            )}

                            <div className="relative ml-auto">
                              {linkingTokenId === t.id ? (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Updating…
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setLinkDropdownOpen(linkDropdownOpen === t.id ? null : t.id)}
                                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border bg-secondary/50 hover:bg-secondary transition-colors"
                                  >
                                    {t.linkedDomain ? (
                                      <><Link2 className="w-3.5 h-3.5 text-primary" /> <span className="font-mono">{t.linkedDomain}</span></>
                                    ) : (
                                      <><Link2 className="w-3.5 h-3.5 text-muted-foreground" /> Link domain</>
                                    )}
                                    <ChevronDown className="w-3 h-3 text-muted-foreground ml-0.5" />
                                  </button>
                                  {linkDropdownOpen === t.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-20 min-w-[180px] overflow-hidden">
                                      {t.linkedDomainId && (
                                        <button
                                          onClick={() => handleLinkDomain(t.id, null)}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-secondary transition-colors border-b border-border"
                                        >
                                          <Unlink className="w-3.5 h-3.5" /> Unlink domain
                                        </button>
                                      )}
                                      {domains.length === 0 ? (
                                        <div className="px-3 py-3 text-xs text-muted-foreground">No domains added yet</div>
                                      ) : (
                                        domains.map((d) => (
                                          <button
                                            key={d.id}
                                            onClick={() => handleLinkDomain(t.id, d.id)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary transition-colors ${
                                              t.linkedDomainId === d.id ? "text-primary bg-primary/5" : "text-foreground"
                                            }`}
                                          >
                                            <Globe className="w-3.5 h-3.5 shrink-0" />
                                            <span className="font-mono truncate">{d.domain}</span>
                                            {!d.verified && <span className="ml-auto text-amber-400 shrink-0">unverified</span>}
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </>
                              )}
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

      {linkDropdownOpen !== null && (
        <div className="fixed inset-0 z-10" onClick={() => setLinkDropdownOpen(null)} />
      )}
    </AppLayout>
  );
}
