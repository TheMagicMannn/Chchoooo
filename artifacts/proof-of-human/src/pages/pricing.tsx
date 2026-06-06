import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { CheckCircle, ArrowRight, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for personal projects, developers evaluating the platform, and small sites just getting started.",
    highlight: false,
    cta: "Start Free",
    ctaHref: "/sign-up",
    sessions: "50,000 sessions/month",
    features: [
      "Up to 50,000 scored sessions/month",
      "Real-time session scoring",
      "Traffic quality dashboard",
      "1 domain",
      "API token management",
      "Log explorer (7-day retention)",
      "GTM, WordPress & JS integration",
      "REST API access",
      "Community support",
    ],
  },
  {
    name: "Growth",
    price: "$49",
    period: "per month",
    desc: "For growing businesses that need higher volume, longer data history, and priority support.",
    highlight: true,
    cta: "Start Free Trial",
    ctaHref: "/sign-up",
    sessions: "1,000,000 sessions/month",
    features: [
      "Up to 1,000,000 scored sessions/month",
      "Everything in Free",
      "Up to 10 domains",
      "Custom alert rules",
      "Webhook delivery",
      "Geographic breakdown analytics",
      "Log explorer (30-day retention)",
      "CSV export",
      "Risk scoring & bot rate tracking",
      "Priority email support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    desc: "For organizations with high-volume traffic, compliance needs, SLA requirements, or custom integration work.",
    highlight: false,
    cta: "Contact Sales",
    ctaHref: "/support",
    sessions: "Unlimited sessions",
    features: [
      "Unlimited scored sessions",
      "Everything in Growth",
      "Unlimited domains",
      "90-day log retention",
      "Dedicated account manager",
      "Custom SLA",
      "SSO / SAML",
      "Custom webhook schemas",
      "Advanced reporting",
      "On-boarding & integration support",
    ],
  },
];

const faq = [
  {
    q: "What counts as a session?",
    a: "A session is one visit to your website — from the moment a user lands to when they leave or go idle. Each session generates one score. Page views within a session don't count as separate sessions.",
  },
  {
    q: "Do I need a credit card to sign up?",
    a: "No. The Free plan requires no payment information. You only need a card when you upgrade to Growth.",
  },
  {
    q: "What happens if I exceed my monthly session limit?",
    a: "We'll notify you before you hit your limit. Sessions beyond the limit continue to be collected and scored — you won't lose data. You'll just be prompted to upgrade.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes. Upgrade or downgrade at any time. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle.",
  },
  {
    q: "Are all features available on every plan?",
    a: "Yes. Feature access is not gated by plan tier. All plans get the complete Proof of Human feature set. Plans differ only in session volume, domain count, and data retention window.",
  },
  {
    q: "Is there a free trial of the Growth plan?",
    a: "Yes — every new account gets a 14-day trial of Growth features with no credit card required. After 14 days, accounts roll back to the Free plan unless upgraded.",
  },
  {
    q: "How does billing work?",
    a: "Growth is billed monthly. You can cancel at any time — no lock-in contracts. Enterprise contracts are negotiated based on volume and requirements.",
  },
  {
    q: "Do you offer discounts for non-profits or startups?",
    a: "Yes. Contact us via the Support page with details about your organization and we'll work something out.",
  },
];

export default function Pricing() {
  return (
    <PublicLayout>
      <div className="w-full flex flex-col items-center">

        {/* HERO */}
        <section className="w-full max-w-3xl mx-auto px-4 pt-20 pb-12 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
            <Zap className="mr-2 h-3.5 w-3.5" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Start free. Scale as you grow.
          </h1>
          <p className="text-lg text-muted-foreground">
            Every plan includes all features. Pay only for the session volume
            you need. No hidden fees, no feature gates.
          </p>
        </section>

        {/* PLANS */}
        <section className="w-full max-w-6xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.highlight
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
                  <div className="flex items-end gap-1.5 mb-3">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm mb-1">
                      {plan.period}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {plan.desc}
                  </p>
                </div>

                <div className="bg-secondary/50 rounded-lg px-4 py-2.5 text-sm font-semibold text-center mb-6">
                  {plan.sessions}
                </div>

                <Link
                  href={plan.ctaHref}
                  className={`w-full inline-flex h-11 items-center justify-center rounded-md font-semibold text-sm transition-colors mb-8 gap-2 ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border border-border hover:bg-secondary"
                  }`}
                >
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </Link>

                <ul className="flex flex-col gap-3 mt-auto">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          plan.highlight ? "text-primary" : "text-primary/70"
                        }`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* COMPARISON NOTE */}
        <section className="w-full bg-secondary/20 py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">
              All features. All plans.
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              We don't believe in locking you out of features to force an
              upgrade. Real-time scoring, alert rules, webhooks, CSV export,
              risk scoring, geographic analytics — everything is available from
              the Free plan. The only variable is how many sessions you can
              score each month and how long we retain your logs.
            </p>
            <Link
              href="/features"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              See the full feature list <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full max-w-3xl mx-auto px-4 py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-6">
            {faq.map((item) => (
              <div
                key={item.q}
                className="border border-border rounded-xl p-6"
              >
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="w-full max-w-3xl mx-auto px-4 pb-24 text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-10">
            <h2 className="text-2xl font-bold mb-3">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Our team is happy to walk you through the right plan for your
              situation.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex h-11 items-center justify-center gap-2 px-6 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors text-sm"
              >
                Start for free
              </Link>
              <Link
                href="/support"
                className="inline-flex h-11 items-center justify-center gap-2 px-6 border border-border rounded-md font-medium hover:bg-secondary transition-colors text-sm"
              >
                Contact sales
              </Link>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
