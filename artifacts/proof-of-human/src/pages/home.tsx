import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import {
  ArrowRight,
  BarChart2,
  ShieldCheck,
  Zap,
  Activity,
  Globe,
  Key,
  Bell,
  FileText,
  Webhook,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Real-Time Session Scoring",
    desc: "Every visitor to your site is scored the moment they arrive. See human vs bot classification live as sessions happen — no batch processing, no delays.",
  },
  {
    icon: BarChart2,
    title: "Traffic Quality Analytics",
    desc: "Understand the true composition of your traffic. Geographic breakdown, event-type analysis, human rate over time, and session score distributions — all in one dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Domain Verification & Management",
    desc: "Verify ownership of your domains via DNS TXT records. Manage multiple sites from a single account with per-domain analytics and token scoping.",
  },
  {
    icon: Key,
    title: "API Token Management",
    desc: "Generate, label, and revoke API tokens at any time. Each token is scoped to your account so your traffic data is never shared or co-mingled.",
  },
  {
    icon: Bell,
    title: "Alert Rules & Fraud Detection",
    desc: "Define custom detection rules that trigger when bot rates spike, score thresholds are crossed, or suspicious patterns emerge. Get notified before problems escalate.",
  },
  {
    icon: Globe,
    title: "Risk Scoring & Bot Rate Tracking",
    desc: "Track bot rates over time, identify high-risk sessions, and see which traffic sources are sending the most harmful automation to your site.",
  },
  {
    icon: FileText,
    title: "Log Explorer with CSV Export",
    desc: "Drill into individual session events with full filtering by domain, score range, event type, and date. Export any view to CSV for your own reporting.",
  },
  {
    icon: Webhook,
    title: "Webhooks & Integrations",
    desc: "Push session data to your own systems in real time via webhooks. Integrates with Google Tag Manager, WordPress, GA4, and any site via direct JavaScript or REST API.",
  },
];

const integrations = [
  "Google Tag Manager",
  "WordPress",
  "Google Analytics 4",
  "Direct JavaScript",
  "REST API",
  "Webhooks",
];

const steps = [
  {
    n: "01",
    title: "Connect your site",
    desc: "Add your domain and verify ownership in under 2 minutes. No developer or server setup required.",
  },
  {
    n: "02",
    title: "Paste one tag",
    desc: "Drop a single script into Google Tag Manager, WordPress, or directly in your HTML — and you're live.",
  },
  {
    n: "03",
    title: "See real humans",
    desc: "Your dashboard fills with live session scores, traffic quality trends, bot rates, and geographic data.",
  },
];

export default function Home() {
  return (
    <PublicLayout>
      <div className="w-full flex flex-col items-center">

        {/* HERO */}
        <section className="w-full max-w-5xl mx-auto px-4 pt-24 pb-20 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4">
            <Zap className="mr-2 h-4 w-4" />
            Now available — Powered by Weebo Analytics
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 leading-[1.08]">
            Know exactly which of your<br className="hidden sm:block" /> visitors are{" "}
            <span className="text-primary">real humans.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8">
            Proof of Human detects bots, scores every session in real time, and
            gives you clear traffic quality analytics — without running a single
            server. Paste one tag, get instant visibility.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-10">
            <Link
              href="/sign-up"
              className="inline-flex h-13 items-center justify-center rounded-md bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Start Free — No Credit Card Required{" "}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/features"
              className="inline-flex h-13 items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              See All Features
            </Link>
          </div>

          <p className="mt-6 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-12">
            Works with Google Tag Manager · WordPress · GA4 · Any website
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section className="w-full bg-secondary/30 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest text-center mb-3">
              Simple by design
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14">
              How it works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((s) => (
                <div key={s.n} className="flex flex-col">
                  <div className="text-5xl font-black text-primary/20 mb-4 leading-none">
                    {s.n}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="w-full max-w-6xl mx-auto px-4 py-24">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest text-center mb-3">
            What's included
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Everything you need to protect your traffic
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            Every plan includes the full feature set. No hidden add-ons, no
            feature gating — just real-time bot detection and analytics from day
            one.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="mt-0.5 p-2 bg-primary/10 rounded-lg h-fit shrink-0">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1.5">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              See full feature breakdown <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* INTEGRATIONS */}
        <section className="w-full bg-secondary/20 py-16">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">
              Works seamlessly with
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {integrations.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border text-sm font-medium"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY POH */}
        <section className="w-full max-w-6xl mx-auto px-4 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
                Why Proof of Human
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Bot traffic is costing you real money
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Up to 40% of web traffic is automated. Bots inflate your Google
                Analytics numbers, skew your A/B tests, drain your ad budgets,
                and make your product decisions wrong. Most tools just block
                known IP ranges — they miss the sophisticated bots that look
                human.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Proof of Human analyzes behavioral signals — mouse entropy,
                keystroke patterns, scroll variance, timing anomalies,
                fingerprinting — and assigns a real-time human confidence score
                to every session. You see the truth about your traffic.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              {[
                "Behavioral signal analysis — not just IP blocklists",
                "Per-session scores, not just aggregate bot rates",
                "Works on any website, any stack, any traffic volume",
                "No servers to manage, no infrastructure to maintain",
                "Real-time data — see what's happening right now",
                "Full analytics suite built in — no extra tools needed",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="w-full max-w-4xl mx-auto px-4 pb-24">
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-12 text-center flex flex-col items-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to see your real traffic?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl">
              Set up in under 2 minutes. Free plan available — no credit card
              required. Start understanding your actual audience today.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-10 text-lg font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90 mb-4"
            >
              Create Your Free Account
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View pricing plans →
            </Link>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
