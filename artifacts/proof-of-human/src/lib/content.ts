export const TS_SDK_CODE = `/**
 * Proof of Human Browser SDK v1.0
 *
 * Drop this script on any page. Configure via window.PoH before loading.
 * Zero dependencies. < 5KB. Works in all modern browsers.
 *
 * window.PoH = {
 *   token:     "tok_...",                    // required — your API token
 *   ingestUrl: "https://…/api/ingest",       // required — your PoH API URL
 *   domain:    "yoursite.com",               // optional, defaults to hostname
 *   sessionId: "uuid",                       // optional, auto-generated
 * };
 *
 * Signals collected and computed:
 *   Behavioral : mouseEntropy, keystrokeCv, scrollVariance, timingScore
 *   Counts     : mouseEventCount, keystrokeCount, scrollEventCount, clickCount
 *   Timing     : firstInteractMs, sessionDurationMs
 *   Environment: hasWebdriver, pluginCount, hasLanguages, isMobile,
 *                screenW/H, outerW/H, hardwareConcurrency, deviceMemory,
 *                colorDepth, hasTouchSupport, cookieEnabled
 *   Fingerprint: canvasHash, audioHash, webglVendor, webglRenderer, timezone
 *   Composite  : fingerprintScore, composite  (client-weighted, 0–1)
 *
 * Sends twice: once at 5 s (early baseline) and once on page hide (keepalive).
 */
(function (W) {
  'use strict';
  var cfg    = W.PoH || {};
  var TOKEN  = cfg.token;
  var INGEST = cfg.ingestUrl || (W.location.origin + '/api/ingest');
  var DOMAIN = cfg.domain    || W.location.hostname;
  var T0     = Date.now();

  if (!TOKEN) { W.console && W.console.warn('[PoH] Missing token'); return; }

  function uid() {
    return W.crypto && W.crypto.randomUUID ? W.crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
  }

  var SESSION = cfg.sessionId || uid();
  var mPts = [], kTimes = [], sPts = [], aTimes = [];
  var clicks = 0, interactions = 0, firstMs = null;

  function touch(t) {
    interactions++;
    if (firstMs === null) firstMs = t - T0;
    if (aTimes.length < 500) aTimes.push(t);
  }

  // Passive event collection
  var lx = -1, ly = -1;
  W.addEventListener('mousemove', function(e) {
    var t = Date.now();
    if (Math.abs(e.clientX-lx)>1 || Math.abs(e.clientY-ly)>1) {
      if (mPts.length < 300) mPts.push({x:e.clientX,y:e.clientY});
      lx=e.clientX; ly=e.clientY;
    }
    touch(t);
  }, {passive:true});
  W.addEventListener('keydown',    function() { var t=Date.now(); if(kTimes.length<200) kTimes.push(t); touch(t); }, {passive:true});
  W.addEventListener('scroll',     function() { var t=Date.now(); if(sPts.length<200) sPts.push(W.scrollY||0); touch(t); }, {passive:true});
  W.addEventListener('click',      function() { clicks++; touch(Date.now()); }, {passive:true});
  W.addEventListener('touchstart', function() { touch(Date.now()); }, {passive:true});

  // Behavioral metrics
  function entropy(pts) {
    if (pts.length < 10) return pts.length ? 0.35 : 0;
    var b=[0,0,0,0,0,0,0,0], L2=Math.LN2;
    for (var i=1;i<pts.length;i++) {
      var dx=pts[i].x-pts[i-1].x, dy=pts[i].y-pts[i-1].y;
      if (Math.abs(dx)<0.5&&Math.abs(dy)<0.5) continue;
      b[Math.floor((Math.atan2(dy,dx)+Math.PI)/(Math.PI/4))%8]++;
    }
    var tot=b.reduce(function(a,v){return a+v;},0); if(!tot) return 0;
    var H=0; for(var j=0;j<8;j++) if(b[j]) { var p=b[j]/tot; H-=p*(Math.log(p)/L2); }
    return Math.min(1,H/3);
  }

  function cv(times) {
    if (times.length < 4) return times.length ? 0.35 : 0;
    var iv=[]; for(var i=1;i<times.length;i++) iv.push(times[i]-times[i-1]);
    var m=iv.reduce(function(a,b){return a+b;},0)/iv.length; if(!m) return 0;
    var sd=Math.sqrt(iv.reduce(function(s,v){return s+Math.pow(v-m,2);},0)/iv.length);
    return Math.min(1,(sd/m)/2);
  }

  function scrollVar(pos) {
    if (pos.length < 3) return pos.length ? 0.35 : 0;
    var d=[]; for(var i=1;i<pos.length;i++) d.push(Math.abs(pos[i]-pos[i-1]));
    var m=d.reduce(function(a,b){return a+b;},0)/d.length;
    var sd=Math.sqrt(d.reduce(function(s,v){return s+Math.pow(v-m,2);},0)/d.length);
    return Math.min(1,sd/100);
  }

  function timing(times) {
    if (times.length < 5) return 0.5;
    var iv=[]; for(var i=1;i<times.length;i++){var d=times[i]-times[i-1]; if(d>0&&d<10000) iv.push(d);}
    if (iv.length<4) return 0.5;
    var m=iv.reduce(function(a,b){return a+b;},0)/iv.length; if(!m) return 0;
    var sd=Math.sqrt(iv.reduce(function(s,v){return s+Math.pow(v-m,2);},0)/iv.length);
    return Math.min(1,sd/m);
  }

  function canvasHash() {
    try {
      var c=document.createElement('canvas'); c.width=220; c.height=30;
      var x=c.getContext('2d'); if(!x) return 0;
      x.textBaseline='alphabetic'; x.fillStyle='#f0f'; x.fillRect(10,1,100,20);
      x.fillStyle='#069'; x.font='11pt no-real-font,Arial'; x.fillText('PoH \\u2603 \\u00e9',2,15);
      x.fillStyle='rgba(102,204,0,0.7)'; x.font='16pt Arial'; x.fillText('PoH \\u2603 \\u00e9',4,20);
      var d=c.toDataURL().slice(22), h=0;
      for(var i=0;i<Math.min(d.length,600);i++) h=((h<<5)-h+d.charCodeAt(i))|0;
      return h;
    } catch(e) { return 0; }
  }

  function audioHash(cb) {
    try {
      if (!W.OfflineAudioContext) { cb(0); return; }
      var ctx=new W.OfflineAudioContext(1,44100,44100);
      var osc=ctx.createOscillator(), cmp=ctx.createDynamicsCompressor();
      cmp.threshold.setValueAtTime(-50,0); cmp.knee.setValueAtTime(40,0);
      cmp.ratio.setValueAtTime(12,0); cmp.attack.setValueAtTime(0,0); cmp.release.setValueAtTime(0.25,0);
      osc.connect(cmp); cmp.connect(ctx.destination); osc.start(0);
      ctx.oncomplete=function(e){
        var d=e.renderedBuffer.getChannelData(0), s=0;
        for(var i=4500;i<Math.min(d.length,5000);i++) s+=Math.abs(d[i]);
        cb(Math.round(s*1e6)|0);
      };
      ctx.startRendering();
    } catch(e) { cb(0); }
  }

  function webgl() {
    try {
      var c=document.createElement('canvas');
      var gl=c.getContext('webgl')||c.getContext('experimental-webgl'); if(!gl) return {vendor:'',renderer:''};
      var ext=gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor:  String(ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)  :(gl.getParameter(gl.VENDOR)||'')),
        renderer:String(ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):(gl.getParameter(gl.RENDERER)||'')),
      };
    } catch(e) { return {vendor:'',renderer:''}; }
  }

  var nav=W.navigator||{}, scr=W.screen||{}, wgl=webgl();
  var ENV={
    isMobile:/Mobi|Android|iPhone|iPad/i.test(nav.userAgent||''),
    hasWebdriver:!!nav.webdriver, pluginCount:(nav.plugins||[]).length,
    hasLanguages:!!(nav.languages&&nav.languages.length>0),
    screenW:scr.width||0, screenH:scr.height||0,
    outerW:W.outerWidth||0, outerH:W.outerHeight||0,
    hardwareConcurrency:nav.hardwareConcurrency||0,
    deviceMemory:'deviceMemory' in nav?nav.deviceMemory:-1,
    colorDepth:scr.colorDepth||0,
    hasTouchSupport:'ontouchstart' in W||!!(nav.maxTouchPoints>0),
    maxTouchPoints:nav.maxTouchPoints||0, cookieEnabled:!!nav.cookieEnabled,
    webglVendor:wgl.vendor, webglRenderer:wgl.renderer, canvasHash:0, audioHash:0,
    timezone:typeof Intl!=='undefined'&&Intl.DateTimeFormat?(Intl.DateTimeFormat().resolvedOptions().timeZone||')':'',
  };

  function fpScore(s) {
    var r=(s.webglRenderer||'').toLowerCase();
    var checks=[!s.hasWebdriver,s.pluginCount>0,s.hasLanguages,
      s.outerW>100&&s.outerH>100,s.colorDepth>=24,s.hardwareConcurrency>=2,
      s.cookieEnabled,s.canvasHash!==0,
      !r||(r.indexOf('swiftshader')===-1&&r.indexOf('llvmpipe')===-1)];
    var n=0; for(var i=0;i<checks.length;i++) if(checks[i]) n++;
    return n/checks.length;
  }

  function composite(s) {
    if (s.hasWebdriver) return 0.01;
    var r=(s.webglRenderer||'').toLowerCase();
    if (r&&(r.indexOf('swiftshader')!==-1||r.indexOf('llvmpipe')!==-1)) return 0.04;
    var beh=0, bc=0;
    if(s.mouseEventCount>=10){beh+=s.mouseEntropy;bc++;}
    if(s.keystrokeCount>=3) {beh+=s.keystrokeCv;bc++;}
    if(s.scrollEventCount>=2){beh+=s.scrollVariance;bc++;}
    var behScore=bc?beh/bc:0.5, intScore=Math.min(1,s.interactionCount/8);
    var score=(s.fingerprintScore*0.45)+(behScore*0.35)+(intScore*0.20);
    if(s.outerW===0||s.outerH===0) score=Math.min(score,0.20);
    if(!s.cookieEnabled) score=Math.min(score,0.50);
    if(!s.isMobile&&s.hardwareConcurrency<=1) score=Math.min(score,0.60);
    if(!s.isMobile&&s.pluginCount===0) score=Math.min(score,0.65);
    return Math.max(0.01,Math.min(0.99,score));
  }

  function buildSignals() {
    ENV.canvasHash=canvasHash();
    var s={
      mouseEntropy:entropy(mPts), keystrokeCv:cv(kTimes),
      scrollVariance:scrollVar(sPts), timingScore:timing(aTimes),
      mouseEventCount:mPts.length, keystrokeCount:kTimes.length,
      scrollEventCount:sPts.length, clickCount:clicks,
      interactionCount:interactions, firstInteractMs:firstMs,
      sessionDurationMs:Date.now()-T0,
      isMobile:ENV.isMobile, hasWebdriver:ENV.hasWebdriver,
      pluginCount:ENV.pluginCount, hasLanguages:ENV.hasLanguages,
      screenW:ENV.screenW, screenH:ENV.screenH, outerW:ENV.outerW, outerH:ENV.outerH,
      hardwareConcurrency:ENV.hardwareConcurrency, deviceMemory:ENV.deviceMemory,
      colorDepth:ENV.colorDepth, hasTouchSupport:ENV.hasTouchSupport,
      maxTouchPoints:ENV.maxTouchPoints, cookieEnabled:ENV.cookieEnabled,
      webglVendor:ENV.webglVendor, webglRenderer:ENV.webglRenderer,
      canvasHash:ENV.canvasHash, audioHash:ENV.audioHash, timezone:ENV.timezone,
      fingerprintScore:0, composite:0,
    };
    s.fingerprintScore=fpScore(s); s.composite=composite(s);
    return s;
  }

  function send(sig, keepalive) {
    try {
      W.fetch(INGEST, {
        method:'POST', keepalive:!!keepalive,
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+TOKEN},
        body:JSON.stringify({session_id:SESSION,event_type:'page_view',
          domain:DOMAIN,referrer:document.referrer||null,
          duration_ms:sig.sessionDurationMs,signals:sig}),
      }).catch(function(){});
    } catch(e) {}
  }

  var earlyFired=false;
  var t=W.setTimeout(function(){
    earlyFired=true;
    audioHash(function(h){ENV.audioHash=h; send(buildSignals(),false);});
  }, 5000);

  function onHide(){
    if(!earlyFired) W.clearTimeout(t);
    audioHash(function(h){ENV.audioHash=h; send(buildSignals(),true);});
  }

  document.addEventListener('visibilitychange',function(){
    if(document.visibilityState==='hidden') onHide();
  });
  W.addEventListener('pagehide', onHide, {once:true});

}(window));`;

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
