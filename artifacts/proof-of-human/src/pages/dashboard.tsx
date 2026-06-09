import { useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { ChevronDown, Calendar, RefreshCw, Bell, ShieldHalf } from "lucide-react";
import MetricCards from "@/components/dashboard/metric-cards";
import TrafficOverview from "@/components/dashboard/traffic-overview";
import ThreatMap from "@/components/dashboard/threat-map";
import AIInsights from "@/components/dashboard/ai-insights";
import { CampaignTable, FraudDistribution, RiskOverTime, RecentAlerts } from "@/components/dashboard/bottom-charts";
import { SessionStream, QuickActions } from "@/components/dashboard/session-stream";

/* All animations + the monospace number style are scoped here so this page is
   a fully self-contained drop-in — no changes to your global index.css required. */
const styles = `
.poh-mono { font-family: ui-monospace, "JetBrains Mono", "SFMono-Regular", Menlo, monospace; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
@keyframes poh-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.85)} }
.poh-pulse { animation: poh-pulse 1.6s ease-in-out infinite; }
@keyframes poh-ping { 0%{transform:scale(.6);opacity:.8} 80%,100%{transform:scale(2.2);opacity:0} }
.poh-ping { animation: poh-ping 2s cubic-bezier(0,0,0.2,1) infinite; }
@keyframes poh-dashflow { to { stroke-dashoffset: -16; } }
.poh-dash { animation: poh-dashflow 1s linear infinite; }
@keyframes poh-fadeup { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.poh-fade-up { animation: poh-fadeup .4s ease-out both; }
@keyframes poh-mapping { 0%{transform:scale(1);opacity:.9} 80%,100%{transform:scale(3.4);opacity:0} }
.poh-map-ping { animation: poh-mapping 2.4s cubic-bezier(0,0,0.2,1) infinite; transform-box: fill-box; transform-origin: center; }
.poh-card-hover { transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
.poh-card-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 40px -12px rgba(0,0,0,.6); }
`;

function DashboardHeader() {
  const [spin, setSpin] = useState(false);
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 ring-1 ring-emerald-500/30">
          <ShieldHalf className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-[18px] font-bold leading-tight text-white">Overview</h1>
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="poh-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Real-time Protection ACTIVE
          </div>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2.5">
        <button className="hidden items-center gap-2 rounded-lg border border-[#1b2233] bg-[#0d1220] px-3.5 py-2 text-[13px] font-medium text-slate-200 transition-colors hover:border-[#2a3346] sm:flex">
          All Websites <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>
        <button className="hidden items-center gap-2 rounded-lg border border-[#1b2233] bg-[#0d1220] px-3.5 py-2 text-[13px] font-medium text-slate-200 transition-colors hover:border-[#2a3346] sm:flex">
          <Calendar className="h-4 w-4 text-slate-500" /> May 12 – May 19, 2025
        </button>
        <button
          onClick={() => { setSpin(true); setTimeout(() => setSpin(false), 700); }}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1b2233] bg-[#0d1220] text-slate-400 transition-colors hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 ${spin ? "animate-spin" : ""}`} />
        </button>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#1b2233] bg-[#0d1220] text-slate-400 transition-colors hover:text-white">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-[#04130c]">12</span>
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AppLayout>
      <style>{styles}</style>
      <div className="min-h-full bg-[#070a12] text-slate-200">
        <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 md:p-6">
          <DashboardHeader />
          <MetricCards />

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="xl:col-span-5"><TrafficOverview /></div>
            <div className="xl:col-span-4"><ThreatMap /></div>
            <div className="xl:col-span-3"><AIInsights /></div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <CampaignTable />
            <FraudDistribution />
            <RiskOverTime />
            <RecentAlerts />
          </div>

          <SessionStream />
          <QuickActions />
        </div>
      </div>
    </AppLayout>
  );
}
