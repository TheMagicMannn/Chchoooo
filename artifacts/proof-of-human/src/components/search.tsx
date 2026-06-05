import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Command } from "cmdk";
import { Search as SearchIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const SEARCH_DATA = [
  { id: "exec-summary", title: "Executive Summary", content: "Proof of Human is an advanced telemetry platform...", path: "/docs" },
  { id: "tech-stack", title: "Technical Stack", content: "TypeScript, Cloudflare Workers, Kafka/Redpanda...", path: "/docs" },
  { id: "sdk", title: "SDK Implementation", content: "The browser SDK batches telemetry data...", path: "/docs" },
  { id: "edge", title: "Edge Ingress Service", content: "Cloudflare Worker handling ingress...", path: "/docs" },
  { id: "inference", title: "Go ONNX Inference Engine", content: "Loads the ONNX model and serves HTTP inferences...", path: "/docs" },
  { id: "schema", title: "ClickHouse Schema", content: "Optimized schemas for massive write throughput...", path: "/docs" },
  { id: "deploy", title: "Deployment Instructions", content: "Production deployment on Ubuntu 22.04 LTS...", path: "/docs" },
  { id: "dashboard", title: "Admin Dashboard", content: "Real-time metrics panel", path: "/dashboard" },
  { id: "architecture", title: "Architecture Diagram", content: "Visual flow diagram showing the full pipeline", path: "/architecture" },
  { id: "ops", title: "Operations Console", content: "Live ops console with health monitoring, log stream, metrics, and topology", path: "/ops" },
  { id: "flow-verify", title: "Flow Verification", content: "End-to-end pipeline verification using curl commands", path: "/playbooks" },
  { id: "inference-debug", title: "Go Inference Troubleshooting", content: "Debug inference service issues with journalctl and curl", path: "/playbooks" },
  { id: "model-retrain", title: "Model Retraining", content: "Export training data from ClickHouse and hot-swap ONNX model", path: "/playbooks" },
  { id: "incident-response", title: "Incident Response", content: "P1/P2/P3 alert runbooks for common production incidents", path: "/playbooks" },
  { id: "onboarding", title: "Get Started — Connect Your Site", content: "API token generator, GTM tag snippet, WordPress plugin installation wizard", path: "/onboarding" },
  { id: "connect", title: "Live Dashboard", content: "Session scores, traffic quality, bot detection rate, hosted infrastructure status", path: "/connect" },
  { id: "risk", title: "Risk & Detection", content: "Adaptive risk scoring, bot fingerprint clustering, anomaly detection, session replay", path: "/risk" },
  { id: "alerts", title: "Fraud Alerts", content: "Active fraud alerts, CAPTCHA escalation rules, alert history", path: "/alerts" },
  { id: "integrations", title: "Integrations", content: "GA4, Shopify, Webhooks, API key management", path: "/integrations" },
  { id: "settings", title: "Settings & Governance", content: "Team RBAC, privacy controls, consent management, audit logs", path: "/settings" },
  { id: "billing", title: "Billing & Plans", content: "Plan comparison, usage meters, invoice history, subscription management", path: "/billing" },
  { id: "enterprise", title: "Enterprise Operations", content: "SLA monitoring, AI model versioning, false positive review, customer success analytics", path: "/enterprise" },
  { id: 'logs', title: 'Log Explorer', content: 'Full event log with filters, pagination, session drill-down, export CSV', path: '/logs' },
  { id: 'reports', title: 'Reports', content: 'Saved reports, CSV export, report builder, scheduled reports', path: '/reports' },
  { id: 'profile', title: 'Account & Profile', content: 'User profile, notifications, API usage, security, sign out', path: '/profile' },
  { id: 'login', title: 'Sign In', content: 'Login to your Proof of Human account, demo access', path: '/login' },
];

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/50 hover:bg-secondary border border-border rounded-md transition-colors w-full max-w-sm"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="flex-1 text-left">Search blueprint...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-2xl bg-card border-border shadow-2xl">
          <DialogTitle className="sr-only">Search Documentation</DialogTitle>
          <Command
            className="flex h-full w-full flex-col overflow-hidden bg-transparent"
            loop
          >
            <div className="flex items-center border-b border-border px-3" cmdk-input-wrapper="">
              <SearchIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                placeholder="Search across all sections..."
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>
              <Command.Group heading="Documentation Sections" className="px-2 py-1.5">
                {SEARCH_DATA.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={`${item.title} ${item.content}`}
                    onSelect={() => {
                      setLocation(`${item.path}${item.path === "/docs" || item.path === "/playbooks" ? `#${item.id}` : ""}`);
                      setOpen(false);
                      if (item.path === "/docs" || item.path === "/playbooks") {
                        setTimeout(() => {
                          document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }
                    }}
                    className="flex flex-col gap-1 rounded-md px-3 py-2 text-sm aria-selected:bg-secondary aria-selected:text-secondary-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer"
                  >
                    <span className="font-medium text-foreground">{item.title}</span>
                    <span className="text-xs text-muted-foreground truncate">{item.content}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
