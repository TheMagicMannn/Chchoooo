import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import {
  BookOpen,
  Code,
  Zap,
  ArrowRight,
  FileText,
  Webhook,
  Key,
  Globe,
  Terminal,
  CheckCircle,
} from "lucide-react";

const quickstarts = [
  {
    icon: Zap,
    title: "Google Tag Manager",
    time: "2 min",
    desc: "The fastest way to get live. Add a Custom HTML tag in GTM, paste the snippet, trigger on All Pages, and publish.",
    steps: [
      "Sign up and complete onboarding to get your API token",
      "Open GTM → Tags → New → Custom HTML",
      "Paste the PoH snippet with your token and domain",
      "Set trigger to All Pages",
      "Click Submit → Publish",
    ],
  },
  {
    icon: Code,
    title: "Direct JavaScript",
    time: "5 min",
    desc: "Works on any HTML-based site. Paste two lines before your closing </head> tag.",
    steps: [
      "Sign up and get your API token from Settings",
      "Open your site's HTML template or layout file",
      "Paste the PoH configuration block",
      "Add the async script tag pointing to poh-sdk.js",
      "Deploy — monitoring begins on the next page view",
    ],
  },
  {
    icon: Terminal,
    title: "REST API",
    time: "10 min",
    desc: "Send events directly from your backend. Full control over payload timing and session data.",
    steps: [
      "Generate an API token in Settings",
      "POST to /api/ingest with your Bearer token",
      "Include session_id, event_type, and domain in the body",
      "Add behavioral signals to the signals object for better accuracy",
      "View ingested events in Logs within seconds",
    ],
  },
  {
    icon: Globe,
    title: "WordPress Plugin",
    time: "3 min",
    desc: "Install the plugin, enter your token, and protection activates across your entire WordPress site.",
    steps: [
      "Go to Plugins → Add New in wp-admin",
      "Search for Proof of Human and install",
      "Activate the plugin",
      "Go to Settings → Proof of Human",
      "Paste your API token and click Save",
    ],
  },
];

const apiReference = [
  {
    method: "POST",
    endpoint: "/api/ingest",
    desc: "Submit a scored session event",
    auth: "Bearer token",
  },
  {
    method: "GET",
    endpoint: "/api/domains",
    desc: "List your registered domains",
    auth: "Session cookie",
  },
  {
    method: "POST",
    endpoint: "/api/domains",
    desc: "Register a new domain",
    auth: "Session cookie",
  },
  {
    method: "POST",
    endpoint: "/api/domains/:id/verify",
    desc: "Trigger DNS verification for a domain",
    auth: "Session cookie",
  },
  {
    method: "GET",
    endpoint: "/api/tokens",
    desc: "List your API tokens",
    auth: "Session cookie",
  },
  {
    method: "POST",
    endpoint: "/api/tokens",
    desc: "Create a new API token",
    auth: "Session cookie",
  },
  {
    method: "DELETE",
    endpoint: "/api/tokens/:id",
    desc: "Revoke an API token",
    auth: "Session cookie",
  },
  {
    method: "GET",
    endpoint: "/api/dashboard",
    desc: "Fetch dashboard summary metrics",
    auth: "Session cookie",
  },
  {
    method: "GET",
    endpoint: "/api/analytics",
    desc: "Fetch traffic quality analytics",
    auth: "Session cookie",
  },
  {
    method: "GET",
    endpoint: "/api/logs",
    desc: "Query session event logs",
    auth: "Session cookie",
  },
  {
    method: "GET",
    endpoint: "/api/alerts",
    desc: "List alert rules",
    auth: "Session cookie",
  },
  {
    method: "POST",
    endpoint: "/api/alerts",
    desc: "Create an alert rule",
    auth: "Session cookie",
  },
];

const sdkPayload = `window.PoH = {
  token: "YOUR_API_TOKEN",
  ingestUrl: "https://YOUR_DOMAIN/api/ingest",
  domain: "yourdomain.com"
};`;

const ingestPayload = `{
  "session_id": "sess_abc123",
  "event_type": "page_view",
  "domain": "yourdomain.com",
  "signals": {
    "composite": 0.91,
    "mouseEntropy": 0.78,
    "keystrokeCv": 0.52,
    "scrollVariance": 0.44,
    "timingScore": 0.67,
    "fingerprintScore": 0.89,
    "interactionCount": 14,
    "clickCount": 3,
    "hasWebdriver": false,
    "cookieEnabled": true,
    "hardwareConcurrency": 8,
    "pluginCount": 3
  }
}`;

const guides = [
  {
    icon: Webhook,
    title: "Setting Up Webhooks",
    desc: "Configure real-time payload delivery to your systems. Learn the webhook schema, retry logic, and how to validate payloads.",
  },
  {
    icon: Key,
    title: "Managing API Tokens",
    desc: "Best practices for token naming, rotation schedules, and revocation. How to scope tokens to specific environments.",
  },
  {
    icon: Globe,
    title: "Multi-Domain Setup",
    desc: "How to monitor multiple websites from a single account. Per-domain analytics, token scoping, and DNS verification for each domain.",
  },
  {
    icon: FileText,
    title: "Exporting & Reporting",
    desc: "Using the Log Explorer to filter session data, build custom queries, and export CSVs for your own BI tools or compliance reports.",
  },
  {
    icon: CheckCircle,
    title: "Understanding Scores",
    desc: "How to interpret human confidence scores, what score thresholds mean for your site, and how to build alert rules around them.",
  },
  {
    icon: Terminal,
    title: "Alert Rule Configuration",
    desc: "Build effective alert rules for bot spikes, geographic anomalies, and score threshold breaches. How to avoid alert fatigue.",
  },
];

export default function Resources() {
  return (
    <PublicLayout>
      <div className="w-full flex flex-col items-center">

        {/* HERO */}
        <section className="w-full max-w-4xl mx-auto px-4 pt-20 pb-14 text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Resources
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5">
            Everything you need to get up and running
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Quickstart guides, API reference, and technical guides for every
            integration method and feature.
          </p>
        </section>

        {/* QUICKSTARTS */}
        <section className="w-full max-w-6xl mx-auto px-4 pb-20">
          <h2 className="text-2xl font-bold mb-8">Quickstart Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickstarts.map((q) => (
              <div
                key={q.title}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <q.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg">{q.title}</h3>
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    ~{q.time}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {q.desc}
                </p>
                <ol className="flex flex-col gap-2">
                  {q.steps.map((s, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="font-bold text-primary shrink-0 w-4">
                        {i + 1}.
                      </span>
                      <span className="text-muted-foreground">{s}</span>
                    </li>
                  ))}
                </ol>
                <Link
                  href="/sign-up"
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Get started <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* SDK CONFIG */}
        <section className="w-full bg-secondary/30 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-2">SDK Configuration</h2>
            <p className="text-muted-foreground mb-8">
              The{" "}
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">
                window.PoH
              </code>{" "}
              object must be set before the SDK script loads. These three fields
              are required.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-semibold mb-3">SDK Config Object</p>
                <pre className="bg-background border border-border rounded-xl p-5 text-sm font-mono text-cyan-400 overflow-x-auto">
                  {sdkPayload}
                </pre>
                <div className="mt-4 flex flex-col gap-2">
                  {[
                    ["token", "Your API token from Settings → Tokens"],
                    ["ingestUrl", "Your app's ingest endpoint URL"],
                    ["domain", "The domain this SDK is installed on"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-3 text-sm">
                      <code className="text-cyan-400 shrink-0">{k}</code>
                      <span className="text-muted-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-3">
                  Ingest Payload Schema
                </p>
                <pre className="bg-background border border-border rounded-xl p-5 text-xs font-mono text-green-400 overflow-x-auto leading-relaxed">
                  {ingestPayload}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* API REFERENCE */}
        <section className="w-full max-w-6xl mx-auto px-4 py-20">
          <h2 className="text-2xl font-bold mb-8">API Reference</h2>
          <div className="border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-2">Method</div>
              <div className="col-span-4">Endpoint</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-2">Auth</div>
            </div>
            {apiReference.map((r, i) => (
              <div
                key={r.endpoint}
                className={`grid grid-cols-12 gap-4 px-5 py-3.5 items-center text-sm ${
                  i < apiReference.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="col-span-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      r.method === "GET"
                        ? "bg-green-500/10 text-green-400"
                        : r.method === "POST"
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {r.method}
                  </span>
                </div>
                <div className="col-span-4">
                  <code className="text-xs font-mono text-foreground/80">
                    {r.endpoint}
                  </code>
                </div>
                <div className="col-span-4 text-muted-foreground text-xs">
                  {r.desc}
                </div>
                <div className="col-span-2 text-xs text-muted-foreground">
                  {r.auth}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* GUIDES */}
        <section className="w-full bg-secondary/20 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Feature Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {guides.map((g) => (
                <div
                  key={g.title}
                  className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <g.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">{g.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {g.desc}
                  </p>
                  <Link
                    href="/sign-up"
                    className="text-xs font-semibold text-primary hover:underline mt-auto"
                  >
                    Read guide →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to integrate?</h2>
          <p className="text-muted-foreground mb-6">
            Create a free account and follow the onboarding to have your first
            domain monitored in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center gap-2 px-6 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              Create Free Account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/support"
              className="inline-flex h-11 items-center justify-center gap-2 px-6 border border-border rounded-md font-medium hover:bg-secondary transition-colors text-sm"
            >
              Get Help
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
