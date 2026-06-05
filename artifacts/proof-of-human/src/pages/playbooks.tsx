import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { CodeBlock } from "@/components/code-block";
import { ChevronDown, ChevronUp, AlertOctagon, AlertTriangle, Info } from "lucide-react";

export default function Playbooks() {
  const sections = [
    { id: "flow-verify", title: "Flow Verification" },
    { id: "inference-debug", title: "Go Inference Troubleshooting" },
    { id: "resource-monitor", title: "Resource Monitoring" },
    { id: "journal-monitor", title: "Journal Monitoring" },
    { id: "model-retrain", title: "Model Retraining" },
    { id: "clickhouse-maintenance", title: "ClickHouse Maintenance" },
    { id: "incident-response", title: "Incident Response" },
  ];

  const [activeSection, setActiveSection] = useState("flow-verify");

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

  const FlowVerificationCode = `# Step 1: Send a test event batch to the edge worker
curl -X POST https://edge.proofofhuman.io/infer \\
  -H "Content-Type: application/json" \\
  -H "X-PoH-Signature: $(echo -n '{"events":[]}' | openssl dgst -sha256 -hmac $HMAC_SECRET -binary | base64)" \\
  -d '{"events":[{"sessionId":"test-curl-001","eventType":"mousemove","timestamp":1700000000000,"x":400,"y":300,"velocity":0.8}]}'

# Expected: {"accepted":1}

# Step 2: Verify event reached Kafka
rpk topic consume telemetry-events --num 1 --brokers localhost:9092

# Step 3: Confirm inference ran
curl -s http://localhost:8080/metrics | grep poh_events_ingested_total

# Step 4: Check ClickHouse write
curl -s 'http://localhost:8123/?query=SELECT+count()+FROM+poh.telemetry_events+WHERE+session_id%3D%27test-curl-001%27'
# Expected: 1`;

  const InferenceDebugCode = `# Check service status
sudo systemctl status poh-inference

# View recent logs
sudo journalctl -u poh-inference -n 100 --no-pager

# Check if ONNX model file is present and readable
ls -lh /opt/poh/model.onnx
file /opt/poh/model.onnx

# Verify libonnxruntime is linked correctly
ldd /opt/poh/inference-service | grep onnx

# Test inference endpoint directly
curl -s -X POST http://localhost:8080/infer \\
  -H "Content-Type: application/json" \\
  -d '{"session_id":"debug-001","features":['$(python3 -c "print(','.join(['0.5']*128))")']}' | jq .

# Check for OOM kills
dmesg | grep -i 'oom\\|killed' | tail -20

# Inspect open file descriptors (should be < 1024 under normal load)
ls /proc/$(pgrep inference-service)/fd | wc -l`;

  const ResourceMonitorCode = `# Real-time CPU and memory by process
htop -p $(pgrep -d',' -f 'inference-service|clickhouse|redpanda')

# Check memory pressure
cat /proc/meminfo | grep -E 'MemTotal|MemAvailable|SwapUsed'

# Disk I/O stats for ClickHouse data dir
iostat -x 1 5 /dev/sda

# Network throughput (useful for Kafka and edge traffic)
iftop -i eth0 -n

# ClickHouse system resource view
curl -s 'http://localhost:8123/?query=SELECT+metric,value+FROM+system.metrics+WHERE+metric+IN+('"'"'BackgroundPoolTask'"'"','"'"'Query'"'"','"'"'OpenFileForRead'"'"')' \\
  --user default:

# Check ClickHouse merge queue depth (high = disk pressure)
curl -s 'http://localhost:8123/?query=SELECT+table,count()+AS+merges+FROM+system.merges+GROUP+BY+table'`;

  const JournalMonitorCode = `# Follow all PoH service logs in real time
sudo journalctl -u poh-inference -u poh-consumer -u poh-dashboard -f

# Filter for errors only
sudo journalctl -u poh-inference --since "1 hour ago" -p err --no-pager

# Export last 24h to file for analysis
sudo journalctl -u poh-inference --since "24 hours ago" --output=json > /tmp/poh-inference-24h.json

# Watch kafka consumer lag via Redpanda admin API
watch -n 5 'curl -s http://localhost:9644/v1/groups/poh-consumer/offsets | jq ".[] | {topic: .topic, lag: (.high_watermark - .committed_offset)}"'

# Count error types in last hour
sudo journalctl -u poh-inference --since "1 hour ago" | grep -oP '"level":"\\K[^"]+' | sort | uniq -c | sort -rn`;

  const ModelRetrainCode = `# Step 1: Export training data from ClickHouse
curl -s 'http://localhost:8123/?query=SELECT+session_id,feature_vector,is_human+FROM+poh.session_scores+WHERE+inferred_at+>=+now()-INTERVAL+7+DAY+FORMAT+CSVWithNames' \\
  > /tmp/training_data.csv

echo "Rows exported: $(wc -l < /tmp/training_data.csv)"

# Step 2: Run training script (Python / scikit-learn → ONNX)
python3 /opt/poh/scripts/retrain.py \\
  --input /tmp/training_data.csv \\
  --output /tmp/model_new.onnx \\
  --epochs 50 \\
  --validation-split 0.2

# Step 3: Validate new model (must exceed 0.97 F1 on hold-out set)
python3 /opt/poh/scripts/evaluate.py --model /tmp/model_new.onnx

# Step 4: Hot-swap without service restart (inference service watches for file change)
cp /opt/poh/model.onnx /opt/poh/model.onnx.bak.$(date +%Y%m%d%H%M)
cp /tmp/model_new.onnx /opt/poh/model.onnx

# Step 5: Verify new model loaded (check log for "model reloaded" message)
sudo journalctl -u poh-inference -n 20 --no-pager | grep -i 'model'

# Step 6: Monitor bot_detection_rate for 15 minutes
watch -n 10 'curl -s http://localhost:8080/metrics | grep poh_bot_detection_rate'`;

  const ClickHouseMaintenanceCode = `-- Check partition sizes and row counts
SELECT
    table,
    formatReadableSize(sum(bytes_on_disk)) AS disk_size,
    formatReadableQuantity(sum(rows))       AS total_rows,
    count()                                 AS parts
FROM system.parts
WHERE database = 'poh' AND active
GROUP BY table
ORDER BY sum(bytes_on_disk) DESC;

-- Manually trigger partition merge (reduces part count)
OPTIMIZE TABLE poh.telemetry_events FINAL;

-- Drop partitions older than TTL manually (if auto-TTL is slow)
ALTER TABLE poh.telemetry_events
    DROP PARTITION '20240101';

-- Check replication status (if using ClickHouse Keeper)
SELECT shard_num, replica_path, is_leader, total_replicas, active_replicas
FROM system.replicas
WHERE database = 'poh';

-- Retention: verify TTL is set correctly on telemetry table
SELECT name, engine_full
FROM system.tables
WHERE database = 'poh' AND name = 'telemetry_events';

-- Materialized view refresh check
SELECT database, table, last_refresh_time, last_refresh_result
FROM system.view_refreshes
WHERE database = 'poh';`;

  const [incidentOpen, setIncidentOpen] = useState({ p1: false, p2: false, p3: false });

  return (
    <Layout>
      <div className="flex w-full max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-64 hidden md:block shrink-0 border-r border-border/40 py-8 pr-6 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <nav className="flex flex-col space-y-1">
            <h4 className="font-semibold text-sm mb-4 px-2 text-foreground">Playbooks</h4>
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
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold tracking-tight">Operational Playbooks</h1>
            <p className="text-lg text-muted-foreground mt-4">
              Standard operating procedures for managing the Proof of Human production environment.
            </p>
          </div>

          <section id="flow-verify" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">Flow Verification</h2>
            <p className="mb-4">Verify the end-to-end pipeline is functional using curl.</p>
            <CodeBlock language="bash" code={FlowVerificationCode} />
          </section>

          <section id="inference-debug" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">Go Inference Troubleshooting</h2>
            <p className="mb-4">Commands to debug and diagnose the Go ONNX Inference Engine.</p>
            <CodeBlock language="bash" code={InferenceDebugCode} />
          </section>

          <section id="resource-monitor" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">Resource Monitoring</h2>
            <p className="mb-4">Check system resources across the node.</p>
            <CodeBlock language="bash" code={ResourceMonitorCode} />
          </section>

          <section id="journal-monitor" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">Journal Monitoring</h2>
            <p className="mb-4">Techniques for parsing systemd logs and analyzing errors.</p>
            <CodeBlock language="bash" code={JournalMonitorCode} />
          </section>

          <section id="model-retrain" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">Model Retraining</h2>
            <p className="mb-4">When model accuracy degrades (bot_detection_rate deviates &gt; 5% from baseline), retrain using the ClickHouse feature store.</p>
            <CodeBlock language="bash" code={ModelRetrainCode} />
          </section>

          <section id="clickhouse-maintenance" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">ClickHouse Maintenance</h2>
            <p className="mb-4">Database administration queries for health and cleanup.</p>
            <CodeBlock language="sql" code={ClickHouseMaintenanceCode} />
          </section>

          <section id="incident-response" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-bold border-b border-border/40 pb-2 mb-6">Incident Response</h2>
            <p className="mb-6">Runbooks for common production alerts.</p>
            
            <div className="space-y-4 not-prose">
              {/* P1 Alert */}
              <div className="border border-red-500/30 rounded-lg overflow-hidden bg-card">
                <button 
                  onClick={() => setIncidentOpen(prev => ({ ...prev, p1: !prev.p1 }))}
                  className="w-full flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <AlertOctagon className="h-5 w-5 text-red-500" />
                    <span className="font-bold text-red-500">P1 Alert: Inference service down</span>
                  </div>
                  {incidentOpen.p1 ? <ChevronUp className="h-5 w-5 text-red-500/70" /> : <ChevronDown className="h-5 w-5 text-red-500/70" />}
                </button>
                {incidentOpen.p1 && (
                  <div className="p-5 border-t border-red-500/20 text-sm space-y-3">
                    <div className="flex gap-3"><span className="text-muted-foreground font-mono">1.</span> <span>Confirm: <code className="bg-secondary px-1 py-0.5 rounded font-mono text-xs">systemctl status poh-inference</code></span></div>
                    <div className="flex gap-3"><span className="text-muted-foreground font-mono">2.</span> <span>Restart: <code className="bg-secondary px-1 py-0.5 rounded font-mono text-xs">systemctl restart poh-inference</code></span></div>
                    <div className="flex gap-3"><span className="text-muted-foreground font-mono">3.</span> <span>If fails: check OOM (<code className="bg-secondary px-1 py-0.5 rounded font-mono text-xs">dmesg | tail -20</code>), check disk (<code className="bg-secondary px-1 py-0.5 rounded font-mono text-xs">df -h</code>)</span></div>
                    <div className="flex gap-3"><span className="text-muted-foreground font-mono">4.</span> <span>Escalate if down &gt; 5 min: page on-call via PagerDuty</span></div>
                  </div>
                )}
              </div>

              {/* P2 Alert */}
              <div className="border border-yellow-500/30 rounded-lg overflow-hidden bg-card">
                <button 
                  onClick={() => setIncidentOpen(prev => ({ ...prev, p2: !prev.p2 }))}
                  className="w-full flex items-center justify-between p-4 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <span className="font-bold text-yellow-500">P2 Alert: Kafka consumer lag &gt; 10,000</span>
                  </div>
                  {incidentOpen.p2 ? <ChevronUp className="h-5 w-5 text-yellow-500/70" /> : <ChevronDown className="h-5 w-5 text-yellow-500/70" />}
                </button>
                {incidentOpen.p2 && (
                  <div className="p-5 border-t border-yellow-500/20 text-sm space-y-3">
                    <div className="flex gap-3"><span className="text-muted-foreground font-mono">1.</span> <span>Check consumer logs: <code className="bg-secondary px-1 py-0.5 rounded font-mono text-xs">journalctl -u poh-consumer -n 50</code></span></div>
                    <div className="flex gap-3"><span className="text-muted-foreground font-mono">2.</span> <span>Scale consumers: <code className="bg-secondary px-1 py-0.5 rounded font-mono text-xs">docker-compose scale consumer=3</code></span></div>
                    <div className="flex gap-3"><span className="text-muted-foreground font-mono">3.</span> <span>Check broker health: <code className="bg-secondary px-1 py-0.5 rounded font-mono text-xs">rpk cluster health</code></span></div>
                  </div>
                )}
              </div>

              {/* P3 Alert */}
              <div className="border border-blue-500/30 rounded-lg overflow-hidden bg-card">
                <button 
                  onClick={() => setIncidentOpen(prev => ({ ...prev, p3: !prev.p3 }))}
                  className="w-full flex items-center justify-between p-4 bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-blue-500" />
                    <span className="font-bold text-blue-500">P3 Alert: ClickHouse insert errors &gt; 10/min</span>
                  </div>
                  {incidentOpen.p3 ? <ChevronUp className="h-5 w-5 text-blue-500/70" /> : <ChevronDown className="h-5 w-5 text-blue-500/70" />}
                </button>
                {incidentOpen.p3 && (
                  <div className="p-5 border-t border-blue-500/20 text-sm space-y-3">
                    <div className="flex gap-3"><span className="text-muted-foreground font-mono">1.</span> <span>Check disk space: <code className="bg-secondary px-1 py-0.5 rounded font-mono text-xs">df -h /var/lib/clickhouse</code></span></div>
                    <div className="flex gap-3"><span className="text-muted-foreground font-mono">2.</span> <span>Check CH logs: <code className="bg-secondary px-1 py-0.5 rounded font-mono text-xs">journalctl -u clickhouse-server -n 50</code></span></div>
                    <div className="flex gap-3"><span className="text-muted-foreground font-mono">3.</span> <span>Drop old partition if disk full (see ClickHouse Maintenance)</span></div>
                  </div>
                )}
              </div>

            </div>
          </section>

        </div>
      </div>
    </Layout>
  );
}