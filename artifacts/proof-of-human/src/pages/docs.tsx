import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { CodeBlock } from "@/components/code-block";
import { 
  TS_SDK_CODE, 
  WORKER_CODE, 
  GO_INFERENCE_CODE, 
  SQL_SCHEMA_CODE, 
  UBUNTU_DEPLOY_CODE, 
  DOCKER_COMPOSE_CODE 
} from "@/lib/content";

export default function Docs() {
  const sections = [
    { id: "exec-summary", title: "Executive Summary" },
    { id: "tech-stack", title: "Technical Stack" },
    { id: "sdk", title: "SDK Implementation" },
    { id: "edge", title: "Edge Ingress Service" },
    { id: "inference", title: "Go Inference Engine" },
    { id: "schema", title: "ClickHouse Schema" },
    { id: "deploy", title: "Deployment" },
  ];

  const [activeSection, setActiveSection] = useState("exec-summary");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <Layout>
      <div className="flex w-full max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-64 hidden md:block shrink-0 border-r border-border/40 py-8 pr-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <nav className="flex flex-col space-y-1">
            <h4 className="font-semibold text-sm mb-4 px-2 text-foreground">Contents</h4>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollTo(section.id)}
                className={`text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                  activeSection === section.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-8 py-10 pb-32 max-w-4xl prose prose-slate dark:prose-invert">
          <section id="exec-summary" className="mb-16 scroll-mt-24">
            <h1 className="text-4xl font-extrabold tracking-tight">Executive Summary</h1>
            <p className="text-lg text-muted-foreground mt-4">
              Proof of Human is an advanced telemetry and AI inference platform designed to score user sessions as human or bot in real time. It utilizes lightweight browser signals—such as scroll velocity, mouse movement curves, and keystroke dynamics—and streams them through a highly scalable ingress pipeline to an ONNX-powered machine learning inference engine.
            </p>
          </section>

          <section id="tech-stack" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">Technical Stack</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-md">Component</th>
                    <th className="px-4 py-3">Technology</th>
                    <th className="px-4 py-3 rounded-tr-md">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/40">
                    <td className="px-4 py-3 font-semibold">SDK</td>
                    <td className="px-4 py-3 font-mono">TypeScript</td>
                    <td className="px-4 py-3 text-muted-foreground">Captures and batches browser/device events.</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-4 py-3 font-semibold">Edge</td>
                    <td className="px-4 py-3 font-mono">Cloudflare Workers</td>
                    <td className="px-4 py-3 text-muted-foreground">Validates requests and publishes to queue.</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-4 py-3 font-semibold">Queue</td>
                    <td className="px-4 py-3 font-mono">Kafka/Redpanda</td>
                    <td className="px-4 py-3 text-muted-foreground">Highly available event streaming.</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-4 py-3 font-semibold">Inference</td>
                    <td className="px-4 py-3 font-mono">Go + ONNX</td>
                    <td className="px-4 py-3 text-muted-foreground">High-performance model execution.</td>
                  </tr>
                  <tr className="border-b border-border/40">
                    <td className="px-4 py-3 font-semibold">Storage</td>
                    <td className="px-4 py-3 font-mono">ClickHouse</td>
                    <td className="px-4 py-3 text-muted-foreground">Fast analytical database for telemetry storage.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="sdk" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">SDK Implementation</h2>
            <p className="mb-4">The browser SDK batches telemetry data to minimize network overhead.</p>
            <CodeBlock language="typescript" code={TS_SDK_CODE} />
          </section>

          <section id="edge" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">Edge Ingress Service</h2>
            <p className="mb-4">Cloudflare Worker handling ingress and Kafka publishing.</p>
            <CodeBlock language="typescript" code={WORKER_CODE} />
          </section>

          <section id="inference" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">Go ONNX Inference Engine</h2>
            <p className="mb-4">Loads the ONNX model and serves HTTP inferences with zero-allocation buffers.</p>
            <CodeBlock language="go" code={GO_INFERENCE_CODE} />
          </section>

          <section id="schema" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">ClickHouse Schema</h2>
            <p className="mb-4">Optimized schemas for massive write throughput and analytical queries.</p>
            <CodeBlock language="sql" code={SQL_SCHEMA_CODE} />
          </section>

          <section id="deploy" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">Deployment Instructions</h2>
            <p className="mb-4">Production deployment on Ubuntu 22.04 LTS.</p>
            <CodeBlock language="bash" code={UBUNTU_DEPLOY_CODE} />
            <h3 className="text-xl font-bold mt-8 mb-4">Docker Compose</h3>
            <CodeBlock language="yaml" code={DOCKER_COMPOSE_CODE} />
          </section>
        </div>
      </div>
    </Layout>
  );
}
