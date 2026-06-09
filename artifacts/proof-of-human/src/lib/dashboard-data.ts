// Mock data + types for the Proof of Human fraud-monitoring dashboard.
// Swap these with calls to `@/lib/api` (api.analytics.*, api.dashboard.*) when wiring live data.

export type Metric = {
  id: string;
  label: string;
  value: string;
  change: string;
  up: boolean;
  sub: string;
  color: string;
  fill: string;
};

export const metrics: Metric[] = [
  { id: "total", label: "Total Sessions", value: "1.24M", change: "+23.7%", up: true, sub: "vs May 5 – May 11", color: "#a78bfa", fill: "rgba(167,139,250,0.18)" },
  { id: "human", label: "Human Sessions", value: "892.7K", change: "+18.4%", up: true, sub: "71.9% of total", color: "#38bdf8", fill: "rgba(56,189,248,0.18)" },
  { id: "bots", label: "Bot Sessions Blocked", value: "347.3K", change: "+32.1%", up: true, sub: "28.1% of total", color: "#f87171", fill: "rgba(248,113,113,0.18)" },
  { id: "fraud", label: "Fraudulent Sessions", value: "186.7K", change: "+41.8%", up: true, sub: "15.1% of total", color: "#fbbf24", fill: "rgba(251,191,36,0.18)" },
  { id: "spend", label: "Ad Spend Saved", value: "$24,890", change: "+29.3%", up: true, sub: "vs May 5 – May 11", color: "#34d399", fill: "rgba(52,211,153,0.18)" },
];

const spark = (base: number, variance: number, n = 24) =>
  Array.from({ length: n }, (_, i) => ({
    x: i,
    y: base + Math.sin(i / 2) * variance + (Math.random() - 0.5) * variance,
  }));

export const sparklines: Record<string, { x: number; y: number }[]> = {
  total: spark(40, 14),
  human: spark(36, 10),
  bots: spark(30, 16),
  fraud: spark(26, 12),
  spend: spark(34, 8),
};

export const protectionScore = { value: 94, max: 100, label: "Excellent" };

const hours = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "24:00"];
export const trafficData = hours.map((h, i) => {
  const all = 14000 + Math.round(Math.sin(i / 1.6) * 6000 + i * 1400 + Math.random() * 1500);
  const human = Math.round(all * (0.62 + Math.random() * 0.05));
  const bots = Math.round(all * (0.18 + Math.random() * 0.04));
  const fraud = Math.round(all * (0.08 + Math.random() * 0.03));
  return { time: h, all, human, bots, fraud };
});

export const trafficLegend = [
  { key: "all", label: "All Traffic", color: "#a78bfa" },
  { key: "human", label: "Human", color: "#38bdf8" },
  { key: "bots", label: "Bots Blocked", color: "#f87171" },
  { key: "fraud", label: "Fraudulent", color: "#fbbf24" },
];

export const threatStats = { sources: 128, active: 37, topTarget: "United States", topPct: "32.6%" };

export type Insight = {
  id: number;
  icon: "Sparkles" | "Bug" | "DollarSign";
  color: string;
  title: string;
  desc: string;
  meta: string;
  metaValue: string;
  metaColor: string;
  cta: string;
};

export const aiInsights: Insight[] = [
  { id: 1, icon: "Sparkles", color: "#a78bfa", title: "Click Fraud Detected", desc: "High click fraud detected on Google Ads – Campaign: Summer Sale", meta: "Fraud Rate:", metaValue: "35.7%", metaColor: "#f87171", cta: "View Campaign" },
  { id: 2, icon: "Bug", color: "#fb7185", title: "Botnet Activity", desc: "Coordinated botnet detected from 54 IP addresses", meta: "Severity:", metaValue: "High", metaColor: "#fb7185", cta: "View Activity" },
  { id: 3, icon: "DollarSign", color: "#34d399", title: "Ad Spend Saved", desc: "You've saved $4,230 in ad spend from blocked fraudulent traffic", meta: "", metaValue: "This Week", metaColor: "#94a3b8", cta: "" },
];

export const campaigns = [
  { name: "Summer Sale", platform: "Google Ads", rate: 35.7, bots: "12.4K", saved: "$4,230" },
  { name: "Brand Awareness", platform: "Meta", rate: 28.3, bots: "8.7K", saved: "$3,120" },
  { name: "Promo April", platform: "TikTok", rate: 22.1, bots: "6.3K", saved: "$2,450" },
  { name: "Retargeting", platform: "Google", rate: 18.9, bots: "4.2K", saved: "$1,870" },
  { name: "Lookalike Audience", platform: "Meta", rate: 12.4, bots: "2.1K", saved: "$980" },
];

export const fraudDistribution = [
  { name: "High Risk (80-100)", value: 28.1, color: "#f87171" },
  { name: "Medium Risk (50-80)", value: 32.6, color: "#fbbf24" },
  { name: "Low Risk (20-50)", value: 25.4, color: "#38bdf8" },
  { name: "Trusted (0-20)", value: 13.9, color: "#34d399" },
];

export const riskOverTime = ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18", "May 19"].map((d, i) => ({
  date: d,
  score: Math.round(45 + Math.sin(i / 1.1) * 22 + (Math.random() - 0.5) * 8),
}));

export const recentAlerts = {
  total: "186.7K",
  items: [
    { name: "Click Fraud", value: 34.7, color: "#f87171" },
    { name: "Bot Traffic", value: 28.9, color: "#fbbf24" },
    { name: "Proxy & VPN", value: 18.6, color: "#38bdf8" },
    { name: "Fake Impressions", value: 10.3, color: "#a78bfa" },
    { name: "Other", value: 7.5, color: "#64748b" },
  ],
};

const locations = [
  { city: "New York, US", source: "Google Ads", device: "Chrome 124 / Win" },
  { city: "London, GB", source: "Direct", device: "Safari 17 / Mac" },
  { city: "Moscow, RU", source: "Facebook Ads", device: "Chrome 124 / Win" },
  { city: "Sydney, AU", source: "Google Ads", device: "Chrome 124 / Mac" },
  { city: "Singapore, SG", source: "TikTok Ads", device: "Chrome 124 / Win" },
  { city: "Toronto, CA", source: "Direct", device: "Edge 124 / Win" },
  { city: "Berlin, DE", source: "Meta Ads", device: "Firefox 126 / Linux" },
  { city: "Mumbai, IN", source: "Google Ads", device: "Chrome 124 / Android" },
  { city: "São Paulo, BR", source: "TikTok Ads", device: "Safari 17 / iOS" },
  { city: "Tokyo, JP", source: "Direct", device: "Chrome 124 / Mac" },
];
const threatTypes = ["Click Fraud", "Bot Traffic", "Proxy / VPN", "None", "Fake Impression"];

export type Session = {
  id: string;
  city: string;
  source: string;
  device: string;
  score: number;
  verdict: string;
  verdictColor: string;
  threat: string;
  time: string;
};

function verdictFor(score: number) {
  if (score >= 80) return { verdict: "Blocked", color: "#f87171" };
  if (score >= 60) return { verdict: "Challenge", color: "#fbbf24" };
  return { verdict: "Allowed", color: "#34d399" };
}

export function genSessions(count = 8): Session[] {
  const out: Session[] = [];
  for (let i = 0; i < count; i++) {
    const loc = locations[Math.floor(Math.random() * locations.length)];
    const score = Math.floor(Math.random() * 100);
    const v = verdictFor(score);
    const threat = score < 30 ? "None" : threatTypes[Math.floor(Math.random() * (threatTypes.length - 1))];
    out.push({
      id: "sess_" + Math.random().toString(16).slice(2, 12),
      ...loc,
      score,
      verdict: v.verdict,
      verdictColor: v.color,
      threat,
      time: `${i + 1}s ago`,
    });
  }
  return out;
}

export const quickActions = [
  { label: "Block IP Range", icon: "ShieldBan", color: "#f87171" },
  { label: "Create Challenge", icon: "ShieldQuestion", color: "#fbbf24" },
  { label: "Whitelist IP", icon: "ShieldCheck", color: "#34d399" },
  { label: "View Reports", icon: "FileBarChart", color: "#38bdf8" },
  { label: "Add Integration", icon: "Plug", color: "#a78bfa" },
  { label: "Custom Rule", icon: "SlidersHorizontal", color: "#22d3ee" },
] as const;
