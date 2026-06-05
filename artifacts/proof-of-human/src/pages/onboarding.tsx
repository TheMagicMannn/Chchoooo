import { useState } from "react";
import { Layout } from "@/components/layout";
import { Copy, Check, ChevronRight, CheckCircle, Loader2, Globe, Shield, Code, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { CodeBlock } from "@/components/code-block";
import { api } from "@/lib/api";

type DomainRow = { id: number; domain: string; verificationToken: string | null; verified: boolean };
type TokenRow = { id: number; token: string; label: string };

const REGISTRAR_GUIDES: Record<string, { name: string; steps: string[] }> = {
  cloudflare: {
    name: "Cloudflare",
    steps: [
      "Log in to dash.cloudflare.com and select your domain",
      'Click "DNS" in the left sidebar',
      'Click "Add record"',
      'Set Type to "TXT"',
      'Set Name to "_poh-verify" (Cloudflare appends your domain automatically)',
      "Paste the verification value below into the Content field",
      'Click "Save" — changes propagate within seconds on Cloudflare',
    ],
  },
  namecheap: {
    name: "Namecheap",
    steps: [
      "Log in to namecheap.com → Account → Dashboard",
      "Find your domain and click Manage",
      "Go to the Advanced DNS tab",
      'Click "Add New Record"',
      'Select TXT Record from the Type dropdown',
      'Set Host to "_poh-verify"',
      "Paste the verification value below into the Value field",
      'Set TTL to "Automatic" and click the green checkmark',
    ],
  },
  godaddy: {
    name: "GoDaddy",
    steps: [
      "Log in to godaddy.com → My Products → DNS",
      "Find your domain and click Manage DNS",
      'Click "Add" at the bottom of the DNS records table',
      'Select "TXT" from the Type dropdown',
      'Set Host to "_poh-verify"',
      "Paste the verification value below into the TXT Value field",
      'Set TTL to 600 and click "Save"',
    ],
  },
  route53: {
    name: "AWS Route 53",
    steps: [
      "Open the AWS Console → Route 53 → Hosted zones",
      "Click your domain's hosted zone",
      'Click "Create record"',
      'Set Record name to "_poh-verify"',
      'Set Record type to "TXT"',
      "Paste the verification value below (wrapped in quotes) into the Value box",
      'Click "Create records" — TTL of 300 is fine',
    ],
  },
};

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [domainInput, setDomainInput] = useState("");
  const [domainRow, setDomainRow] = useState<DomainRow | null>(null);
  const [token, setToken] = useState<TokenRow | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<"gtm" | "wordpress" | "js" | "api" | null>(null);
  const [selectedRegistrar, setSelectedRegistrar] = useState<keyof typeof REGISTRAR_GUIDES>("cloudflare");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<"idle" | "ok" | "fail">("idle");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={() => copy(text, id)}
      className="p-1.5 rounded border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground transition-colors"
    >
      {copied === id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  const handleAddDomain = async () => {
    const raw = domainInput.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!raw) { setError("Enter your website domain, e.g. example.com"); return; }
    setError("");
    setSaving(true);
    try {
      const row = await api.domains.create(raw);
      setDomainRow(row);
      setStep(2);
    } catch (e: any) {
      setError(e.message || "Failed to save domain — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDns = async () => {
    if (!domainRow) return;
    setVerifying(true);
    setVerifyResult("idle");
    try {
      const result = await api.domains.verify(domainRow.id);
      setVerifyResult(result.verified ? "ok" : "fail");
      if (result.verified) {
        setDomainRow({ ...domainRow, verified: true });
      }
    } catch {
      setVerifyResult("fail");
    } finally {
      setVerifying(false);
    }
  };

  const handleGetToken = async () => {
    setSaving(true);
    try {
      const tok = await api.tokens.create("onboarding");
      setToken(tok);
      setStep(4);
    } catch (e: any) {
      setError(e.message || "Failed to create token");
    } finally {
      setSaving(false);
    }
  };

  const txtRecordHost = `_poh-verify.${domainRow?.domain ?? "yourdomain.com"}`;
  const txtRecordValue = `poh-site-verification=${domainRow?.verificationToken ?? "your-token"}`;
  const registrar = REGISTRAR_GUIDES[selectedRegistrar];

  const gtmCode = token
    ? `<!-- Proof of Human · Custom HTML tag · Trigger: All Pages -->
<script>
(function() {
  window.PoH = {
    token: "${token.token}",
    sessionId: crypto.randomUUID()
  };
  var s = document.createElement("script");
  s.src = "https://cdn.proofofhuman.io/sdk/v2.min.js";
  s.async = true;
  document.head.appendChild(s);
})();
</script>`
    : "";

  const jsCode = token
    ? `<!-- Add this snippet before </head> on every page -->
<script>
  window.PoH = {
    token: "${token.token}",
    sessionId: crypto.randomUUID()
  };
</script>
<script src="https://cdn.proofofhuman.io/sdk/v2.min.js" async></script>`
    : "";

  const apiCode = token
    ? `curl -X POST ${window.location.origin}/api/ingest \\
  -H "Authorization: Bearer ${token.token}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "sess_abc123",
    "event_type": "page_view",
    "domain": "${domainRow?.domain ?? "yourdomain.com"}"
  }'`
    : "";

  const steps = [
    { n: 1, label: "Add domain" },
    { n: 2, label: "Verify ownership" },
    { n: 3, label: "API token" },
    { n: 4, label: "Install SDK" },
    { n: 5, label: "Done" },
  ];

  return (
    <Layout>
      <div className="w-full max-w-3xl mx-auto px-4 py-10">

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute left-0 top-4 w-full h-0.5 bg-border -z-10" />
          {steps.map(({ n, label }) => {
            const done = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex flex-col items-center gap-1 bg-background px-2 z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  done ? "bg-primary border-primary text-primary-foreground" :
                  active ? "border-primary text-primary" : "border-border text-muted-foreground"
                }`}>
                  {done ? <Check className="w-4 h-4" /> : n}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">

          {/* ── STEP 1 · Add Domain ── */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg"><Globe className="w-5 h-5 text-primary" /></div>
                <div>
                  <h2 className="text-2xl font-bold">Add your domain</h2>
                  <p className="text-sm text-muted-foreground">The domain where you'll install Proof of Human</p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Website domain</label>
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
                  placeholder="example.com"
                  className="w-full bg-background border border-input rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-base"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Just the bare domain — no <code>https://</code> or trailing slash. Subdomains like <code>app.example.com</code> are fine.
                </p>
              </div>

              <div className="bg-secondary/30 border border-border rounded-lg p-4 text-sm">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="text-muted-foreground space-y-1 list-disc pl-4">
                  <li>We'll give you a DNS TXT record to add — this proves you own the domain</li>
                  <li>You'll get a private API token to install the SDK</li>
                  <li>Bot and human data starts appearing in your dashboard within minutes</li>
                </ul>
              </div>

              <button
                onClick={handleAddDomain}
                disabled={saving}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Continue <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {/* ── STEP 2 · Verify DNS ── */}
          {step === 2 && domainRow && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg"><Shield className="w-5 h-5 text-primary" /></div>
                <div>
                  <h2 className="text-2xl font-bold">Verify domain ownership</h2>
                  <p className="text-sm text-muted-foreground">Add a DNS TXT record so we know you control <strong>{domainRow.domain}</strong></p>
                </div>
              </div>

              {/* Record to add */}
              <div className="bg-secondary/30 border border-border rounded-xl p-5 space-y-4">
                <p className="text-sm font-semibold">Add this TXT record to your DNS:</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Host / Name</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm font-mono text-cyan-400 overflow-x-auto">{txtRecordHost}</code>
                      <CopyBtn text={txtRecordHost} id="host" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Some registrars only want <code className="text-xs">_poh-verify</code> — they add the domain automatically.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Value / Content</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm font-mono text-green-400 overflow-x-auto break-all">{txtRecordValue}</code>
                      <CopyBtn text={txtRecordValue} id="value" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Type</label>
                      <div className="bg-background border border-border rounded-md px-3 py-2 text-sm font-mono">TXT</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">TTL</label>
                      <div className="bg-background border border-border rounded-md px-3 py-2 text-sm text-muted-foreground">300 (or Auto)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registrar-specific guide */}
              <div>
                <label className="block text-sm font-medium mb-2">Step-by-step guide for your registrar:</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(Object.keys(REGISTRAR_GUIDES) as Array<keyof typeof REGISTRAR_GUIDES>).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedRegistrar(key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        selectedRegistrar === key
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                      }`}
                    >
                      {REGISTRAR_GUIDES[key].name}
                    </button>
                  ))}
                </div>
                <div className="bg-background border border-border rounded-xl p-5">
                  <h4 className="text-sm font-semibold mb-3">{registrar.name} — Add TXT Record</h4>
                  <ol className="space-y-2">
                    {registrar.steps.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="font-bold text-primary shrink-0 w-4">{i + 1}.</span>
                        <span className="text-muted-foreground">{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Verify button */}
              <div className="space-y-3">
                {verifyResult === "fail" && (
                  <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm px-4 py-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">TXT record not found yet</p>
                      <p className="text-xs mt-0.5">DNS changes can take up to 48 hours, though most registrars update within a few minutes. Double-check the host and value, then try again.</p>
                    </div>
                  </div>
                )}
                {verifyResult === "ok" && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-lg">
                    <CheckCircle className="w-4 h-4" /> Domain verified!
                  </div>
                )}

                <button
                  onClick={handleVerifyDns}
                  disabled={verifying}
                  className="w-full py-3 border border-border hover:bg-secondary text-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking DNS…</> : <><RefreshCw className="w-4 h-4" /> Check DNS record</>}
                </button>

                <button
                  onClick={() => setStep(3)}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                    verifyResult === "ok"
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {verifyResult === "ok" ? <>Continue <ChevronRight className="w-4 h-4" /></> : "Skip verification for now →"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3 · API Token ── */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg"><Shield className="w-5 h-5 text-primary" /></div>
                <div>
                  <h2 className="text-2xl font-bold">Get your API token</h2>
                  <p className="text-sm text-muted-foreground">Your private token authenticates all SDK calls from <strong>{domainRow?.domain}</strong></p>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              <div className="bg-secondary/30 border border-border rounded-xl p-5 space-y-3">
                <p className="text-sm font-medium">Your token will:</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Authenticate every event your SDK sends to Proof of Human</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Scope all data to your account — your traffic is never shared</li>
                  <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" /> Allow you to rotate or revoke access any time from Settings</li>
                </ul>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Treat your token like a password. Don't commit it to public repos or paste it in client-side code without environment variables.</span>
              </div>

              <button
                onClick={handleGetToken}
                disabled={saving}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <>Generate API token <ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {/* ── STEP 4 · Install SDK ── */}
          {step === 4 && token && (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-lg"><Code className="w-5 h-5 text-primary" /></div>
                <div>
                  <h2 className="text-2xl font-bold">Install the SDK</h2>
                  <p className="text-sm text-muted-foreground">Choose how to add Proof of Human to <strong>{domainRow?.domain}</strong></p>
                </div>
              </div>

              {/* Token display */}
              <div className="bg-secondary/30 border border-border rounded-xl p-4">
                <label className="block text-xs font-medium text-muted-foreground mb-2">Your API token — copy this before leaving</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm font-mono text-cyan-400 truncate">{token.token}</code>
                  <CopyBtn text={token.token} id="token" />
                </div>
              </div>

              {/* Method selection */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: "gtm", title: "Google Tag Manager", desc: "Recommended — no code changes needed" },
                  { key: "wordpress", title: "WordPress Plugin", desc: "For WordPress / WooCommerce sites" },
                  { key: "js", title: "Direct JavaScript", desc: "Paste a snippet into your HTML" },
                  { key: "api", title: "REST API", desc: "Send events directly from your backend" },
                ] as const).map(({ key, title, desc }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMethod(key)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      selectedMethod === key ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">{title}</div>
                    <div className="text-xs text-muted-foreground">{desc}</div>
                  </button>
                ))}
              </div>

              {/* Method instructions */}
              {selectedMethod === "gtm" && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-semibold">Google Tag Manager — step by step</h3>
                  <ol className="space-y-2 text-sm">
                    {[
                      <>Open <a href="https://tagmanager.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">tagmanager.google.com <ExternalLink className="w-3 h-3" /></a> and select your container</>,
                      "Click Tags in the left sidebar → New",
                      "Click the Tag Configuration box → choose Custom HTML",
                      "Paste the snippet below into the HTML field",
                      "Click Triggering → choose All Pages (Page View)",
                      "Name the tag \"Proof of Human\" and click Save",
                      "Click Submit → Publish to make it live",
                    ].map((s, i) => (
                      <li key={i} className="flex gap-3"><span className="font-bold text-primary shrink-0">{i + 1}.</span><span className="text-muted-foreground">{s}</span></li>
                    ))}
                  </ol>
                  <div className="relative">
                    <CodeBlock code={gtmCode} language="html" />
                    <button onClick={() => copy(gtmCode, "gtm-install")} className="absolute top-2 right-2 p-1.5 bg-secondary/80 border border-border rounded hover:bg-secondary text-muted-foreground">
                      {copied === "gtm-install" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {selectedMethod === "wordpress" && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-semibold">WordPress Plugin — step by step</h3>
                  <ol className="space-y-2 text-sm">
                    {[
                      "In wp-admin, go to Plugins → Add New Plugin",
                      'Search for "Proof of Human" and click Install Now → Activate',
                      "Go to Settings → Proof of Human",
                      "Paste your API token (above) into the API Token field",
                      "Select your protection mode (Passive recommended to start)",
                      "Click Save Changes — protection is now active",
                    ].map((s, i) => (
                      <li key={i} className="flex gap-3"><span className="font-bold text-primary shrink-0">{i + 1}.</span><span className="text-muted-foreground">{s}</span></li>
                    ))}
                  </ol>
                  <div className="bg-secondary/30 border border-border rounded-lg p-4 text-sm">
                    <p className="font-medium mb-1">WP-CLI alternative</p>
                    <CodeBlock code={`wp plugin install proof-of-human --activate\nwp option update poh_api_token "${token.token}"`} language="bash" />
                  </div>
                </div>
              )}

              {selectedMethod === "js" && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-semibold">Direct JavaScript — step by step</h3>
                  <ol className="space-y-2 text-sm">
                    {[
                      "Open the HTML template for your site (or your layout file)",
                      "Paste the snippet below just before the closing </head> tag",
                      "Deploy your updated template — that's it",
                    ].map((s, i) => (
                      <li key={i} className="flex gap-3"><span className="font-bold text-primary shrink-0">{i + 1}.</span><span className="text-muted-foreground">{s}</span></li>
                    ))}
                  </ol>
                  <div className="relative">
                    <CodeBlock code={jsCode} language="html" />
                    <button onClick={() => copy(jsCode, "js-install")} className="absolute top-2 right-2 p-1.5 bg-secondary/80 border border-border rounded hover:bg-secondary text-muted-foreground">
                      {copied === "js-install" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">The SDK loads asynchronously and won't block your page. Each page view generates a unique <code className="text-xs">sessionId</code>.</p>
                </div>
              )}

              {selectedMethod === "api" && (
                <div className="space-y-4 animate-in fade-in">
                  <h3 className="font-semibold">REST API — send events from your backend</h3>
                  <p className="text-sm text-muted-foreground">POST events to our ingest endpoint from your server-side code. Use this when you want full control over when and what you send.</p>
                  <div className="relative">
                    <CodeBlock code={apiCode} language="bash" />
                    <button onClick={() => copy(apiCode, "api-install")} className="absolute top-2 right-2 p-1.5 bg-secondary/80 border border-border rounded hover:bg-secondary text-muted-foreground">
                      {copied === "api-install" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="bg-secondary/30 border border-border rounded-lg p-4 text-sm space-y-2">
                    <p className="font-medium">Required fields:</p>
                    <ul className="text-muted-foreground space-y-1 text-xs font-mono">
                      <li><span className="text-cyan-400">session_id</span> — unique string per user session</li>
                      <li><span className="text-cyan-400">event_type</span> — page_view | form_submit | checkout | login</li>
                      <li><span className="text-cyan-400">domain</span> — your registered domain</li>
                    </ul>
                  </div>
                </div>
              )}

              <button
                onClick={() => setStep(5)}
                disabled={!selectedMethod}
                className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                I've installed it — finish setup <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 5 · Done ── */}
          {step === 5 && (
            <div className="animate-in fade-in zoom-in-95 text-center py-6 space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                  <CheckCircle className="w-20 h-20 text-green-500 relative z-10" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
                <p className="text-muted-foreground">
                  <strong>{domainRow?.domain}</strong> is registered and your SDK is installed.
                  Live bot and human data will appear in your dashboard within a few minutes of real traffic.
                </p>
              </div>

              {token && (
                <div className="text-left bg-secondary/30 border border-border rounded-xl p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Test your setup with curl:</p>
                  <pre className="text-xs font-mono text-cyan-400 overflow-x-auto whitespace-pre-wrap break-all">{apiCode}</pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/connect" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                  Open Dashboard
                </Link>
                <Link href="/integrations" className="px-6 py-3 bg-secondary text-foreground rounded-lg font-semibold border border-border hover:bg-secondary/80 transition-colors">
                  View Integration Docs
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
