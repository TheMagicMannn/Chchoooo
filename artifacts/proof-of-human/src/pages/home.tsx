import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { ArrowRight, CheckCircle, BarChart2, ShieldCheck, Server, Zap, Lock, Activity } from "lucide-react";
import { SiWordpress, SiWoocommerce, SiShopify, SiSquarespace } from "react-icons/si";

export default function Home() {
  return (
    <Layout>
      <div className="w-full flex flex-col items-center">
        {/* HERO SECTION */}
        <section className="w-full max-w-5xl mx-auto px-4 pt-24 pb-16 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8 animate-in fade-in slide-in-from-bottom-4">
            <Zap className="mr-2 h-4 w-4" />
            Hosted · No Infrastructure · 2-Minute Setup
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6">
            Know exactly which of your visitors are <span className="text-primary">real humans.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8">
            Proof of Human scores every session in real time — without you running a single server. Paste one tag, get instant bot detection.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in fade-in slide-in-from-bottom-10">
            <Link href="/onboarding" className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              Start Free — Connect Your Site <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/connect" className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              See Live Demo
            </Link>
          </div>

          <div className="mt-8 text-sm text-muted-foreground font-medium animate-in fade-in slide-in-from-bottom-12">
            Works with Google Tag Manager · WordPress · GA4 · WooCommerce · Any website
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="w-full bg-secondary/30 py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Paste your tag</h3>
                <p className="text-muted-foreground">Add one script to GTM or WordPress. No developer needed.</p>
              </div>
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">We handle everything</h3>
                <p className="text-muted-foreground">Our edge network captures, scores, and stores session data. You run nothing.</p>
              </div>
              <div className="flex flex-col">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">See real humans</h3>
                <p className="text-muted-foreground">Your dashboard shows live traffic quality, bot rates, and session scores.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE GRID */}
        <section className="w-full max-w-6xl mx-auto px-4 py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            <div className="flex gap-4">
              <div className="mt-1"><Zap className="h-6 w-6 text-primary" /></div>
              <div>
                <h3 className="text-lg font-bold mb-2">Edge Detection</h3>
                <p className="text-muted-foreground">Scored at 50ms at Cloudflare's global edge</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><Server className="h-6 w-6 text-primary" /></div>
              <div>
                <h3 className="text-lg font-bold mb-2">Zero Infrastructure</h3>
                <p className="text-muted-foreground">Kafka, ClickHouse, and inference run on our servers</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><BarChart2 className="h-6 w-6 text-primary" /></div>
              <div>
                <h3 className="text-lg font-bold mb-2">GA4 Ready</h3>
                <p className="text-muted-foreground">Enrich Google Analytics with human/bot labels automatically</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><ShieldCheck className="h-6 w-6 text-primary" /></div>
              <div>
                <h3 className="text-lg font-bold mb-2">WooCommerce Guard</h3>
                <p className="text-muted-foreground">Block bot checkouts before they waste your ad spend</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><Activity className="h-6 w-6 text-primary" /></div>
              <div>
                <h3 className="text-lg font-bold mb-2">Real-time Dashboard</h3>
                <p className="text-muted-foreground">Live session scores, traffic quality, geographic breakdown</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1"><Lock className="h-6 w-6 text-primary" /></div>
              <div>
                <h3 className="text-lg font-bold mb-2">SOC 2 Compliant</h3>
                <p className="text-muted-foreground">Data stays encrypted, regional, and auditable</p>
              </div>
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF BAR */}
        <section className="w-full max-w-6xl mx-auto px-4 pb-12">
          <div className="bg-card border border-border rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1">2,400+</div>
              <div className="text-sm font-medium text-muted-foreground">Websites Protected</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1">847M</div>
              <div className="text-sm font-medium text-muted-foreground">Sessions Scored</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1">99.98%</div>
              <div className="text-sm font-medium text-muted-foreground">Uptime</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-foreground mb-1">&lt;5ms</div>
              <div className="text-sm font-medium text-muted-foreground">Inference Latency</div>
            </div>
          </div>
        </section>

        {/* INTEGRATIONS ROW */}
        <section className="w-full max-w-5xl mx-auto px-4 py-12 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">Works seamlessly with</p>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border">
              <span className="font-semibold text-sm">GTM</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border">
              <SiWordpress className="w-4 h-4 text-[#21759b]" />
              <span className="font-semibold text-sm">WordPress</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border">
              <SiWoocommerce className="w-4 h-4 text-[#96588a]" />
              <span className="font-semibold text-sm">WooCommerce</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border">
              <span className="font-semibold text-sm">GA4</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border">
              <SiShopify className="w-4 h-4 text-[#95bf47]" />
              <span className="font-semibold text-sm">Shopify</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-full border border-border">
              <SiSquarespace className="w-4 h-4 text-white" />
              <span className="font-semibold text-sm">Squarespace</span>
            </div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="w-full max-w-4xl mx-auto px-4 py-24">
          <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-2xl flex flex-col items-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to block the bots?</h2>
            <Link href="/onboarding" className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-10 text-lg font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 mb-4">
              Start Free — No credit card required
            </Link>
            <p className="text-muted-foreground text-sm">Free up to 50,000 sessions/month</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
