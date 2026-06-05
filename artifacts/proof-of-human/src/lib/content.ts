export const TS_SDK_CODE = `// proof-of-human-sdk/src/index.ts
export interface TelemetryEvent {
  sessionId: string;
  eventType: 'mousemove' | 'keydown' | 'scroll' | 'click';
  timestamp: number;
  x?: number;
  y?: number;
  velocity?: number;
  keyCode?: number;
  scrollDelta?: number;
}

export class ProofOfHumanSDK {
  private sessionId: string;
  private buffer: TelemetryEvent[] = [];
  private endpoint: string;
  private flushInterval: ReturnType<typeof setInterval>;

  constructor(config: { endpoint: string; sessionId?: string }) {
    this.endpoint = config.endpoint;
    this.sessionId = config.sessionId ?? crypto.randomUUID();
    this.flushInterval = setInterval(() => this.flush(), 2000);
    this.attachListeners();
  }

  private attachListeners() {
    let lastX = 0, lastY = 0, lastT = 0;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      const dt = now - lastT;
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      this.push({ eventType: 'mousemove', x: e.clientX, y: e.clientY, velocity: dt > 0 ? dist / dt : 0 });
      lastX = e.clientX; lastY = e.clientY; lastT = now;
    });
    document.addEventListener('keydown', (e) => {
      this.push({ eventType: 'keydown', keyCode: e.keyCode });
    });
    document.addEventListener('scroll', () => {
      this.push({ eventType: 'scroll', scrollDelta: window.scrollY });
    });
  }

  private push(partial: Omit<TelemetryEvent, 'sessionId' | 'timestamp'>) {
    this.buffer.push({ sessionId: this.sessionId, timestamp: Date.now(), ...partial });
    if (this.buffer.length >= 50) this.flush();
  }

  async flush() {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0, this.buffer.length);
    await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
    });
  }

  destroy() {
    clearInterval(this.flushInterval);
  }
}`;

export const WORKER_CODE = `// edge-ingress/src/worker.ts
import { Kafka } from '@upstash/kafka';

interface Env {
  KAFKA_URL: string;
  KAFKA_USERNAME: string;
  KAFKA_PASSWORD: string;
  HMAC_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const sig = request.headers.get('X-PoH-Signature');
    if (!sig || !(await verifyHMAC(request, env.HMAC_SECRET, sig))) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const kafka = new Kafka({
      url: env.KAFKA_URL,
      username: env.KAFKA_USERNAME,
      password: env.KAFKA_PASSWORD,
    });

    const producer = kafka.producer();
    await producer.produce('telemetry-events', JSON.stringify(body));

    return Response.json({ accepted: body.events?.length ?? 0 });
  },
};

async function verifyHMAC(request: Request, secret: string, signature: string): Promise<boolean> {
  const body = await request.clone().text();
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const sig = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
  return crypto.subtle.verify('HMAC', key, sig, new TextEncoder().encode(body));
}`;

export const GO_INFERENCE_CODE = `// inference-service/main.go
package main

import (
    "encoding/json"
    "log"
    "net/http"

    ort "github.com/yalue/onnxruntime_go"
)

type InferenceRequest struct {
    SessionID string    \`json:"session_id"\`
    Features  []float32 \`json:"features"\`
}

type InferenceResponse struct {
    SessionID   string  \`json:"session_id"\`
    HumanScore  float32 \`json:"human_score"\`
    IsHuman     bool    \`json:"is_human"\`
    LatencyMs   float64 \`json:"latency_ms"\`
}

var session *ort.Session[float32, float32]

func init() {
    ort.SetSharedLibraryPath("./libonnxruntime.so")
    if err := ort.InitializeEnvironment(); err != nil {
        log.Fatalf("failed to init ONNX: %v", err)
    }
    var err error
    session, err = ort.NewSession[float32, float32](
        "./model.onnx",
        []string{"input"},
        []string{"output"},
        []ort.Shape{{1, 128}},
        []ort.Shape{{1, 1}},
    )
    if err != nil {
        log.Fatalf("failed to load model: %v", err)
    }
}

func inferHandler(w http.ResponseWriter, r *http.Request) {
    var req InferenceRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "bad request", 400)
        return
    }

    input, _ := ort.NewTensor(ort.NewShape(1, 128), req.Features)
    defer input.Destroy()

    output, _ := ort.NewEmptyTensor[float32](ort.NewShape(1, 1))
    defer output.Destroy()

    if err := session.Run([]*ort.Tensor[float32]{input}, []*ort.Tensor[float32]{output}); err != nil {
        http.Error(w, "inference failed", 500)
        return
    }

    score := output.GetData()[0]
    json.NewEncoder(w).Encode(InferenceResponse{
        SessionID:  req.SessionID,
        HumanScore: score,
        IsHuman:    score > 0.5,
    })
}

func main() {
    http.HandleFunc("/infer", inferHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}`;

export const SQL_SCHEMA_CODE = `-- ClickHouse DDL for Proof of Human
CREATE DATABASE IF NOT EXISTS poh;

CREATE TABLE poh.telemetry_events (
    session_id     String,
    event_type     LowCardinality(String),
    timestamp      DateTime64(3, 'UTC'),
    x              Nullable(Float32),
    y              Nullable(Float32),
    velocity       Nullable(Float32),
    key_code       Nullable(UInt16),
    scroll_delta   Nullable(Float32),
    user_agent     String,
    ip_hash        FixedString(64),
    edge_region    LowCardinality(String),
    created_at     DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMMDD(timestamp)
ORDER BY (session_id, timestamp)
TTL timestamp + INTERVAL 90 DAY;

CREATE TABLE poh.session_scores (
    session_id     String,
    human_score    Float32,
    is_human       UInt8,
    feature_vector Array(Float32),
    model_version  String,
    inferred_at    DateTime64(3, 'UTC'),
    event_count    UInt32,
    latency_ms     Float32
) ENGINE = ReplacingMergeTree(inferred_at)
ORDER BY session_id;

CREATE MATERIALIZED VIEW poh.hourly_stats
ENGINE = SummingMergeTree()
ORDER BY (hour, edge_region)
AS SELECT
    toStartOfHour(timestamp) AS hour,
    edge_region,
    count() AS event_count,
    uniqExact(session_id) AS unique_sessions
FROM poh.telemetry_events
GROUP BY hour, edge_region;`;

export const UBUNTU_DEPLOY_CODE = `# 1. Install dependencies
sudo apt-get update && sudo apt-get install -y docker.io docker-compose nginx certbot

# 2. Clone and configure
git clone https://github.com/your-org/proof-of-human
cd proof-of-human
cp .env.example .env
# Edit .env with your Kafka, ClickHouse, and HMAC credentials

# 3. Start services
docker-compose up -d

# 4. Deploy Cloudflare Worker
npx wrangler publish --env production

# 5. Configure Nginx reverse proxy
sudo tee /etc/nginx/sites-available/poh << 'EOF'
server {
    server_name api.proofofhuman.io;
    location /infer {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /dashboard {
        proxy_pass http://127.0.0.1:3000;
    }
}
EOF
sudo ln -s /etc/nginx/sites-available/poh /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 6. Issue TLS certificate
sudo certbot --nginx -d api.proofofhuman.io

# 7. Set up systemd service for inference engine
sudo tee /etc/systemd/system/poh-inference.service << 'EOF'
[Unit]
Description=Proof of Human Inference Service
After=network.target

[Service]
ExecStart=/opt/poh/inference-service
Restart=always
EnvironmentFile=/opt/poh/.env

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl enable --now poh-inference.service`;

export const DOCKER_COMPOSE_CODE = `version: '3.8'
services:
  clickhouse:
    image: clickhouse/clickhouse-server:23.8
    ports:
      - "8123:8123"
      - "9000:9000"
    volumes:
      - clickhouse_data:/var/lib/clickhouse

  redpanda:
    image: redpandadata/redpanda:latest
    command:
      - redpanda
      - start
      - --smp 1
      - --memory 1G
      - --reserve-memory 0M
      - --kafka-addr 0.0.0.0:9092
    ports:
      - "9092:9092"
      - "9644:9644"

  inference:
    build: ./inference-service
    ports:
      - "8080:8080"
    environment:
      - CLICKHOUSE_URL=http://clickhouse:8123
    depends_on:
      - clickhouse
      - redpanda

  dashboard:
    build: ./dashboard
    ports:
      - "3000:3000"

volumes:
  clickhouse_data:`;

export const FULL_MARKDOWN_DOCS = `# Executive Summary
Proof of Human is an advanced telemetry and AI inference platform designed to score user sessions as human or bot in real time. It utilizes lightweight browser signals—such as scroll velocity, mouse movement curves, and keystroke dynamics—and streams them through a highly scalable ingress pipeline to an ONNX-powered machine learning inference engine.

# Technical Stack
| Component | Technology | Purpose |
|---|---|---|
| **SDK** | TypeScript | Captures and batches browser/device events. |
| **Edge** | Cloudflare Workers | Validates requests and publishes to queue. |
| **Queue** | Kafka/Redpanda | Highly available event streaming. |
| **Inference** | Go + ONNX | High-performance model execution. |
| **Storage** | ClickHouse | Fast analytical database for telemetry storage. |
| **Frontend** | React | Real-time administrative dashboard. |

# AI Generation Prompts
To scaffold this platform, we utilized specific prompts:
- *Ingress*: "Write a Cloudflare worker in TypeScript that accepts HTTP POST with JSON array of telemetry events, verifies an HMAC signature using WebCrypto API, and publishes the payload to an Upstash Kafka topic."
- *Inference*: "Write a high-performance Go HTTP service using the onnxruntime_go package that decodes a float32 feature array, runs inference on an ONNX model, and returns a human likelihood score."

# SDK Implementation
The browser SDK batches telemetry data to minimize network overhead.
\`\`\`ts
${TS_SDK_CODE}
\`\`\`

# Edge Ingress Service
Cloudflare Worker handling ingress and Kafka publishing.
\`\`\`ts
${WORKER_CODE}
\`\`\`

# Go ONNX Inference Engine
Loads the ONNX model and serves HTTP inferences.
\`\`\`go
${GO_INFERENCE_CODE}
\`\`\`

# ClickHouse Schema
Optimized schemas for massive write throughput and analytical queries.
\`\`\`sql
${SQL_SCHEMA_CODE}
\`\`\`

# Deployment Instructions
Production deployment on Ubuntu 22.04 LTS.
\`\`\`bash
${UBUNTU_DEPLOY_CODE}
\`\`\`

### Docker Compose
\`\`\`yaml
${DOCKER_COMPOSE_CODE}
\`\`\`
`;
