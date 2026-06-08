/**
 * Proof of Human Browser SDK v1.0
 *
 * Passively collects behavioral + environment signals and sends them to the
 * PoH ingest endpoint. Drop-in, zero-dependency, < 5KB minified.
 *
 * Required config (set before loading this script):
 *   window.PoH = {
 *     token:     "tok_...",          // your API token
 *     ingestUrl: "https://…/api/ingest", // your PoH API URL
 *     domain:    "yoursite.com",     // optional, defaults to location.hostname
 *     sessionId: "…",               // optional, auto-generated if omitted
 *   };
 */
(function (W) {
  'use strict';

  var cfg       = W.PoH || {};
  var TOKEN     = cfg.token;
  var INGEST    = cfg.ingestUrl || (W.location.origin + '/api/ingest');
  var DOMAIN    = cfg.domain    || W.location.hostname;
  var SESSION   = cfg.sessionId || uid();
  var T0        = Date.now();

  if (!TOKEN) { warn('Missing token'); return; }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function uid() {
    if (W.crypto && W.crypto.randomUUID) return W.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function warn(msg) { if (W.console) W.console.warn('[PoH] ' + msg); }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  // ── Event buffers ─────────────────────────────────────────────────────────────

  var mousePoints   = [];   // {x,y}   capped at 300
  var keyTimes      = [];   // ms timestamps, capped at 200
  var scrollPos     = [];   // scrollY values, capped at 200
  var allTimes      = [];   // all interaction timestamps, capped at 500
  var clickCount    = 0;
  var interactions  = 0;
  var firstMs       = null; // ms from T0 to first interaction

  function touch(t) {
    interactions++;
    if (firstMs === null) firstMs = t - T0;
    if (allTimes.length < 500) allTimes.push(t);
  }

  // ── Listeners (passive) ───────────────────────────────────────────────────────

  var lmx = -1, lmy = -1;
  W.addEventListener('mousemove', function (e) {
    var t = Date.now();
    if (Math.abs(e.clientX - lmx) > 1 || Math.abs(e.clientY - lmy) > 1) {
      if (mousePoints.length < 300) mousePoints.push({ x: e.clientX, y: e.clientY });
      lmx = e.clientX; lmy = e.clientY;
    }
    touch(t);
  }, { passive: true });

  W.addEventListener('keydown', function () {
    var t = Date.now();
    if (keyTimes.length < 200) keyTimes.push(t);
    touch(t);
  }, { passive: true });

  W.addEventListener('scroll', function () {
    var t = Date.now();
    if (scrollPos.length < 200) scrollPos.push(W.scrollY || 0);
    touch(t);
  }, { passive: true });

  W.addEventListener('click', function () { clickCount++; touch(Date.now()); }, { passive: true });
  W.addEventListener('touchstart', function () { touch(Date.now()); }, { passive: true });

  // ── Behavioral metrics ────────────────────────────────────────────────────────

  /** Shannon entropy of 8-direction mouse movement (0 = always straight, 1 = all directions) */
  function mouseEntropy() {
    if (mousePoints.length < 10) return mousePoints.length > 0 ? 0.35 : 0;
    var b = [0,0,0,0,0,0,0,0];
    for (var i = 1; i < mousePoints.length; i++) {
      var dx = mousePoints[i].x - mousePoints[i-1].x;
      var dy = mousePoints[i].y - mousePoints[i-1].y;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
      var ang = Math.atan2(dy, dx);
      b[Math.floor((ang + Math.PI) / (Math.PI / 4)) % 8]++;
    }
    var tot = 0; for (var j = 0; j < 8; j++) tot += b[j];
    if (!tot) return 0;
    var H = 0, L2 = Math.LN2;
    for (var k = 0; k < 8; k++) {
      if (b[k]) { var p = b[k]/tot; H -= p * (Math.log(p) / L2); }
    }
    return clamp(H / 3, 0, 1); // max = 3 bits for 8 buckets
  }

  /** Coefficient of variation of inter-keystroke intervals (0 = perfectly regular, 1+ = human) */
  function keystrokeCv() {
    if (keyTimes.length < 4) return keyTimes.length > 0 ? 0.35 : 0;
    var iv = [];
    for (var i = 1; i < keyTimes.length; i++) iv.push(keyTimes[i] - keyTimes[i-1]);
    var mean = iv.reduce(function(a,b){return a+b;},0) / iv.length;
    if (!mean) return 0;
    var sd = Math.sqrt(iv.reduce(function(s,v){return s+Math.pow(v-mean,2);},0) / iv.length);
    return clamp(sd / mean / 2, 0, 1); // normalize: CV=2 → 1.0
  }

  /** Variance of scroll increment sizes (0 = fixed steps, 1 = human-like variance) */
  function scrollVariance() {
    if (scrollPos.length < 3) return scrollPos.length > 0 ? 0.35 : 0;
    var d = [];
    for (var i = 1; i < scrollPos.length; i++) d.push(Math.abs(scrollPos[i] - scrollPos[i-1]));
    var mean = d.reduce(function(a,b){return a+b;},0) / d.length;
    var sd   = Math.sqrt(d.reduce(function(s,v){return s+Math.pow(v-mean,2);},0) / d.length);
    return clamp(sd / 100, 0, 1);
  }

  /** Event timing irregularity: 1 = human-like irregular, 0 = robotic */
  function timingScore() {
    if (allTimes.length < 5) return 0.5;
    var iv = [];
    for (var i = 1; i < allTimes.length; i++) {
      var d = allTimes[i] - allTimes[i-1];
      if (d > 0 && d < 10000) iv.push(d);
    }
    if (iv.length < 4) return 0.5;
    var mean = iv.reduce(function(a,b){return a+b;},0) / iv.length;
    if (!mean) return 0;
    var sd = Math.sqrt(iv.reduce(function(s,v){return s+Math.pow(v-mean,2);},0) / iv.length);
    return clamp(sd / mean, 0, 1);
  }

  // ── Fingerprinting ────────────────────────────────────────────────────────────

  function canvasHash() {
    try {
      var c = document.createElement('canvas');
      c.width = 220; c.height = 30;
      var x = c.getContext('2d');
      if (!x) return 0;
      x.textBaseline = 'alphabetic';
      x.fillStyle = '#f0f'; x.fillRect(10, 1, 100, 20);
      x.fillStyle = '#069'; x.font = '11pt no-real-font,Arial';
      x.fillText('PoH \u2603 \u00e9', 2, 15);
      x.fillStyle = 'rgba(102,204,0,0.7)'; x.font = '16pt Arial';
      x.fillText('PoH \u2603 \u00e9', 4, 20);
      var d = c.toDataURL().slice(22); // strip header
      var h = 0;
      for (var i = 0; i < Math.min(d.length, 600); i++) {
        h = ((h << 5) - h + d.charCodeAt(i)) | 0;
      }
      return h;
    } catch(e) { return 0; }
  }

  function audioHash(cb) {
    try {
      if (typeof W.OfflineAudioContext === 'undefined') { cb(0); return; }
      var ctx = new W.OfflineAudioContext(1, 44100, 44100);
      var osc = ctx.createOscillator();
      var cmp = ctx.createDynamicsCompressor();
      cmp.threshold.setValueAtTime(-50, 0);
      cmp.knee.setValueAtTime(40, 0);
      cmp.ratio.setValueAtTime(12, 0);
      cmp.attack.setValueAtTime(0, 0);
      cmp.release.setValueAtTime(0.25, 0);
      osc.connect(cmp); cmp.connect(ctx.destination);
      osc.start(0);
      ctx.oncomplete = function(e) {
        var d = e.renderedBuffer.getChannelData(0);
        var s = 0;
        for (var i = 4500; i < Math.min(d.length, 5000); i++) s += Math.abs(d[i]);
        cb(Math.round(s * 1e6) | 0);
      };
      ctx.startRendering();
    } catch(e) { cb(0); }
  }

  function webglInfo() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return { vendor:'', renderer:'', maxTextureSize:0, extensions:0 };
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor:         String(ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)   : (gl.getParameter(gl.VENDOR)   || '')),
        renderer:       String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : (gl.getParameter(gl.RENDERER) || '')),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0,
        extensions:     (gl.getSupportedExtensions() || []).length,
      };
    } catch(e) { return { vendor:'', renderer:'', maxTextureSize:0, extensions:0 }; }
  }

  // ── Font enumeration ─────────────────────────────────────────────────────────
  //
  // Measures rendered text width with each probe font to detect which fonts
  // are installed. Different OSes and bot environments have different font sets.

  var FONT_PROBE_TEXT    = 'mmmmmmmmmmlli';
  var FONT_PROBE_SIZE    = '72px';
  var FONT_BASELINES_ARR = ['monospace', 'sans-serif', 'serif'];
  var PROBE_FONTS_LIST   = [
    'Arial','Arial Black','Arial Narrow','Calibri','Cambria','Comic Sans MS',
    'Courier New','Georgia','Gill Sans','Helvetica','Impact','Lucida Console',
    'Lucida Sans Unicode','Microsoft Sans Serif','Palatino Linotype','Segoe UI',
    'Tahoma','Times New Roman','Trebuchet MS','Verdana',
    'Apple Chancery','Apple Color Emoji','Helvetica Neue','Menlo','Monaco',
    'Optima','Futura','Droid Sans','Roboto','Noto Sans','Ubuntu',
    'DejaVu Sans','Liberation Sans','Source Code Pro','Fira Code',
    'MS Gothic','MS PGothic','SimSun','SimHei','Microsoft YaHei',
    'Malgun Gothic','Gulim',
  ];

  function fontFingerprint() {
    try {
      var el = document.createElement('span');
      el.style.cssText = 'position:absolute;top:-9999px;left:-9999px;visibility:hidden;font-size:' + FONT_PROBE_SIZE + ';';
      el.textContent = FONT_PROBE_TEXT;
      document.body.appendChild(el);
      var baseW = {};
      for (var b = 0; b < FONT_BASELINES_ARR.length; b++) {
        el.style.fontFamily = FONT_BASELINES_ARR[b];
        baseW[FONT_BASELINES_ARR[b]] = el.offsetWidth;
      }
      var found = [], h = 0x811c9dc5;
      for (var i = 0; i < PROBE_FONTS_LIST.length; i++) {
        var f = PROBE_FONTS_LIST[i];
        el.style.fontFamily = '"' + f + '",' + FONT_BASELINES_ARR[0];
        var w1 = el.offsetWidth;
        el.style.fontFamily = '"' + f + '",' + FONT_BASELINES_ARR[1];
        var w2 = el.offsetWidth;
        if (w1 !== baseW[FONT_BASELINES_ARR[0]] || w2 !== baseW[FONT_BASELINES_ARR[1]]) {
          found.push(f);
        }
      }
      document.body.removeChild(el);
      // FNV-1a hash of sorted font list
      var joined = found.join(',');
      for (var j = 0; j < joined.length; j++) {
        h ^= joined.charCodeAt(j);
        h = (h * 0x01000193) >>> 0;
      }
      return { count: found.length, hash: h >>> 0 };
    } catch(e) { return { count: 0, hash: 0 }; }
  }

  // ── Environment ───────────────────────────────────────────────────────────────

  var nav = W.navigator || {}, scr = W.screen || {};
  var wgl   = webglInfo();
  var fonts = fontFingerprint();

  var ENV = {
    isMobile:            /Mobi|Android|iPhone|iPad/i.test(nav.userAgent || ''),
    hasWebdriver:        !!nav.webdriver,
    pluginCount:         (nav.plugins || []).length,
    hasLanguages:        !!(nav.languages && nav.languages.length > 0),
    screenW:             scr.width  || 0,
    screenH:             scr.height || 0,
    outerW:              W.outerWidth  || 0,
    outerH:              W.outerHeight || 0,
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory:        'deviceMemory' in nav ? nav.deviceMemory : -1,
    colorDepth:          scr.colorDepth || 0,
    devicePixelRatio:    W.devicePixelRatio || 1,
    hasTouchSupport:     'ontouchstart' in W || !!(nav.maxTouchPoints > 0),
    maxTouchPoints:      nav.maxTouchPoints || 0,
    cookieEnabled:       !!nav.cookieEnabled,
    webglVendor:         wgl.vendor,
    webglRenderer:       wgl.renderer,
    webglMaxTextureSize: wgl.maxTextureSize,
    webglExtensions:     wgl.extensions,
    fontCount:           fonts.count,
    fontHash:            fonts.hash,
    canvasHash:          0,   // filled synchronously at send time
    audioHash:           0,   // filled asynchronously
    timezone:            typeof Intl !== 'undefined' && Intl.DateTimeFormat
                           ? (Intl.DateTimeFormat().resolvedOptions().timeZone || '') : '',
  };

  // ── Composite / fingerprint scores ────────────────────────────────────────────

  function fingerprintScore(s) {
    var rend = (s.webglRenderer || '').toLowerCase();
    var swChecks = [
      !s.hasWebdriver,
      s.pluginCount > 0,
      s.hasLanguages,
      s.outerW > 100 && s.outerH > 100,
      s.colorDepth >= 24,
      s.hardwareConcurrency >= 2,
      s.cookieEnabled,
      s.canvasHash !== 0,
      s.fontCount >= 5,   // bots/headless have very few installed fonts
      !rend || (rend.indexOf('swiftshader') === -1 && rend.indexOf('llvmpipe') === -1 && rend.indexOf('mesa offscreen') === -1),
    ];
    var n = 0;
    for (var i = 0; i < swChecks.length; i++) if (swChecks[i]) n++;
    return n / swChecks.length;
  }

  function computeComposite(s) {
    if (s.hasWebdriver) return 0.01;
    var rend = (s.webglRenderer || '').toLowerCase();
    if (rend && (rend.indexOf('swiftshader') !== -1 || rend.indexOf('llvmpipe') !== -1 || rend.indexOf('mesa offscreen') !== -1))
      return 0.04;

    var beh = 0, bc = 0;
    if (s.mouseEventCount >= 10) { beh += s.mouseEntropy;   bc++; }
    if (s.keystrokeCount  >= 3)  { beh += s.keystrokeCv;    bc++; }
    if (s.scrollEventCount >= 2) { beh += s.scrollVariance; bc++; }
    var behavScore = bc > 0 ? beh / bc : 0.5;

    var intScore = clamp(s.interactionCount / 8, 0, 1);
    var score    = (s.fingerprintScore * 0.45) + (behavScore * 0.35) + (intScore * 0.20);

    if (s.outerW === 0 || s.outerH === 0)                   score = Math.min(score, 0.20);
    if (!s.cookieEnabled)                                    score = Math.min(score, 0.50);
    if (!s.isMobile && s.hardwareConcurrency <= 1)           score = Math.min(score, 0.60);
    if (!s.isMobile && s.pluginCount === 0)                  score = Math.min(score, 0.65);

    return clamp(score, 0.01, 0.99);
  }

  // ── Build full signals payload ─────────────────────────────────────────────────

  function buildSignals() {
    ENV.canvasHash = canvasHash();

    var s = {
      mouseEntropy:        mouseEntropy(),
      keystrokeCv:         keystrokeCv(),
      scrollVariance:      scrollVariance(),
      timingScore:         timingScore(),
      mouseEventCount:     mousePoints.length,
      keystrokeCount:      keyTimes.length,
      scrollEventCount:    scrollPos.length,
      clickCount:          clickCount,
      interactionCount:    interactions,
      firstInteractMs:     firstMs,
      sessionDurationMs:   Date.now() - T0,
      isMobile:            ENV.isMobile,
      hasWebdriver:        ENV.hasWebdriver,
      pluginCount:         ENV.pluginCount,
      hasLanguages:        ENV.hasLanguages,
      screenW:             ENV.screenW,
      screenH:             ENV.screenH,
      outerW:              ENV.outerW,
      outerH:              ENV.outerH,
      hardwareConcurrency: ENV.hardwareConcurrency,
      deviceMemory:        ENV.deviceMemory,
      colorDepth:          ENV.colorDepth,
      hasTouchSupport:     ENV.hasTouchSupport,
      maxTouchPoints:      ENV.maxTouchPoints,
      cookieEnabled:       ENV.cookieEnabled,
      webglVendor:         ENV.webglVendor,
      webglRenderer:       ENV.webglRenderer,
      webglMaxTextureSize: ENV.webglMaxTextureSize,
      webglExtensions:     ENV.webglExtensions,
      fontCount:           ENV.fontCount,
      fontHash:            ENV.fontHash,
      canvasHash:          ENV.canvasHash,
      audioHash:           ENV.audioHash,
      devicePixelRatio:    ENV.devicePixelRatio,
      timezone:            ENV.timezone,
      fingerprintScore:    0,
      composite:           0,
    };

    s.fingerprintScore = fingerprintScore(s);
    s.composite        = computeComposite(s);
    return s;
  }

  // ── Send ──────────────────────────────────────────────────────────────────────

  function dispatchVerdict(result) {
    try {
      document.dispatchEvent(new CustomEvent('poh:verdict', {
        bubbles: true,
        detail: {
          sessionId: SESSION,
          score:     result.score,
          verdict:   result.verdict,
          flags:     result.flags || [],
          eventType: 'page_view',
        },
      }));
      if (typeof cfg.onVerdict === 'function') cfg.onVerdict(result);
    } catch(e) {}
  }

  function send(sig, keepalive) {
    var body = JSON.stringify({
      session_id:  SESSION,
      event_type:  'page_view',
      domain:      DOMAIN,
      referrer:    document.referrer || null,
      duration_ms: sig.sessionDurationMs,
      signals:     sig,
    });
    try {
      W.fetch(INGEST, {
        method:    'POST',
        headers:   { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN },
        body:      body,
        keepalive: !!keepalive,
      }).then(function(res) {
        if (res.ok) return res.json();
      }).then(function(data) {
        if (data) dispatchVerdict(data);
      }).catch(function(){});
    } catch(e) {}
  }

  // ── Scheduling ────────────────────────────────────────────────────────────────

  // Early send at 5s (gives time for interactions + audio var earlyFired = false;

var earlyFired = false;

var earlyTimer = W.setTimeout(function() {
  earlyFired = true;

  try {
    audioHash(function(h) {
      ENV.audioHash = h;

      try {
        send(buildSignals(), false);
      } catch (e) {
        console.error('[PoH] send failed', e);
      }
    });

    // Safari/WebKit fallback
    W.setTimeout(function() {
      try {
        send(buildSignals(), false);
      } catch (e) {}
    }, 1500);

  } catch (e) {
    console.error('[PoH] audioHash failed', e);

    try {
      send(buildSignals(), false);
    } catch (err) {}
  }
}, 5000);

    // Safari/WebKit fallback
    W.setTimeout(function() {
      try {
        send(buildSignals(), false);
      } catch (e) {}
    }, 1500);

  } catch (e) {
    console.error('[PoH] audioHash failed', e);

    try {
      send(buildSignals(), false);
    } catch (err) {}
  }
}, 5000);

  // Final send on page hide/unload
  function onHide() {
    if (!earlyFired) W.clearTimeout(earlyTimer);
    audioHash(function(h) {
      ENV.audioHash = h;
      send(buildSignals(), true);
    });
  }

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') onHide();
  });
  W.addEventListener('pagehide', onHide, { once: true });

}(window));
