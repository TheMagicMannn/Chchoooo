import { useLocation } from "wouter";
import { Layout } from "@/components/layout";

export default function Architecture() {
  const [, setLocation] = useLocation();

  const navToDoc = (id: string) => {
    setLocation(`/docs#${id}`);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <Layout>
      <div className="w-full max-w-6xl mx-auto px-4 py-12 flex flex-col">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">System Architecture</h1>
          <p className="text-muted-foreground mt-2">The complete request lifecycle for the Proof of Human telemetry pipeline. Click on any component to view its implementation.</p>
        </div>

        <div className="relative w-full flex-1 min-h-[500px] bg-card border border-border rounded-xl flex items-center justify-center p-8 overflow-hidden shadow-sm">
          {/* Background grid for tech aesthetic */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <svg width="100%" height="100%" viewBox="0 0 1000 500" className="relative z-10 font-sans" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-muted-foreground" />
              </marker>
              <marker id="arrowhead-primary" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-primary" />
              </marker>
            </defs>

            {/* Path lines */}
            <path d="M 150 250 L 280 250" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <path d="M 420 250 L 530 250" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <path d="M 670 250 L 780 250" stroke="currentColor" className="text-primary" strokeWidth="2" markerEnd="url(#arrowhead-primary)" strokeDasharray="5,5" />
            <path d="M 850 290 L 850 380" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" markerEnd="url(#arrowhead)" />
            <path d="M 780 420 L 670 420" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" markerEnd="url(#arrowhead)" />

            {/* Nodes */}
            <g transform="translate(10, 210)" onClick={() => navToDoc('sdk')} className="cursor-pointer group">
              <rect width="140" height="80" rx="8" className="fill-card stroke-border stroke-2 group-hover:stroke-primary transition-colors" />
              <text x="70" y="35" textAnchor="middle" className="fill-foreground font-semibold text-sm group-hover:fill-primary transition-colors">Browser SDK</text>
              <text x="70" y="55" textAnchor="middle" className="fill-muted-foreground text-xs">TypeScript</text>
            </g>

            <g transform="translate(280, 210)" onClick={() => navToDoc('edge')} className="cursor-pointer group">
              <rect width="140" height="80" rx="8" className="fill-orange-950/30 stroke-orange-500/50 stroke-2 group-hover:stroke-orange-400 transition-colors" />
              <text x="70" y="35" textAnchor="middle" className="fill-orange-100 font-semibold text-sm group-hover:fill-orange-400 transition-colors">Edge Worker</text>
              <text x="70" y="55" textAnchor="middle" className="fill-orange-200/60 text-xs">Cloudflare</text>
            </g>

            <g transform="translate(530, 210)" onClick={() => navToDoc('tech-stack')} className="cursor-pointer group">
              <rect width="140" height="80" rx="8" className="fill-yellow-950/30 stroke-yellow-500/50 stroke-2 group-hover:stroke-yellow-400 transition-colors" />
              <text x="70" y="35" textAnchor="middle" className="fill-yellow-100 font-semibold text-sm group-hover:fill-yellow-400 transition-colors">Event Queue</text>
              <text x="70" y="55" textAnchor="middle" className="fill-yellow-200/60 text-xs">Kafka/Redpanda</text>
            </g>

            <g transform="translate(780, 210)" onClick={() => navToDoc('inference')} className="cursor-pointer group">
              <rect width="140" height="80" rx="8" className="fill-cyan-950/30 stroke-cyan-500/50 stroke-2 group-hover:stroke-cyan-400 transition-colors" />
              <text x="70" y="35" textAnchor="middle" className="fill-cyan-100 font-semibold text-sm group-hover:fill-cyan-400 transition-colors">Inference Engine</text>
              <text x="70" y="55" textAnchor="middle" className="fill-cyan-200/60 text-xs">Go + ONNX</text>
            </g>

            <g transform="translate(780, 380)" onClick={() => navToDoc('schema')} className="cursor-pointer group">
              <rect width="140" height="80" rx="8" className="fill-purple-950/30 stroke-purple-500/50 stroke-2 group-hover:stroke-purple-400 transition-colors" />
              <text x="70" y="35" textAnchor="middle" className="fill-purple-100 font-semibold text-sm group-hover:fill-purple-400 transition-colors">Storage</text>
              <text x="70" y="55" textAnchor="middle" className="fill-purple-200/60 text-xs">ClickHouse</text>
            </g>

            <g transform="translate(530, 380)" onClick={() => setLocation('/dashboard')} className="cursor-pointer group">
              <rect width="140" height="80" rx="8" className="fill-primary/20 stroke-primary/50 stroke-2 group-hover:stroke-primary transition-colors" />
              <text x="70" y="35" textAnchor="middle" className="fill-primary font-semibold text-sm group-hover:fill-primary-foreground transition-colors">Dashboard</text>
              <text x="70" y="55" textAnchor="middle" className="fill-primary/70 text-xs">React App</text>
            </g>

            {/* Labels */}
            <text x="215" y="240" textAnchor="middle" className="fill-muted-foreground text-[10px]">HTTPS POST</text>
            <text x="475" y="240" textAnchor="middle" className="fill-muted-foreground text-[10px]">Produce</text>
            <text x="725" y="240" textAnchor="middle" className="fill-primary text-[10px] font-semibold">Consume</text>
            <text x="860" y="340" textAnchor="start" className="fill-muted-foreground text-[10px]">Batch Insert</text>
            <text x="725" y="410" textAnchor="middle" className="fill-muted-foreground text-[10px]">Query Stats</text>

          </svg>
        </div>
      </div>
    </Layout>
  );
}
