import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import {
  Activity,
  BarChart2,
  ShieldCheck,
  Key,
  Bell,
  Globe,
  FileText,
  Webhook,
  ArrowRight,
  CheckCircle,
  MousePointer,
  Clock,
  Fingerprint,
  Map,
  Filter,
  Download,
} from "lucide-react";

const coreFeatures = [
  {
    icon: Activity,
    title: "Real-Time Session Scoring",
    desc: "Every visitor is assigned a human confidence score the moment they arrive on your site. Scores range from 0 (certain bot) to 1 (certain human) and are computed from dozens of behavioral signals in milliseconds.",
    bullets: [
      "Sub-100ms scoring latency",
      "Scores recalculated as sessions evolve",
      "Live feed visible in your dashboard instantly",
      "No batch jobs, no waiting for yesterday's data",
    ],
  },
  {
    icon: BarChart2,
    title: "Traffic Quality Analytics",
    desc: "Stop making decisions based on inflated vanity metrics. Proof of Human gives you a clear, honest picture of who is actually on your site — and what they're doing.",
    bullets: [
      "Human rate % over time (hourly, daily, weekly)",
      "Session score distribution charts",
      "Traffic volume vs. quality correlation",
      "Breakdown by page, event type, and domain",
    ],
  },
  {
    icon: Globe,
    title: "Geographic Breakdown",
    desc: "See where your real human traffic comes from versus where bots originate. Identify suspicious traffic concentrations from regions that shouldn't be generating activity on your site.",
    bullets: [
      "Country and region-level attribution",
      "Bot rate by geography",
      "Human vs. bot ratio per country",
      "Exportable for compliance reporting",
    ],
  },
  {
    icon: Bell,
    title: "Alert Rules & Fraud Detection",
    desc: "Define thresholds and get notified the moment something goes wrong. Whether it's a sudden bot spike, a score collapse, or a surge from a suspicious region — you'll know before it costs you.",
    bullets: [
      "Custom rule builder (score, rate, volume thresholds)",
      "Per-domain alert configuration",
      "Real-time trigger evaluation",
      "Alert history and acknowledgment tracking",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Domain Verification & Management",
    desc: "Secure your data from the start. Prove you own your domain via DNS TXT record before any data is collected — no one can impersonate your site or steal your traffic insights.",
    bullets: [
      "DNS TXT verification flow",
      "Multiple domains per account",
      "Per-domain analytics and token scoping",
      "Instant domain status visibility",
    ],
  },
  {
    icon: Key,
    title: "API Token Management",
    desc: "Full lifecycle control over your API credentials. Generate labeled tokens for different environments, revoke compromised tokens instantly, and keep your ingest stream secure.",
    bullets: [
      "Unlimited token generation",
      "Label tokens by environment or use case",
      "Instant revocation — no wait time",
      "Tokens scoped to your account only",
    ],
  },
  {
    icon: FileText,
    title: "Log Explorer",
    desc: "The full audit trail of every session event your SDK sends. Filter, sort, and drill into individual records to investigate anomalies, validate your setup, or build reports.",
    bullets: [
      "Filter by domain, score, event type, date range",
      "Full session metadata per record",
      "CSV export for any filtered view",
      "Retained for your plan's data window",
    ],
  },
  {
    icon: Webhook,
    title: "Webhooks",
    desc: "Push scored session data to your own systems in real time. Pipe into your CRM, data warehouse, fraud platform, or any downstream tool the moment a session is scored.",
    bullets: [
      "Configurable endpoint per webhook",
      "Event payload includes full session data",
      "Delivery logs and retry visibility",
      "Supports any HTTPS endpoint",
    ],
  },
];

const signalFeatures = [
  { icon: MousePointer, title: "Mouse Entropy", desc: "Analyzes the randomness and naturalness of cursor movement patterns to distinguish human micro-gestures from scripted paths." },
  { icon: Clock, title: "Keystroke Timing", desc: "Measures the coefficient of variation in key press timing — humans are inconsistent in ways that bots can't replicate." },
  { icon: Activity, title: "Scroll Variance", desc: "Tracks scroll speed, direction changes, and pauses. Real users scroll unpredictably; bots scroll at fixed intervals." },
  { icon: Fingerprint, title: "Browser Fingerprinting", desc: "Collects canvas, WebGL, font, and hardware signals to build a device fingerprint and detect headless browsers." },
  { icon: Clock, title: "Interaction Timing", desc: "Analyzes the timing between page load and first interaction — bots act too fast or too slow." },
  { icon: Filter, title: "WebDriver Detection", desc: "Checks for automation framework indicators including navigator.webdriver flags and known automation artifacts." },
  { icon: Map, title: "Hardware Signals", desc: "Hardware concurrency, plugin count, and screen metrics help identify virtual machine environments and emulated devices." },
  { icon: Download, title: "Cookie & Storage Behavior", desc: "Verifies expected browser storage behavior that bots frequently misconfigure or omit." },
];

const integrations = [
  {
    name: "Google Tag Manager",
    desc: "Install via a Custom HTML tag in GTM — no code changes to your site. Trigger on All Pages and you're live.",
    badge: "Recommended",
  },
  {
    name: "WordPress",
    desc: "Install the Proof of Human WordPress plugin, enter your API token in Settings, and protection activates site-wide.",
    badge: null,
  },
  {
    name: "Google Analytics 4",
    desc: "Use the GTM integration to fire GA4 custom events enriched with the session's human confidence score.",
    badge: null,
  },
  {
    name: "Direct JavaScript",
    desc: "Paste a two-line snippet before </head> on any HTML page. Works with any CMS, framework, or static site.",
    badge: null,
  },
  {
    name: "REST API",
    desc: "POST session events from your backend directly. Full control over what data you send and when.",
    badge: "For developers",
  },
  {
    name: "Webhooks",
    desc: "Receive scored session payloads at your HTTPS endpoint in real time. Pipe into any downstream system.",
    badge: "For developers",
  },
];

export default function Features() {
  return (
    <PublicLayout>
      <div className="w-full flex flex-col items-center">

        {/* HERO */}
        <section className="w-full max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Weebo Analytics Features
          </p>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Every tool you need to{" "}
            <span className="text-primary">understand your real traffic</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Real-time bot detection, traffic quality analytics, domain
            management, alerts, and integrations — all included, no add-ons
            required.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 h-12 px-8 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
          >
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* CORE FEATURES */}
        <section className="w-full max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Core Features
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {coreFeatures.map((f) => (
              <div
                key={f.title}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold">{f.title}</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {f.desc}
                </p>
                <ul className="flex flex-col gap-2 mt-auto pt-2">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* BEHAVIORAL SIGNALS */}
        <section className="w-full bg-secondary/30 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest text-center mb-3">
              Under the hood
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
              Behavioral signals we analyze
            </h2>
            <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
              Proof of Human doesn't just check IP blocklists. We analyze
              real behavioral signals that distinguish humans from even the most
              sophisticated bots.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {signalFeatures.map((s) => (
                <div
                  key={s.title}
                  className="bg-card border border-border rounded-xl p-5"
                >
                  <div className="p-2 bg-primary/10 rounded-lg w-fit mb-3">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section className="w-full max-w-6xl mx-auto px-4 py-20">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest text-center mb-3">
            Works with your stack
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Integrations
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Install in under 2 minutes using any method. No developer required
            for GTM and WordPress installs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {integrations.map((i) => (
              <div
                key={i.name}
                className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{i.name}</h3>
                  {i.badge && (
                    <span className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {i.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {i.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="w-full max-w-3xl mx-auto px-4 pb-24 text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              All features. Every plan.
            </h2>
            <p className="text-muted-foreground mb-6">
              No feature tiers, no upsells. Every account gets the full Proof
              of Human feature set from day one. Plans differ only by session
              volume.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex h-12 items-center justify-center gap-2 px-8 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
              >
                Start Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-12 items-center justify-center gap-2 px-8 border border-border rounded-md font-medium hover:bg-secondary transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
