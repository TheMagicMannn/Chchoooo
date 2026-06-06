import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import {
  Mail,
  BookOpen,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Clock,
  Zap,
  AlertTriangle,
} from "lucide-react";

const faq = [
  {
    q: "How do I get my API token?",
    a: "After signing up and completing onboarding, go to Settings → Tokens. Click 'Create Token', give it a label, and copy the value. Store it safely — it's only shown once.",
  },
  {
    q: "How do I verify my domain?",
    a: "Go through the Onboarding flow or visit Settings → Domains. Click 'Verify' next to your domain, then add the provided TXT record to your DNS. Click 'Check Verification' — DNS propagation usually takes 1–5 minutes.",
  },
  {
    q: "My dashboard is showing no data. What's wrong?",
    a: "This usually means the SDK isn't firing. Check: (1) your API token is correct, (2) the domain in window.PoH.domain exactly matches your verified domain, (3) the script tag is loading — open browser DevTools → Network and look for poh-sdk.js. Also check Logs in the dashboard to confirm events are being received.",
  },
  {
    q: "Why is my human rate lower than expected?",
    a: "A low human rate (below ~60%) is common for sites with significant bot traffic or crawler activity. Search engines, monitoring bots, and load testing tools all score as bots. The goal of Proof of Human is to surface this accurately, not hide it.",
  },
  {
    q: "Can I use Proof of Human on multiple domains?",
    a: "Yes. Free plan supports 1 domain. Growth plan supports up to 10 domains. Enterprise supports unlimited domains. Each domain is verified separately via DNS and gets its own analytics view.",
  },
  {
    q: "How do I set up webhooks?",
    a: "Go to Settings → Webhooks and click 'Add Webhook'. Enter your HTTPS endpoint URL. Session events will be POSTed to your endpoint in real time as they are ingested and scored.",
  },
  {
    q: "What data is included in the ingest payload?",
    a: "Each ingest event includes a session_id, event_type, domain, timestamp, and a signals object with behavioral scores including mouse entropy, keystroke timing coefficient of variation, scroll variance, fingerprint score, interaction count, and hardware signals.",
  },
  {
    q: "How do I export my session data?",
    a: "Go to Logs in the dashboard. Apply any filters you need (date range, domain, score range, event type), then click the 'Export CSV' button. The full filtered result set is exported.",
  },
  {
    q: "Can I cancel my plan at any time?",
    a: "Yes. There are no long-term contracts. Cancel from the Billing page at any time. Your account rolls back to the Free plan at the end of your current billing cycle.",
  },
  {
    q: "My alert rule isn't firing. Why?",
    a: "Check that (1) your domain is verified and receiving events, (2) the threshold in your rule is configured correctly (e.g. bot_rate > 0.5 means more than 50% bots), and (3) the evaluation window has enough data. Alert rules need at least 10 sessions in the window to fire.",
  },
];

const contactChannels = [
  {
    icon: Mail,
    title: "Email Support",
    desc: "Send us a detailed message and we'll get back to you within one business day. Include your domain and a description of the issue.",
    action: "support@proofofhuman.io",
    actionType: "email",
    badge: "All plans",
  },
  {
    icon: MessageSquare,
    title: "Priority Support",
    desc: "Growth and Enterprise customers get priority queue access with faster response times and direct escalation paths.",
    action: "Available on Growth & Enterprise",
    actionType: "info",
    badge: "Growth / Enterprise",
  },
  {
    icon: BookOpen,
    title: "Documentation",
    desc: "Browse quickstart guides, API reference, and feature guides to solve most issues yourself in under 5 minutes.",
    action: "Browse Resources",
    actionType: "link",
    href: "/resources",
    badge: "Always available",
  },
];

const commonIssues = [
  {
    icon: AlertTriangle,
    title: "No data in dashboard",
    steps: [
      "Verify the SDK script is loading in browser DevTools → Network",
      "Confirm window.PoH.token matches your token in Settings",
      "Check window.PoH.domain exactly matches your verified domain (no www mismatch)",
      "Open the Logs page — events should appear within seconds of a page view",
    ],
  },
  {
    icon: Clock,
    title: "Domain stuck on 'Pending Verification'",
    steps: [
      "Copy the TXT record value from the Onboarding or Settings page",
      "Add it to your DNS provider as a TXT record on @ or your root domain",
      "Wait 1–5 minutes for DNS propagation",
      "Return to the app and click 'Check Verification'",
      "Use a tool like Google Toolbox DNS Checker to confirm the record is live",
    ],
  },
  {
    icon: Zap,
    title: "Webhooks not delivering",
    steps: [
      "Confirm your endpoint URL is HTTPS (HTTP endpoints are rejected)",
      "Check your server is returning a 2xx status code within 10 seconds",
      "View delivery logs in Settings → Webhooks to see error details",
      "Test your endpoint with a tool like Webhook.site before connecting",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Alert rules not triggering",
    steps: [
      "Ensure your domain has at least 10 sessions in the alert's evaluation window",
      "Double-check the threshold direction (bot_rate > 0.5 = fire when bots exceed 50%)",
      "Verify the domain filter in the rule matches your verified domain exactly",
      "Check that the rule is enabled (toggle is green)",
    ],
  },
];

export default function Support() {
  return (
    <PublicLayout>
      <div className="w-full flex flex-col items-center">

        {/* HERO */}
        <section className="w-full max-w-3xl mx-auto px-4 pt-20 pb-14 text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Support
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5">
            We're here to help
          </h1>
          <p className="text-lg text-muted-foreground">
            Find answers in our FAQ, troubleshoot common issues, or get in
            touch with our team directly.
          </p>
        </section>

        {/* CONTACT CHANNELS */}
        <section className="w-full max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {contactChannels.map((c) => (
              <div
                key={c.title}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <c.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                    {c.badge}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {c.desc}
                  </p>
                </div>
                <div className="mt-auto pt-2">
                  {c.actionType === "email" && (
                    <a
                      href={`mailto:${c.action}`}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      {c.action} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {c.actionType === "link" && (
                    <Link
                      href={c.href!}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      {c.action} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                  {c.actionType === "info" && (
                    <span className="text-sm text-muted-foreground">
                      {c.action}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* COMMON ISSUES */}
        <section className="w-full bg-secondary/30 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Common Issues & Fixes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {commonIssues.map((issue) => (
                <div
                  key={issue.title}
                  className="bg-card border border-border rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <issue.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">{issue.title}</h3>
                  </div>
                  <ol className="flex flex-col gap-2.5">
                    {issue.steps.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="text-primary font-bold shrink-0">
                          {i + 1}.
                        </span>
                        <span className="text-muted-foreground">{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full max-w-3xl mx-auto px-4 py-20">
          <h2 className="text-2xl font-bold mb-10">
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-5">
            {faq.map((item) => (
              <div
                key={item.q}
                className="border border-border rounded-xl p-6"
              >
                <h3 className="font-semibold mb-2.5 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {item.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* RESPONSE TIMES */}
        <section className="w-full bg-secondary/20 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl font-bold text-center mb-8">
              Support Response Times
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  plan: "Free",
                  time: "3–5 business days",
                  channel: "Email only",
                  color: "border-border",
                },
                {
                  plan: "Growth",
                  time: "1 business day",
                  channel: "Priority email",
                  color: "border-primary/40",
                },
                {
                  plan: "Enterprise",
                  time: "Same day (SLA)",
                  channel: "Dedicated contact",
                  color: "border-primary",
                },
              ].map((s) => (
                <div
                  key={s.plan}
                  className={`border ${s.color} bg-card rounded-xl p-5 text-center`}
                >
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    {s.plan} Plan
                  </p>
                  <p className="text-lg font-bold mb-1">{s.time}</p>
                  <p className="text-xs text-muted-foreground">{s.channel}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="w-full max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-3">
            Couldn't find what you need?
          </h2>
          <p className="text-muted-foreground mb-6">
            Email us directly and we'll respond within one business day.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a
              href="mailto:support@proofofhuman.io"
              className="inline-flex h-11 items-center justify-center gap-2 px-6 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors text-sm"
            >
              <Mail className="h-4 w-4" /> Email Support
            </a>
            <Link
              href="/resources"
              className="inline-flex h-11 items-center justify-center gap-2 px-6 border border-border rounded-md font-medium hover:bg-secondary transition-colors text-sm"
            >
              Browse Documentation
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
