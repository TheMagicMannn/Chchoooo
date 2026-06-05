import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { CheckCircle2, Download, CreditCard, ArrowRight, Zap, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

interface UsageData {
  plan: string;
  planLabel: string;
  price: string;
  eventsUsed: number;
  quota: number;
  pctUsed: number;
  resetAt: string;
}

const PLAN_QUOTAS: Record<string, { label: string; quota: string; price: string; reqMin: string }> = {
  free:       { label: "Free",       quota: "30,000",    price: "$0",       reqMin: "120" },
  growth:     { label: "Growth",     quota: "1,000,000", price: "$49.99",   reqMin: "1,000" },
  enterprise: { label: "Enterprise", quota: "20,000,000",price: "$499.00",  reqMin: "10,000" },
};

function UsageBar({ pct, warn }: { pct: number; warn: boolean }) {
  return (
    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          warn ? "bg-amber-500" : pct >= 100 ? "bg-red-500" : "bg-primary"
        }`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString();
}

function resetDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function Billing() {
  const [activeTab, setActiveTab] = useState("Plan & Usage");
  const tabs = ["Plan & Usage", "Invoices"];

  const { data: usage, isLoading, isError } = useQuery<UsageData>({
    queryKey: ["billing-usage"],
    queryFn: () => api.billing.usage(),
    staleTime: 2 * 60 * 1000,
  });

  const plan     = usage?.plan ?? "free";
  const pct      = usage?.pctUsed ?? 0;
  const nearLimit = pct >= 80;
  const atLimit   = pct >= 100;
  const isGrowth  = plan === "growth";
  const isFree    = plan === "free";

  return (
    <AppLayout>
      <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6">Billing & Plans</h1>

        <div className="flex overflow-x-auto space-x-2 border-b border-border/40 mb-8 pb-px hide-scrollbar">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {activeTab === "Plan & Usage" && (
          <div className="space-y-8 animate-in fade-in duration-300">

            {/* Current plan banner */}
            {isLoading ? (
              <div className="h-16 bg-muted/20 rounded-xl animate-pulse" />
            ) : isError ? (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center gap-3 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Could not load billing data. Please refresh.
              </div>
            ) : (
              <div className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                atLimit
                  ? "bg-red-500/10 border-red-500/30"
                  : nearLimit
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-primary/10 border-primary/20"
              }`}>
                <div>
                  <p className={`font-medium ${atLimit ? "text-red-400" : nearLimit ? "text-amber-400" : "text-primary"}`}>
                    {atLimit
                      ? "⚠ Monthly quota reached — ingest is paused"
                      : nearLimit
                        ? `⚡ ${pct}% of monthly quota used — consider upgrading`
                        : `You are on the ${usage?.planLabel} plan${usage?.price !== "$0" ? ` — ${usage?.price}/month` : ""}`}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Resets {resetDate(usage!.resetAt)} · {fmt(usage!.eventsUsed)} / {fmt(usage!.quota)} events used
                  </p>
                </div>
                {(isFree || isGrowth) && (
                  <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
                    {isFree ? "Upgrade to Growth" : "Upgrade to Enterprise"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Usage meters */}
              <div className="space-y-6">
                <h3 className="font-medium text-lg">Current Usage</h3>
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1,2].map(i => <div key={i} className="h-8 bg-muted/20 rounded animate-pulse" />)}
                    </div>
                  ) : usage ? (
                    <>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Events this month</span>
                          <span className="text-muted-foreground font-mono">
                            {fmt(usage.eventsUsed)} / {fmt(usage.quota)} ({usage.pctUsed}%)
                          </span>
                        </div>
                        <UsageBar pct={usage.pctUsed} warn={nearLimit} />
                      </div>
                      <div className="pt-2 border-t border-border/50 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Remaining</span>
                          <span className="font-mono font-medium text-foreground">
                            {fmt(Math.max(0, usage.quota - usage.eventsUsed))} events
                          </span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>Quota resets</span>
                          <span className="font-medium text-foreground">{resetDate(usage.resetAt)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span>Rate limit</span>
                          <span className="font-mono font-medium text-foreground">
                            {PLAN_QUOTAS[plan]?.reqMin ?? "120"} req/min
                          </span>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Payment */}
              <div className="space-y-6">
                <h3 className="font-medium text-lg">Payment & Next Billing</h3>
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                  {isFree ? (
                    <div className="flex flex-col items-center justify-center py-4 gap-3 text-center">
                      <Zap className="w-8 h-8 text-primary" />
                      <p className="font-medium">You're on the free plan</p>
                      <p className="text-sm text-muted-foreground">No payment method required.</p>
                      <button className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                        Upgrade to Growth — $49.99/mo
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-secondary rounded text-foreground">
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="font-medium">Payment method</div>
                            <div className="text-sm text-muted-foreground">Managed via Stripe</div>
                          </div>
                        </div>
                        <button className="text-sm font-medium text-primary hover:underline">Manage</button>
                      </div>
                      <div className="pt-6 border-t border-border">
                        <div className="text-sm text-muted-foreground mb-1">Next billing date</div>
                        <div className="font-medium text-lg">
                          {resetDate(usage!.resetAt)} — {usage!.price}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Plan comparison table */}
            <div>
              <h3 className="font-medium text-lg mb-4">Plan Comparison</h3>
              <div className="overflow-x-auto bg-card border border-border rounded-xl shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 text-left font-medium text-muted-foreground w-1/4">Feature</th>
                      <th className={`px-6 py-4 text-left font-medium ${plan === "free" ? "border-l border-r border-primary/30 bg-primary/5 relative" : ""}`}>
                        {plan === "free" && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Current</div>
                        )}
                        Free
                      </th>
                      <th className={`px-6 py-4 text-left font-medium ${plan === "growth" ? "border-l border-r border-primary/30 bg-primary/5 relative" : ""}`}>
                        {plan === "growth" && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Current</div>
                        )}
                        Growth
                      </th>
                      <th className={`px-6 py-4 text-left font-medium ${plan === "enterprise" ? "border-l border-r border-primary/30 bg-primary/5 relative" : ""}`}>
                        {plan === "enterprise" && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Current</div>
                        )}
                        Enterprise
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      { label: "Events / month",   free: "30,000",    growth: "1,000,000", ent: "20,000,000" },
                      { label: "Req / min",         free: "120",       growth: "1,000",     ent: "10,000" },
                      { label: "Sites",             free: "1",         growth: "5",         ent: "Unlimited" },
                      { label: "Data retention",    free: "30 days",   growth: "90 days",   ent: "Custom" },
                      { label: "Webhooks",          free: "1",         growth: "10",        ent: "Unlimited" },
                      { label: "Alert rules",       free: "3",         growth: "25",        ent: "Unlimited" },
                      { label: "Bot fingerprinting",free: "Basic",     growth: "Advanced",  ent: "Advanced + ML" },
                      { label: "RBAC",              free: "—",         growth: "—",         ent: "✓" },
                      { label: "SSO",               free: "—",         growth: "—",         ent: "✓" },
                      { label: "SLA",               free: "None",      growth: "99.9%",     ent: "99.99%" },
                      { label: "Support",           free: "Community", growth: "Email",     ent: "Dedicated CSM" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-muted/5">
                        <td className="px-6 py-3.5 text-muted-foreground">{row.label}</td>
                        <td className={`px-6 py-3.5 ${plan === "free" ? "font-semibold border-l border-r border-primary/30 bg-primary/5" : ""}`}>{row.free}</td>
                        <td className={`px-6 py-3.5 ${plan === "growth" ? "font-semibold border-l border-r border-primary/30 bg-primary/5" : ""}`}>{row.growth}</td>
                        <td className={`px-6 py-3.5 ${plan === "enterprise" ? "font-semibold border-l border-r border-primary/30 bg-primary/5" : ""}`}>{row.ent}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/10 border-t-2 border-t-border">
                      <td className="px-6 py-4 text-muted-foreground font-medium">Price</td>
                      <td className={`px-6 py-4 font-bold ${plan === "free" ? "border-l border-r border-primary/30 bg-primary/10 text-primary" : "font-medium"}`}>Free</td>
                      <td className={`px-6 py-4 font-bold ${plan === "growth" ? "border-l border-r border-primary/30 bg-primary/10 text-primary" : "font-medium"}`}>$49.99/mo</td>
                      <td className={`px-6 py-4 font-bold ${plan === "enterprise" ? "border-l border-r border-primary/30 bg-primary/10 text-primary" : "font-medium"}`}>$499/mo</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Invoices" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-muted/10 border border-border/50 rounded-xl p-8 text-center text-muted-foreground">
              <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="font-medium">Invoice history</p>
              <p className="text-sm mt-1">Available once Stripe billing is connected.</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
