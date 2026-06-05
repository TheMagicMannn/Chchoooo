/**
 * Proof of Human Browser SDK v2.0.0
 * Captures behavioral signals to distinguish humans from bots.
 * Signals: mouse entropy, keystroke cadence, scroll patterns, browser fingerprint, timing.
 */
(function (w, d) {
  'use strict';

  var cfg = w.PoH || {};
  var token = cfg.token;
  if (!token) {
    return;
  }

  var nav = w.navigator;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function uuid() {
    if (w.crypto && w.crypto.randomUUID) return w.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
  }

  function stddev(arr, m) {
    if (arr.length < 2) return 0;
    var avg = m !== undefined ? m : mean(arr);
    var variance = arr.reduce(function (a, v) { return a + (v - avg) * (v - avg); }, 0) / arr.length;
    return Math.sqrt(variance);
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // ── Session Identity ─────────────────────────────────────────────────────────

  var sidCookie = (d.cookie.match(/(?:^|;\s*)_poh_sid=([^;]+)/) || [])[1];
  var sessionId = cfg.sessionId || sidCookie || uuid();
  try {
    d.cookie = '_poh_sid=' + sessionId + '; path=/; max-age=1800; SameSite=Lax';
  } catch (e) {}

  var apiEndpoint = cfg.endpoint ||
    (w.location.origin + (w.location.pathname.split('/').slice(0, -1).join('/') || '') + '/api/ingest');
  // Normalise to always hit /api/ingest regardless of page depth
  apiEndpoint = w.location.origin + '/api/ingest';

  // ── Accumulators ─────────────────────────────────────────────────────────────

  var mouse = { moves: [], lastX: null, lastY: null, lastT: null };
  var keys  = { intervals: [], lastT: null };
  var scrollAcc = { vels: [], lastY: 0, lastT: Date.now() };
  var timing = { loadT: Date.now(), firstT: null, count: 0 };
  var sent = false;

  // ── Event Listeners ──────────────────────────────────────────────────────────

  function markInteraction(t) {
    if (!timing.firstT) timing.firstT = t;
    timing.count++;
  }

  function onMouseMove(e) {
    var t = Date.now();
    var x = e.clientX, y = e.clientY;
    if (mouse.lastX !== null && mouse.moves.length < 400) {
      var dx = x - mouse.lastX;
      var dy = y - mouse.lastY;
      var dt = t - mouse.lastT;
      if (dt > 0 && (Math.abs(dx) + Math.abs(dy)) > 1) {
        mouse.moves.push({ dx: dx, dy: dy, dt: dt });
      }
    }
    mouse.lastX = x; mouse.lastY = y; mouse.lastT = t;
    markInteraction(t);
  }

  function onKeyDown() {
    var t = Date.now();
    if (keys.lastT !== null && t - keys.lastT < 5000) {
      if (keys.intervals.length < 200) keys.intervals.push(t - keys.lastT);
    }
    keys.lastT = t;
    markInteraction(t);
  }

  function onScroll() {
    var t = Date.now();
    var y = w.scrollY || w.pageYOffset || 0;
    var dt = t - scrollAcc.lastT;
    if (dt > 0 && dt < 1000 && scrollAcc.vels.length < 200) {
      scrollAcc.vels.push(Math.abs(y - scrollAcc.lastY) / dt);
    }
    scrollAcc.lastY = y; scrollAcc.lastT = t;
    markInteraction(t);
  }

  d.addEventListener('mousemove', onMouseMove, { passive: true });
  d.addEventListener('keydown', onKeyDown, { passive: true });
  w.addEventListener('scroll', onScroll, { passive: true });
  d.addEventListener('click', function () { markInteraction(Date.now()); }, { passive: true });
  d.addEventListener('touchstart', function () { markInteraction(Date.now()); }, { passive: true });

  // ── Signal Scorers ───────────────────────────────────────────────────────────

  /**
   * Mouse trajectory entropy score.
   * Humans produce high-entropy curved paths; bots move in straight lines or not at all.
   * Returns 0.0–1.0 (higher = more human).
   */
  function scoreMouseEntropy() {
    var moves = mouse.moves;
    if (moves.length < 8) return moves.length === 0 ? 0.05 : 0.2;

    // Angle distribution across 8 octants
    var bins = [0, 0, 0, 0, 0, 0, 0, 0];
    var speeds = [];
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      var angle = Math.atan2(m.dy, m.dx); // -π … π
      var bin = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 8) % 8;
      bins[bin]++;
      speeds.push(Math.sqrt(m.dx * m.dx + m.dy * m.dy) / m.dt);
    }

    // Shannon entropy (max = log2(8) = 3)
    var n = moves.length;
    var entropy = 0;
    for (var j = 0; j < 8; j++) {
      if (bins[j] > 0) {
        var p = bins[j] / n;
        entropy -= p * Math.log2(p);
      }
    }
    var entropyScore = clamp(entropy / 3, 0, 1);

    // Speed variability — bots often move at constant velocity
    var speedMean = mean(speeds);
    var speedCv = speedMean > 0 ? stddev(speeds, speedMean) / speedMean : 0;
    var speedScore = clamp(speedCv * 1.5, 0, 1);

    // Direction change frequency (humans change direction often)
    var dirChanges = 0;
    for (var k = 1; k < moves.length; k++) {
      var prevAngle = Math.atan2(moves[k - 1].dy, moves[k - 1].dx);
      var currAngle = Math.atan2(moves[k].dy, moves[k].dx);
      var diff = Math.abs(currAngle - prevAngle);
      if (diff > 0.3) dirChanges++;
    }
    var dirScore = clamp(dirChanges / moves.length * 1.5, 0, 1);

    return clamp(entropyScore * 0.5 + speedScore * 0.3 + dirScore * 0.2, 0, 1);
  }

  /**
   * Keystroke cadence score.
   * Humans have high inter-key interval variance (CV ≥ 0.3); bots are uniform (CV ≈ 0).
   */
  function scoreKeystrokeCadence() {
    var ivs = keys.intervals;
    if (ivs.length < 3) return 0.5; // not enough data → neutral
    var m = mean(ivs);
    if (m === 0) return 0.0;
    var cv = stddev(ivs, m) / m;
    // A CV of ≥ 0.4 is very human-like
    return clamp(cv / 0.45, 0, 1);
  }

  /**
   * Scroll velocity score.
   * Humans accelerate/decelerate naturally; bots scroll at constant velocity.
   */
  function scoreScrollPattern() {
    var vels = scrollAcc.vels;
    if (vels.length < 3) return 0.4; // neutral
    var m = mean(vels);
    if (m === 0) return 0.4;
    var cv = stddev(vels, m) / m;
    return clamp(cv / 0.7, 0, 1);
  }

  /**
   * Interaction timing score.
   * Very fast first interactions are bot-like; natural human delays score higher.
   */
  function scoreTimingPattern() {
    if (!timing.firstT) return 0.15; // zero interaction
    var delay = timing.firstT - timing.loadT;
    if (delay < 50)   return 0.05; // impossibly fast
    if (delay < 150)  return 0.4;
    if (delay < 500)  return 0.75;
    if (delay < 15000) return 1.0;  // normal human range
    return 0.7; // very slow but plausible
  }

  /**
   * Browser fingerprint score.
   * Checks for headless browser signals: webdriver, missing plugins, SwiftShader WebGL, etc.
   */
  function scoreBrowserFingerprint() {
    var score = 1.0;

    // Webdriver property — definitive headless signal
    if (nav.webdriver === true) score -= 0.75;

    // Plugins: headless Chrome / Node environments have 0
    var isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent);
    if (!isMobile && nav.plugins && nav.plugins.length === 0) score -= 0.25;

    // Language array: automation often omits this
    if (!nav.languages || nav.languages.length === 0) score -= 0.2;

    // Window geometry: headless Chrome has outerWidth === 0
    if (w.outerWidth === 0 || w.outerHeight === 0) score -= 0.2;

    // Chrome object: present in real Chrome, absent in Puppeteer by default
    var isChromaUA = nav.userAgent.indexOf('Chrome') > -1;
    if (isChromaUA && typeof w.chrome === 'undefined') score -= 0.2;

    // Headless default viewport fingerprint
    if (w.screen && w.screen.width === 800 && w.screen.height === 600) score -= 0.1;

    // Canvas rendering check: headless often produces blank or deterministic output
    try {
      var c = d.createElement('canvas');
      var ctx = c.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('PoH\u2603', 2, 15);
        var dataURL = c.toDataURL();
        // Completely blank canvas is a red flag
        if (dataURL === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' || dataURL.length < 1000) {
          score -= 0.15;
        }
      }
    } catch (e) {
      score -= 0.05;
    }

    // WebGL renderer: SwiftShader and llvmpipe indicate headless
    try {
      var gc = d.createElement('canvas');
      var gl = gc.getContext('webgl') || gc.getContext('experimental-webgl');
      if (gl) {
        var ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          var renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
          var vendor   = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)   || '';
          if (/SwiftShader|llvmpipe|Software|Microsoft Basic/i.test(renderer + vendor)) {
            score -= 0.4;
          }
        }
      }
    } catch (e) {}

    // Notification permission: automation often doesn't have Notification API
    if (typeof w.Notification === 'undefined') score -= 0.05;

    return clamp(score, 0, 1);
  }

  // ── Composite Score ──────────────────────────────────────────────────────────

  function computeSignals() {
    var mouseScore  = scoreMouseEntropy();
    var keyScore    = scoreKeystrokeCadence();
    var scrollScore = scoreScrollPattern();
    var timingScore = scoreTimingPattern();
    var fpScore     = scoreBrowserFingerprint();

    // Weighted composite — fingerprint and mouse are most discriminative
    var composite = (
      mouseScore  * 0.28 +
      keyScore    * 0.17 +
      scrollScore * 0.17 +
      timingScore * 0.12 +
      fpScore     * 0.26
    );

    // Hard caps for definitive headless signals
    if (nav.webdriver === true) composite = Math.min(composite, 0.08);
    if (fpScore < 0.15)        composite = Math.min(composite, 0.25);

    return {
      composite:      parseFloat(clamp(composite, 0, 1).toFixed(4)),
      mouseEntropy:   parseFloat(mouseScore.toFixed(4)),
      keystrokeCv:    parseFloat(keyScore.toFixed(4)),
      scrollVariance: parseFloat(scrollScore.toFixed(4)),
      timingScore:    parseFloat(timingScore.toFixed(4)),
      fingerprintScore: parseFloat(fpScore.toFixed(4)),
      // Raw counts for server-side validation
      mouseEventCount:    mouse.moves.length,
      keystrokeCount:     keys.intervals.length,
      scrollEventCount:   scrollAcc.vels.length,
      interactionCount:   timing.count,
      firstInteractMs:    timing.firstT ? timing.firstT - timing.loadT : null,
      sessionDurationMs:  Date.now() - timing.loadT,
      // Environment facts
      isMobile:     isMobile(),
      hasWebdriver: nav.webdriver === true,
      pluginCount:  nav.plugins ? nav.plugins.length : 0,
      hasLanguages: !!(nav.languages && nav.languages.length > 0),
      screenW:      (w.screen && w.screen.width)  || 0,
      screenH:      (w.screen && w.screen.height) || 0,
      outerW:       w.outerWidth  || 0,
      outerH:       w.outerHeight || 0
    };
  }

  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent);
  }

  // ── Beacon Sender ────────────────────────────────────────────────────────────

  function sendBeacon() {
    if (sent) return;
    sent = true;

    var signals = computeSignals();

    var payload = JSON.stringify({
      session_id:   sessionId,
      domain:       w.location.hostname,
      event_type:   'page_view',
      referrer:     d.referrer || null,
      user_agent:   nav.userAgent,
      duration_ms:  signals.sessionDurationMs,
      signals:      signals
    });

    // keepalive: works even during page unload
    try {
      fetch(apiEndpoint, {
        method:    'POST',
        headers:   { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body:      payload,
        keepalive: true
      });
    } catch (e) {}
  }

  // Send after 6 seconds of page activity
  var beaconTimer = setTimeout(sendBeacon, 6000);

  // Also fire on page exit
  w.addEventListener('pagehide',      sendBeacon);
  w.addEventListener('beforeunload',  sendBeacon);

  // ── Public API ───────────────────────────────────────────────────────────────

  w.PoH = w.PoH || {};
  w.PoH.sessionId = sessionId;
  w.PoH.send      = sendBeacon;         // manual trigger
  w.PoH.inspect   = computeSignals;    // debug helper

})(window, document);
