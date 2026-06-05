import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { CodeBlock } from "@/components/code-block";
import { SiGoogleanalytics, SiGoogletagmanager, SiWordpress } from "react-icons/si";
import { Webhook, KeyRound, Copy, Trash2, Plus, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, Code, ExternalLink, Check, Globe } from "lucide-react";
import { api } from "@/lib/api";

type Token = { id: number; token: string; label: string; createdAt: string };
type WebhookRow = { id: number; url: string; events: string; enabled: boolean; lastFiredAt: string | null; lastStatus: string | null; createdAt: string };

export default function Integrations() {
  const [activeTab, setActiveTab] = useState("GTM");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);
  const [copiedId, setCopiedId] = useState<number | string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());

  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState("block,flag");
  const [addingWebhook, setAddingWebhook] = useState(false);
  const [webhookError, setWebhookError] = useState("");
  const [webhookSuccess, setWebhookSuccess] = useState("");
  const [testingId, setTestingId] = useState<number | null>(null);

  const tabs = ["GTM", "GA4", "WordPress", "JavaScript", "REST API", "Webhooks", "API Keys"];

  useEffect(() => {
    api.tokens.list().then(setTokens).finally(() => setLoadingTokens(false));
    api.webhooks.list().then(setWebhooks).finally(() => setLoadingWebhooks(false));
  }, []);

  const primaryToken = tokens[0]?.token ?? "YOUR_API_TOKEN";
  const primaryTokenMasked = tokens[0]
    ? tokens[0].token.slice(0, 8) + "•".repeat(16) + tokens[0].token.slice(-4)
    : "No token yet — generate one in Settings";

  const handleCopy = (text: string, id: number | string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const CopyBtn = ({ text, id }: { text: string; id: string | number }) => (
    <button onClick={() => handleCopy(text, id)} className="p-1.5 rounded border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground transition-colors">
      {copiedId === id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );

  const handleAddWebhook = async () => {
    if (!newUrl.trim()) { setWebhookError("URL is required"); return; }
    setAddingWebhook(true);
    setWebhookError("");
    try {
      const row = await api.webhooks.create({ url: newUrl.trim(), events: newEvents });
      setWebhooks((prev) => [...prev, row]);
      setNewUrl("");
      setWebhookSuccess("Webhook added");
      setTimeout(() => setWebhookSuccess(""), 2000);
    } catch (e: any) {
      setWebhookError(e.message || "Failed to add webhook");
    } finally {
      setAddingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: number) => {
    try { await api.webhooks.delete(id); setWebhooks((prev) => prev.filter((w) => w.id !== id)); } catch {}
  };

  const handleTestWebhook = async (id: number) => {
    setTestingId(id);
    try {
      const result = await api.webhooks.test(id);
      setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, lastStatus: result.ok ? "ok" : `error_${result.status}`, lastFiredAt: new Date().toISOString() } : w));
    } catch {}
    setTestingId(null);
  };

  const handleToggleWebhook = async (id: number, enabled: boolean) => {
    try { await api.webhooks.toggle(id, !enabled); setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, enabled: !enabled } : w)); } catch {}
  };

  const gtmCodeReal = `<!-- Proof of Human · Custom HTML tag · Trigger: All Pages -->
<script>
(function() {
  window.PoH = {
    token: "${primaryToken}",
    sessionId: crypto.randomUUID()
  };
  var s = document.createElement("script");
  s.src = "https://cdn.proofofhuman.io/sdk/v2.min.js";
  s.async = true;
  document.head.appendChild(s);
})();
</script>`;

  const ga4TagCode = `<!-- In your existing gtag.js / GA4 snippet, add this after config -->
<script>
  // After PoH SDK loads, forward scores to GA4 as custom events
  window.addEventListener('poh:verdict', function(e) {
    gtag('event', 'poh_verdict', {
      poh_session_id:   e.detail.sessionId,
      poh_human_score:  e.detail.score,       // 0.0–1.0
      poh_verdict:      e.detail.verdict,     // HUMAN | BOT | CAPTCHA
      poh_event_type:   e.detail.eventType
    });
  });
</script>`;

  const ga4FilterCode = `// GA4 Explorer → create a Segment with this filter to exclude bots:
//   Condition:  poh_verdict does not contain "HUMAN"
//
// Or create an Audience in Admin → Audiences:
//   Include users where:  poh_verdict exactly matches  HUMAN
// Then apply that Audience as a filter on any report.`;

  const jsDirectCode = `<!-- Add before </head> on every page you want to protect -->
<script>
  window.PoH = {
    token: "${primaryToken}",
    sessionId: crypto.randomUUID(),  // unique per page load
    onVerdict: function(result) {
      // result.score    — 0.0 (bot) to 1.0 (human)
      // result.verdict  — "HUMAN" | "BOT" | "CAPTCHA"
      console.log("PoH verdict:", result.verdict, result.score);
    }
  };
</script>
<script src="https://cdn.proofofhuman.io/sdk/v2.min.js" async></script>`;

  const jsNpmCode = `# Install via npm
npm install @proofofhuman/sdk

# or yarn
yarn add @proofofhuman/sdk`;

  const jsNpmUsageCode = `import { PoHClient } from '@proofofhuman/sdk';

const poh = new PoHClient({
  token: process.env.POH_TOKEN,      // your API token
  sessionId: crypto.randomUUID(),    // generate per session
  autoSend: true,                    // sends page_view automatically
  onVerdict: ({ score, verdict }) => {
    if (verdict === 'BOT') blockUser();
  }
});

// Manually send a specific event
await poh.track('form_submit', { formId: 'checkout' });`;

  const apiIngestCode = `curl -X POST ${window.location.origin}/api/ingest \\
  -H "Authorization: Bearer ${primaryToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id":  "sess_abc123",
    "event_type":  "page_view",
    "domain":      "example.com",
    "country":     "US",
    "score":       0.93,
    "verdict":     "HUMAN"
  }'

# Response:
# { "ok": true, "id": 42 }`;

  const apiSessionsCode = `# Get recent sessions
curl "${window.location.origin}/api/dashboard/logs?limit=10" \\
  -H "Cookie: <your-session-cookie>"

# Get analytics overview (7 day)
curl "${window.location.origin}/api/analytics/overview?range=7d" \\
  -H "Cookie: <your-session-cookie>"

# Supported ranges: 1h | 6h | 24h | 7d | 30d | 90d`;

  const apiErrorsCode = `// Error response shape
{
  "error": "Unauthorized"       // 401 — missing or invalid token
}
{
  "error": "domain is required" // 400 — validation failure
}
{
  "error": "Not found"          // 404 — resource doesn't exist
}`;

  const webhookPayloadCode = `// POST to your endpoint — application/json
{
  "event":      "bot_detected",       // bot_detected | captcha_triggered | flagged
  "timestamp":  "2026-06-05T14:23:00Z",
  "domain":     "example.com",
  "session": {
    "id":         "sess_abc123",
    "score":      0.12,               // 0.0 = definitely bot, 1.0 = definitely human
    "verdict":    "BOT",
    "event_type": "form_submit",
    "country":    "RU",
    "ip_hash":    "sha256:e3b0c4..."   // hashed, never raw
  },
  "signature":  "sha256=<hmac>"       // verify this — see below
}`;

  const webhookVerifyNodeCode = `// Node.js / Express — verify webhook signature
const crypto = require('crypto');

app.post('/webhook/poh', express.raw({ type: 'application/json' }), (req, res) => {
  const secret = process.env.POH_WEBHOOK_SECRET;
  const sig    = req.headers['x-poh-signature'];
  const body   = req.body; // raw Buffer

  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return res.status(401).send('Invalid signature');
  }

  const payload = JSON.parse(body);
  if (payload.event === 'bot_detected') {
    // block the session, flag the IP, alert your team, etc.
  }
  res.sendStatus(200);
});`;

  const webhookVerifyPythonCode = `# Python / Flask — verify webhook signature
import hmac, hashlib
from flask import request, abort

@app.route('/webhook/poh', methods=['POST'])
def poh_webhook():
    secret  = os.environ['POH_WEBHOOK_SECRET'].encode()
    sig     = request.headers.get('X-Poh-Signature', '')
    body    = request.get_data()

    expected = 'sha256=' + hmac.new(secret, body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        abort(401)

    payload = request.get_json(force=True)
    if payload['event'] == 'bot_detected':
        handle_bot(payload['session'])
    return '', 200`;

  const wpCode = `<!-- WP-CLI quick install -->
wp plugin install proof-of-human --activate
wp option update poh_api_token "${primaryToken}"
wp option update poh_mode "passive"    # or "active" to auto-block`;

  const wpShortcodeCode = `<!-- Protect a specific form or content block -->
[poh_protected mode="challenge"]
  <!-- Content only shown after human verification -->
  [contact-form-7 ...]
[/poh_protected]

<!-- In PHP templates -->
<?php if ( poh_is_human() ) : ?>
  <!-- Protected content -->
<?php endif; ?>`;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl md:text-3xl font-bold mb-1">Integrations & API</h1>
        <p className="text-muted-foreground text-sm mb-6">Detailed instructions for every way to connect Proof of Human to your stack.</p>

        <div className="flex overflow-x-auto space-x-1 border-b border-border/40 mb-8 pb-px">
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >{t}</button>
          ))}
        </div>

        {/* ── GTM ── */}
        {activeTab === "GTM" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
              <div className="p-3 bg-[#246FDB]/10 rounded-lg shrink-0"><SiGoogletagmanager className="w-8 h-8 text-[#246FDB]" /></div>
              <div>
                <h2 className="text-xl font-semibold">Google Tag Manager</h2>
                <p className="text-sm text-muted-foreground mt-1">Install without touching your codebase. One Custom HTML tag, trigger on All Pages — done in under 5 minutes.</p>
              </div>
            </div>

            {!tokens[0] && !loadingTokens && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> No API token yet — <a href="/settings" className="underline font-medium">generate one in Settings → API Tokens</a>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
              <h3 className="font-semibold text-lg">Step-by-step installation</h3>
              <ol className="space-y-3">
                {[
                  <><strong>Open GTM</strong> → go to <a href="https://tagmanager.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">tagmanager.google.com <ExternalLink className="w-3 h-3" /></a> and select your container.</>,
                  <><strong>New tag</strong> → click <em>Tags</em> in the left sidebar → <em>New</em> → click the Tag Configuration box.</>,
                  <><strong>Choose tag type</strong> → search for <em>"Custom HTML"</em> and select it.</>,
                  <><strong>Paste snippet</strong> → copy the code below and paste it into the HTML field. Do not check "Support document.write".</>,
                  <><strong>Set trigger</strong> → click the Triggering box → choose <em>All Pages</em> (fires on every page view).</>,
                  <><strong>Name &amp; save</strong> → type <em>"Proof of Human"</em> in the top left, then click Save.</>,
                  <><strong>Publish</strong> → click <em>Submit</em> in the top-right corner → add a version note like "Add PoH" → click Publish.</>,
                  <><strong>Verify in Preview</strong> → click Preview, visit your site, open the GTM Debug panel, and confirm the PoH tag fires on every page.</>,
                ].map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm"><span className="font-bold text-primary shrink-0 w-4">{i + 1}.</span><span className="text-muted-foreground">{s}</span></li>
                ))}
              </ol>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Installation snippet {tokens[0] && <span className="text-green-500 text-xs ml-2">✓ Using your real token</span>}</h4>
                  <CopyBtn text={gtmCodeReal} id="gtm-main" />
                </div>
                <CodeBlock code={gtmCodeReal} language="html" />
                {tokens[0] && <p className="text-xs text-muted-foreground mt-1">Token: {primaryTokenMasked}</p>}
              </div>

              <div className="bg-secondary/30 border border-border rounded-lg p-4 text-sm">
                <p className="font-medium mb-1">What this tag does</p>
                <ul className="text-muted-foreground space-y-1 text-xs list-disc pl-4">
                  <li>Loads the PoH SDK asynchronously (no page-speed impact)</li>
                  <li>Generates a unique <code>sessionId</code> per page load via <code>crypto.randomUUID()</code></li>
                  <li>Sends a <code>page_view</code> event to your dashboard automatically</li>
                  <li>Fires the <code>poh:verdict</code> DOM event you can listen to in other tags</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── GA4 ── */}
        {activeTab === "GA4" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
              <div className="p-3 bg-[#e37400]/10 rounded-lg shrink-0"><SiGoogleanalytics className="w-8 h-8 text-[#e37400]" /></div>
              <div>
                <h2 className="text-xl font-semibold">Google Analytics 4</h2>
                <p className="text-sm text-muted-foreground mt-1">Forward PoH bot scores to GA4 as custom event parameters. Filter bots out of reports and build bot-exclusion audiences.</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
              <h3 className="font-semibold text-lg">Part 1 — Create custom dimensions in GA4</h3>
              <p className="text-sm text-muted-foreground">GA4 needs to know about your custom parameters before they appear in reports. Do this once per property.</p>
              <ol className="space-y-2 text-sm">
                {[
                  <>Go to <strong>GA4 Admin</strong> (⚙ icon, bottom-left) → your property → <strong>Custom definitions</strong></>,
                  <>Click <strong>Create custom dimensions</strong></>,
                  <>Add three dimensions — one at a time — using the table below, then click <strong>Save</strong> after each:</>,
                ].map((s, i) => (
                  <li key={i} className="flex gap-3"><span className="font-bold text-primary shrink-0">{i + 1}.</span><span className="text-muted-foreground">{s}</span></li>
                ))}
              </ol>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-left border-b border-border text-muted-foreground text-xs">
                      <th className="pb-2 pr-4 font-medium">Dimension name</th>
                      <th className="pb-2 pr-4 font-medium">Scope</th>
                      <th className="pb-2 pr-4 font-medium">Type</th>
                      <th className="pb-2 font-medium">Event parameter</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      ["PoH Human Score", "Event", "Number", "poh_human_score"],
                      ["PoH Verdict", "Event", "Text", "poh_verdict"],
                      ["PoH Session ID", "Event", "Text", "poh_session_id"],
                    ].map(([name, scope, type, param]) => (
                      <tr key={param} className="text-muted-foreground">
                        <td className="py-2 pr-4 font-medium text-foreground">{name}</td>
                        <td className="py-2 pr-4">{scope}</td>
                        <td className="py-2 pr-4">{type}</td>
                        <td className="py-2 font-mono text-xs text-cyan-400">{param}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
              <h3 className="font-semibold text-lg">Part 2 — Forward PoH scores to GA4</h3>
              <p className="text-sm text-muted-foreground">Add this snippet <strong>after</strong> your existing PoH and GA4 tags fire. If you use GTM, add it as a second Custom HTML tag triggered on All Pages <em>after</em> the PoH tag.</p>
              <div className="relative">
                <CodeBlock code={ga4TagCode} language="javascript" />
                <CopyBtn text={ga4TagCode} id="ga4-tag" />
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-lg">Part 3 — Filter bots in GA4 reports</h3>
              <p className="text-sm text-muted-foreground">Once data is flowing, you can exclude bot traffic from any report or audience:</p>
              <CodeBlock code={ga4FilterCode} language="javascript" />
              <div className="bg-secondary/30 border border-border rounded-lg p-4 text-sm">
                <p className="font-medium mb-1">Recommended GA4 Audience: "Human visitors only"</p>
                <ol className="text-muted-foreground space-y-1 text-xs list-decimal pl-4">
                  <li>GA4 Admin → Audiences → New audience → Create custom audience</li>
                  <li>Add condition: <code>poh_verdict</code> <em>exactly matches</em> <code>HUMAN</code></li>
                  <li>Save as "Human Visitors" — apply to conversion reports for clean data</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* ── WordPress ── */}
        {activeTab === "WordPress" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
              <div className="p-3 bg-[#21759b]/10 rounded-lg shrink-0"><SiWordpress className="w-8 h-8 text-[#21759b]" /></div>
              <div>
                <h2 className="text-xl font-semibold">WordPress Plugin</h2>
                <p className="text-sm text-muted-foreground mt-1">Protects any WordPress or WooCommerce site. Passive mode scores traffic invisibly; Active mode challenges suspicious visitors with CAPTCHA.</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
              <h3 className="font-semibold text-lg">Installation — wp-admin GUI</h3>
              <ol className="space-y-2 text-sm">
                {[
                  <>In wp-admin, go to <strong>Plugins → Add New Plugin</strong></>,
                  <>Search for <strong>"Proof of Human"</strong> → click <strong>Install Now</strong> → then <strong>Activate</strong></>,
                  <>Go to <strong>Settings → Proof of Human</strong> in the left sidebar</>,
                  <>Paste your API token into the <em>API Token</em> field (copy it below)</>,
                  <>Set <em>Detection Mode</em>: <strong>Passive</strong> to collect scores silently, or <strong>Active</strong> to challenge bots in real time</>,
                  <>Enable <em>WooCommerce protection</em> to block bot checkouts (if applicable)</>,
                  <>Click <strong>Save Changes</strong> — you're live</>,
                ].map((s, i) => (
                  <li key={i} className="flex gap-3"><span className="font-bold text-primary shrink-0">{i + 1}.</span><span className="text-muted-foreground">{s}</span></li>
                ))}
              </ol>

              {tokens[0] && (
                <div className="pt-4 border-t border-border">
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Your API token</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs font-mono bg-secondary border border-border rounded px-3 py-2 truncate">
                      {revealedIds.has(tokens[0].id) ? tokens[0].token : primaryTokenMasked}
                    </code>
                    <button onClick={() => setRevealedIds((prev) => { const n = new Set(prev); n.has(tokens[0].id) ? n.delete(tokens[0].id) : n.add(tokens[0].id); return n; })} className="p-2 text-muted-foreground hover:text-foreground border border-border rounded">
                      {revealedIds.has(tokens[0].id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <CopyBtn text={tokens[0].token} id="wp-token" />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-lg">WP-CLI alternative</h3>
              <p className="text-sm text-muted-foreground">If you manage WordPress from the command line:</p>
              <CodeBlock code={wpCode} language="bash" />
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-lg">Shortcodes &amp; PHP API</h3>
              <p className="text-sm text-muted-foreground">Protect specific content blocks or forms — not just the whole site:</p>
              <CodeBlock code={wpShortcodeCode} language="php" />
            </div>
          </div>
        )}

        {/* ── JavaScript ── */}
        {activeTab === "JavaScript" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
              <div className="p-3 bg-yellow-400/10 rounded-lg shrink-0"><Code className="w-8 h-8 text-yellow-400" /></div>
              <div>
                <h2 className="text-xl font-semibold">Direct JavaScript / npm SDK</h2>
                <p className="text-sm text-muted-foreground mt-1">Full control. Load via CDN for any site, or install via npm for React, Vue, Next.js, and Node.js apps.</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
              <h3 className="font-semibold text-lg">Option A — CDN (any site)</h3>
              <p className="text-sm text-muted-foreground">Add these two lines before the <code className="text-xs">&lt;/head&gt;</code> closing tag on every page you want to protect:</p>
              <div className="relative">
                <CodeBlock code={jsDirectCode} language="html" />
                <button onClick={() => handleCopy(jsDirectCode, "js-cdn")} className="absolute top-2 right-2 p-1.5 bg-secondary/80 border border-border rounded hover:bg-secondary text-muted-foreground">
                  {copiedId === "js-cdn" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="bg-secondary/30 border border-border rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium">Configuration options</p>
                <div className="font-mono text-xs space-y-1 text-muted-foreground">
                  <div><span className="text-cyan-400">token</span>        — <em>required</em> — your API token</div>
                  <div><span className="text-cyan-400">sessionId</span>    — <em>required</em> — unique string per page load</div>
                  <div><span className="text-cyan-400">onVerdict</span>    — <em>optional</em> — callback with <code>{"{ score, verdict }"}</code></div>
                  <div><span className="text-cyan-400">autoSend</span>     — <em>optional</em> — default <code>true</code>, set <code>false</code> to send events manually</div>
                  <div><span className="text-cyan-400">endpoint</span>     — <em>optional</em> — override ingest URL for self-hosted deployments</div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
              <h3 className="font-semibold text-lg">Option B — npm / yarn</h3>
              <CodeBlock code={jsNpmCode} language="bash" />
              <div className="relative">
                <CodeBlock code={jsNpmUsageCode} language="javascript" />
                <button onClick={() => handleCopy(jsNpmUsageCode, "js-npm")} className="absolute top-2 right-2 p-1.5 bg-secondary/80 border border-border rounded hover:bg-secondary text-muted-foreground">
                  {copiedId === "js-npm" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-lg">Listening for verdict events</h3>
              <p className="text-sm text-muted-foreground">The SDK fires a DOM event when a verdict is ready — useful for dynamically showing/hiding content:</p>
              <CodeBlock code={`window.addEventListener('poh:verdict', function(e) {
  const { score, verdict, sessionId } = e.detail;

  if (verdict === 'BOT') {
    document.getElementById('checkout').remove();
    showCaptchaChallenge();
  }

  if (verdict === 'CAPTCHA') {
    // Human after solving CAPTCHA — proceed normally
  }

  // verdict === 'HUMAN' — score > 0.7 — fully trusted
});`} language="javascript" />
            </div>
          </div>
        )}

        {/* ── REST API ── */}
        {activeTab === "REST API" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
              <div className="p-3 bg-primary/10 rounded-lg shrink-0"><Globe className="w-8 h-8 text-primary" /></div>
              <div>
                <h2 className="text-xl font-semibold">REST API Reference</h2>
                <p className="text-sm text-muted-foreground mt-1">Send events and query your data directly. All endpoints require authentication via session cookie (browser) or Bearer token (server-to-server).</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 bg-green-500/20 text-green-400 rounded font-mono">POST</span>
                <code className="text-sm font-mono">/api/ingest</code>
                <span className="text-xs text-muted-foreground ml-auto">Send a session event</span>
              </div>
              <p className="text-sm text-muted-foreground">The primary endpoint. Called by the SDK automatically, or from your backend for server-side scoring.</p>
              <div className="relative">
                <CodeBlock code={apiIngestCode} language="bash" />
                <button onClick={() => handleCopy(apiIngestCode, "api-ingest")} className="absolute top-2 right-2 p-1.5 bg-secondary/80 border border-border rounded hover:bg-secondary text-muted-foreground">
                  {copiedId === "api-ingest" ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead><tr className="text-left border-b border-border text-muted-foreground"><th className="pb-2 pr-4 font-medium">Field</th><th className="pb-2 pr-4 font-medium">Type</th><th className="pb-2 pr-4 font-medium">Required</th><th className="pb-2 font-medium">Description</th></tr></thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      ["session_id", "string", "✓", "Unique identifier for this session / page load"],
                      ["event_type", "string", "✓", "page_view | form_submit | checkout | login | custom"],
                      ["domain", "string", "✓", "Your registered domain (e.g. example.com)"],
                      ["score", "number", "", "0.0–1.0 human confidence score (computed server-side if omitted)"],
                      ["verdict", "string", "", "HUMAN | BOT | CAPTCHA (computed if omitted)"],
                      ["country", "string", "", "ISO 3166-1 alpha-2 country code (e.g. US)"],
                    ].map(([field, type, req, desc]) => (
                      <tr key={field as string} className="text-muted-foreground">
                        <td className="py-2 pr-4 font-mono text-cyan-400">{field}</td>
                        <td className="py-2 pr-4 font-mono">{type}</td>
                        <td className="py-2 pr-4 text-center">{req}</td>
                        <td className="py-2">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded font-mono">GET</span>
                <code className="text-sm font-mono">/api/dashboard/logs</code>
                <span className="text-xs text-muted-foreground ml-auto">Query sessions</span>
              </div>
              <CodeBlock code={apiSessionsCode} language="bash" />
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold">Authentication</h3>
              <div className="text-sm space-y-2 text-muted-foreground">
                <p><strong className="text-foreground">Browser SDK / dashboard calls</strong> — Clerk session cookie, sent automatically. No extra headers needed.</p>
                <p><strong className="text-foreground">Server-to-server ingest</strong> — use your API token as a Bearer token:</p>
              </div>
              <CodeBlock code={`Authorization: Bearer ${primaryToken}`} language="bash" />
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold">Rate limits &amp; errors</h3>
              <div className="bg-secondary/30 border border-border rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium">Rate limits</p>
                <ul className="text-muted-foreground text-xs space-y-1 list-disc pl-4">
                  <li>Ingest: 1,000 events / minute per token</li>
                  <li>Dashboard API: 60 requests / minute per session</li>
                  <li>429 Too Many Requests returned when exceeded — retry after <code>Retry-After</code> header value</li>
                </ul>
              </div>
              <CodeBlock code={apiErrorsCode} language="javascript" />
            </div>
          </div>
        )}

        {/* ── Webhooks ── */}
        {activeTab === "Webhooks" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start gap-4 bg-card border border-border p-5 rounded-xl shadow-sm">
              <div className="p-3 bg-primary/10 rounded-lg shrink-0"><Webhook className="w-8 h-8 text-primary" /></div>
              <div>
                <h2 className="text-xl font-semibold">Webhook Endpoints</h2>
                <p className="text-sm text-muted-foreground mt-1">Receive real-time <code className="text-xs">POST</code> notifications when bot or flagged sessions are detected. Verify signatures to ensure authenticity.</p>
              </div>
            </div>

            {/* Add webhook */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="font-medium mb-4">Add Webhook Endpoint</h3>
              {webhookError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded mb-3">{webhookError}</div>}
              {webhookSuccess && <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-3 py-2 rounded mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {webhookSuccess}</div>}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Payload URL</label>
                  <input type="text" className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary" placeholder="https://your-server.com/webhook/poh" value={newUrl} onChange={(e) => { setNewUrl(e.target.value); setWebhookError(""); }} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Events to send</label>
                  <div className="flex flex-wrap gap-2">
                    {["block", "flag", "captcha"].map((ev) => {
                      const active = newEvents.split(",").includes(ev);
                      return (
                        <button key={ev} onClick={() => { const evs = newEvents.split(",").filter(Boolean); setNewEvents(active ? evs.filter((e) => e !== ev).join(",") : [...evs, ev].join(",")); }}
                          className={`text-xs px-3 py-1.5 rounded-md border transition-colors font-medium ${active ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border"}`}
                        >{ev}</button>
                      );
                    })}
                  </div>
                </div>
                <button onClick={handleAddWebhook} disabled={addingWebhook} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  {addingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Webhook
                </button>
              </div>
            </div>

            {/* Active webhooks */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border"><h3 className="font-semibold">Active Webhooks</h3></div>
              {loadingWebhooks ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : webhooks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm"><Webhook className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />No webhooks configured yet.</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {webhooks.map((hook) => (
                    <div key={hook.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-mono text-sm truncate">{hook.url}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Events: {hook.events}
                          {hook.lastFiredAt && ` · Last fired: ${new Date(hook.lastFiredAt).toLocaleString()}`}
                          {hook.lastStatus && <span className={`ml-2 font-medium ${hook.lastStatus === "ok" ? "text-green-500" : "text-red-500"}`}>{hook.lastStatus === "ok" ? "✓ OK" : `✗ ${hook.lastStatus}`}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleTestWebhook(hook.id)} disabled={testingId === hook.id} className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-secondary transition-colors disabled:opacity-50">
                          {testingId === hook.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : "Test"}
                        </button>
                        <button onClick={() => handleToggleWebhook(hook.id, hook.enabled)} className={`w-9 h-5 rounded-full relative transition-colors ${hook.enabled ? "bg-primary" : "bg-secondary"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${hook.enabled ? "right-0.5" : "left-0.5"}`} />
                        </button>
                        <button onClick={() => handleDeleteWebhook(hook.id)} className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payload schema */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-lg">Webhook payload schema</h3>
              <p className="text-sm text-muted-foreground">Every event is a <code className="text-xs">POST</code> to your URL with <code className="text-xs">Content-Type: application/json</code> and this body shape:</p>
              <div className="relative">
                <CodeBlock code={webhookPayloadCode} language="javascript" />
                <CopyBtn text={webhookPayloadCode} id="wh-payload" />
              </div>
            </div>

            {/* Signature verification */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
              <h3 className="font-semibold text-lg">Verify webhook signatures</h3>
              <p className="text-sm text-muted-foreground">Every request includes an <code className="text-xs">X-Poh-Signature</code> header. Always verify it before processing the payload to prevent spoofed requests.</p>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Node.js / Express</p>
                <div className="relative">
                  <CodeBlock code={webhookVerifyNodeCode} language="javascript" />
                  <CopyBtn text={webhookVerifyNodeCode} id="wh-node" />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Python / Flask</p>
                <div className="relative">
                  <CodeBlock code={webhookVerifyPythonCode} language="python" />
                  <CopyBtn text={webhookVerifyPythonCode} id="wh-python" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── API Keys ── */}
        {activeTab === "API Keys" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <KeyRound className="w-6 h-6" />
              <h2 className="text-xl font-semibold">API Tokens</h2>
            </div>
            <p className="text-sm text-muted-foreground">Generate and manage tokens in <a href="/settings" className="text-primary hover:underline">Settings → API Tokens</a>. Each token scopes all data to your account.</p>

            {loadingTokens ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : tokens.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
                <KeyRound className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                No tokens yet. <a href="/settings" className="text-primary hover:underline">Generate one in Settings.</a>
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((t) => (
                  <div key={t.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{t.label}</span>
                      <span className="text-xs text-muted-foreground">Created {new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs font-mono bg-secondary border border-border rounded px-3 py-2 truncate">
                        {revealedIds.has(t.id) ? t.token : t.token.slice(0, 8) + "•".repeat(16) + t.token.slice(-4)}
                      </code>
                      <button onClick={() => setRevealedIds((prev) => { const n = new Set(prev); n.has(t.id) ? n.delete(t.id) : n.add(t.id); return n; })} className="p-2 text-muted-foreground hover:text-foreground border border-border rounded">
                        {revealedIds.has(t.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <CopyBtn text={t.token} id={`tok-${t.id}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="font-semibold">Usage examples</h3>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Ingest endpoint (server-to-server)</p>
                <CodeBlock code={`curl -X POST ${window.location.origin}/api/ingest \\
  -H "Authorization: Bearer ${primaryToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"session_id":"sess_xyz","event_type":"page_view","domain":"example.com"}'`} language="bash" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Storing the token securely</p>
                <CodeBlock code={`# .env file (never commit to git)
POH_API_TOKEN=${primaryToken}

# Node.js
const token = process.env.POH_API_TOKEN;

# Python
import os
token = os.environ['POH_API_TOKEN']`} language="bash" />
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
