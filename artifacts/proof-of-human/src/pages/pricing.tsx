import { Link } from "wouter";
import { PublicLayout } from "@/components/public-layout";
import { CheckCircle, ArrowRight, Zap, X, Check, Minus } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for developers evaluating the platform and small sites just getting started.",
    highlight: false,
    cta: "Start Free",
    ctaHref: "/sign-up",
    features: [
      "30,000 events / month",
      "2 domains",
      "3 API tokens",
      "120 requests / min",
      "Real-time session scoring",
      "Traffic quality dashboard",
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
    desc: "For growing businesses that need higher volume, more domains, and priority support.",
    highlight: true,
    cta: "Start Free Trial",
    ctaHref: "/sign-up",
    features: [
      "1,000,000 events / month",
      "Up to 15 domains",
      "Up to 20 API tokens",
      "1,000 requests / min",
      "Everything in Free",
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
    desc: "For organizations with high-volume traffic, compliance needs, or custom integration work.",
    highlight: false,
    cta: "Contact Sales",
    ctaHref: "/support",
    features: [
      "20,000,000+ events / month",
      "Unlimited domains",
      "Unlimited API tokens",
      "10,000 requests / min",
      "Everything in Growth",
      "90-day log retention",
      "Dedicated account manager",
      "Custom SLA",
      "SSO / SAML",
      "Custom webhook schemas",
      "On-boarding & integration support",
    ],
  },
];

type CellValue = string | boolean | null;

const comparison: { label: string; free: CellValue; growth: CellValue; enterprise: CellValue }[] = [
  { label: "Events / month",     free: "30,000",      growth: "1,000,000",   enterprise: "20,000,000+" },
  { label: "Domains",            free: "2",           growth: "15",          enterprise: "Unlimited" },
  { label: "API tokens",         free: "3",           growth: "20",          enterprise: "Unlimited" },
  { label: "Rate limit",         free: "120 req/min", growth: "1,000 req/min", enterprise: "10,000 req/min" },
  { label: "Log retention",      free: "7 days",      growth: "30 days",     enterprise: "90 days" },
  { label: "Real-time scoring",  free: true,          growth: true,          enterprise: true },
  { label: "Alert rules",        free: true,          growth: true,          enterprise: true },
  { label: "Webhook delivery",   free: false,         growth: true,          enterprise: true },
  { label: "CSV export",         free: false,         growth: true,          enterprise: true },
  { label: "Geographic analytics", free: false,       growth: true,          enterprise: true },
  { label: "SSO / SAML",         free: false,         growth: false,         enterprise: true },
  { label: "Custom SLA",         free: false,         growth: false,         enterprise: true },
  { label: "Dedicated manager",  free: false,         growth: false,         enterprise: true },
  { label: "Support",            free: "Community",   growth: "Priority email", enterprise: "Dedicated" },
];

function Cell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value === true)
    return <Check className={`h-4 w-4 mx-auto ${highlight ? "text-primary" : "text-green-500"}`} />;
  if (value === false)
    return <X className="h-4 w-4 mx-auto text-muted-foreground/30" />;
  if (value === null)
    return <Minus className="h-4 w-4 mx-auto text-muted-foreground/30" />;
  return (
    <span className={`text-sm font-medium ${highlight ? "text-primary" : ""}`}>{value}</span>
  );
}

const faq = [
  {
    q: "What counts as an event?",
    a: "An event is one scored request sent to the Proof of Human ingest API — typically one page visit or session check. Each event generates one bot-detection score.",
  },
  {
    q: "Do I need a credit card to sign up?",
    a: "No. The Free plan requires no payment information. You only need a card when you upgrade to Growth.",
  },
  {
    q: "What happens if I exceed my monthly event limit?",
    a: "Ingest requests beyond your monthly quota return a 429 status code. Your existing data and dashboard remain fully accessible — you just can't score new events until the next billing cycle or until you upgrade.",
  },
  {
    q: "What happens if I exceed my rate limit?",
    a: "Requests over your per-minute rate limit return a 429 with a Retry-After header. The limit resets every 60 seconds, so bursts are handled gracefully.",
  },
  {
    q: "Can I add more domains than my plan allows?",
    a: "No — domain limits are enforced per account. Free accounts are capped at 2 domains, Growth at 15. All domains on an account share the same event pool and rate limit.",
  },
  {
    q: "Can I change plans anytime?",
    a: "Yes. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle.",
  },
  {
    q: "Is there a free trial of the Growth plan?",
    a: "Yes — every new account gets a 14-day trial of Growth features with no credit card required. After 14 days accounts roll back to Free unless upgraded.",
  },
  {
    q: "How does billing work?",
    a: "Growth is billed monthly with no lock-in contracts. Enterprise contracts are negotiated based on volume and requirements.",
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
            All plans include real-time scoring, alert rules, and full API access.
            Limits vary by plan — no hidden fees.
          </p>
        </section>

        {/* PLAN CARDS */}
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
                    <span className="text-muted-foreground text-sm mb-1">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{plan.desc}</p>
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

        {/* COMPARISON TABLE */}
        <section className="w-full max-w-5xl mx-auto px-4 pb-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Compare plans</h2>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left px-6 py-4 font-semibold w-1/2">Feature</th>
                  <th className="text-center px-4 py-4 font-semibold">Free</th>
                  <th className="text-center px-4 py-4 font-semibold text-primary bg-primary/5">Growth</th>
                  <th className="text-center px-4 py-4 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-border/50 last:border-0 ${
                      i % 2 === 0 ? "bg-card" : "bg-secondary/10"
                    }`}
                  >
                    <td className="px-6 py-3.5 text-muted-foreground">{row.label}</td>
                    <td className="px-4 py-3.5 text-center">
                      <Cell value={row.free} />
                    </td>
                    <td className="px-4 py-3.5 text-center bg-primary/5">
                      <Cell value={row.growth} highlight />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Cell value={row.enterprise} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full max-w-3xl mx-auto px-4 pb-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-6">
            {faq.map((item) => (
              <div key={item.q} className="border border-border rounded-xl p-6">
                <h3 className="font-semibold mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="w-full max-w-3xl mx-auto px-4 pb-24 text-center">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-10">
            <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our team is happy to walk you through the right plan for your situation.
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
