import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { CheckCircle2, Download, CreditCard, ArrowRight } from "lucide-react";

export default function Billing() {
  const [activeTab, setActiveTab] = useState("Plan & Usage");
  const tabs = ["Plan & Usage", "Invoices"];

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
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-primary">You are on the Growth plan — $49/month</p>
                <p className="text-sm text-primary/80 mt-1">Includes 500,000 sessions/month and advanced analytics.</p>
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap">
                Upgrade to Enterprise
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="font-medium text-lg">Current Usage</h3>
                
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Sessions this month</span>
                      <span className="text-muted-foreground font-mono">287,432 / 500,000 (57%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '57%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Sites connected</span>
                      <span className="text-muted-foreground font-mono">2 / 5 (40%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '40%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">API calls</span>
                      <span className="text-muted-foreground font-mono">48,291 / 100,000 (48%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '48%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="font-medium text-lg">Payment & Next Billing</h3>
                
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary rounded text-foreground">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-medium">Visa ending in 4242</div>
                        <div className="text-sm text-muted-foreground">Expires 12/2026</div>
                      </div>
                    </div>
                    <button className="text-sm font-medium text-primary hover:underline">Update</button>
                  </div>

                  <div className="pt-6 border-t border-border">
                    <div className="text-sm text-muted-foreground mb-1">Next billing date</div>
                    <div className="font-medium text-lg">February 1, 2024 — $49.00</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-lg mb-4">Plan Comparison</h3>
              <div className="overflow-x-auto bg-card border border-border rounded-xl shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 text-left font-medium text-muted-foreground w-1/4">Features</th>
                      <th className="px-6 py-4 text-left font-medium">Free</th>
                      <th className="px-6 py-4 text-left font-medium border-l border-r border-primary/30 bg-primary/5 relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">Current Plan</div>
                        Growth
                      </th>
                      <th className="px-6 py-4 text-left font-medium">Enterprise</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr className="hover:bg-muted/5">
                      <td className="px-6 py-4 text-muted-foreground">Sessions/month</td>
                      <td className="px-6 py-4">50,000</td>
                      <td className="px-6 py-4 font-semibold border-l border-r border-primary/30 bg-primary/5">500,000</td>
                      <td className="px-6 py-4">Unlimited</td>
                    </tr>
                    <tr className="hover:bg-muted/5">
                      <td className="px-6 py-4 text-muted-foreground">Sites</td>
                      <td className="px-6 py-4">1</td>
                      <td className="px-6 py-4 font-semibold border-l border-r border-primary/30 bg-primary/5">5</td>
                      <td className="px-6 py-4">Unlimited</td>
                    </tr>
                    <tr className="hover:bg-muted/5">
                      <td className="px-6 py-4 text-muted-foreground">Data retention</td>
                      <td className="px-6 py-4">30 days</td>
                      <td className="px-6 py-4 font-semibold border-l border-r border-primary/30 bg-primary/5">90 days</td>
                      <td className="px-6 py-4">Custom</td>
                    </tr>
                    <tr className="hover:bg-muted/5">
                      <td className="px-6 py-4 text-muted-foreground">Bot fingerprinting</td>
                      <td className="px-6 py-4 text-muted-foreground">No</td>
                      <td className="px-6 py-4 font-semibold border-l border-r border-primary/30 bg-primary/5">Basic</td>
                      <td className="px-6 py-4 text-purple-400">Advanced</td>
                    </tr>
                    <tr className="hover:bg-muted/5">
                      <td className="px-6 py-4 text-muted-foreground">RBAC</td>
                      <td className="px-6 py-4 text-muted-foreground">No</td>
                      <td className="px-6 py-4 font-semibold border-l border-r border-primary/30 bg-primary/5 text-muted-foreground">No</td>
                      <td className="px-6 py-4"><CheckCircle2 className="w-4 h-4 text-green-500" /></td>
                    </tr>
                    <tr className="hover:bg-muted/5">
                      <td className="px-6 py-4 text-muted-foreground">SSO</td>
                      <td className="px-6 py-4 text-muted-foreground">No</td>
                      <td className="px-6 py-4 font-semibold border-l border-r border-primary/30 bg-primary/5 text-muted-foreground">No</td>
                      <td className="px-6 py-4"><CheckCircle2 className="w-4 h-4 text-green-500" /></td>
                    </tr>
                    <tr className="hover:bg-muted/5">
                      <td className="px-6 py-4 text-muted-foreground">SLA</td>
                      <td className="px-6 py-4 text-muted-foreground">None</td>
                      <td className="px-6 py-4 font-semibold border-l border-r border-primary/30 bg-primary/5">99.9%</td>
                      <td className="px-6 py-4">99.99%</td>
                    </tr>
                    <tr className="hover:bg-muted/5">
                      <td className="px-6 py-4 text-muted-foreground">Support</td>
                      <td className="px-6 py-4 text-muted-foreground">Community</td>
                      <td className="px-6 py-4 font-semibold border-l border-r border-primary/30 bg-primary/5">Email</td>
                      <td className="px-6 py-4">Dedicated CSM</td>
                    </tr>
                    <tr className="bg-muted/10 border-t-2 border-t-border">
                      <td className="px-6 py-4 text-muted-foreground font-medium">Price</td>
                      <td className="px-6 py-4 font-medium">Free</td>
                      <td className="px-6 py-4 font-bold border-l border-r border-primary/30 bg-primary/10 text-primary">$49/mo</td>
                      <td className="px-6 py-4 font-medium">Custom</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Invoices" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 text-muted-foreground border-b border-border/50">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">Date</th>
                      <th className="px-6 py-3 text-left font-medium">Amount</th>
                      <th className="px-6 py-3 text-left font-medium">Status</th>
                      <th className="px-6 py-3 text-left font-medium">Description</th>
                      <th className="px-6 py-3 text-right font-medium">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {[
                      { date: "Jan 1, 2024", amt: "$49.00", status: "Paid", desc: "Growth Plan — January" },
                      { date: "Dec 1, 2023", amt: "$49.00", status: "Paid", desc: "Growth Plan — December" },
                      { date: "Nov 1, 2023", amt: "$49.00", status: "Paid", desc: "Growth Plan — November" },
                      { date: "Oct 1, 2023", amt: "$49.00", status: "Paid", desc: "Growth Plan — October" },
                      { date: "Sep 1, 2023", amt: "$29.00", status: "Paid", desc: "Starter Plan — September" },
                      { date: "Aug 1, 2023", amt: "$0.00", status: "Free", desc: "Free Plan" },
                    ].map((inv, i) => (
                      <tr key={i} className="hover:bg-muted/5 transition-colors">
                        <td className="px-6 py-4 font-medium">{inv.date}</td>
                        <td className="px-6 py-4 font-mono">{inv.amt}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${inv.status === 'Paid' ? 'bg-green-500/20 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{inv.desc}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors">
                            PDF <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
