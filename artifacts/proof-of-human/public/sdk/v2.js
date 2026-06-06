/**
 * Proof of Human Browser SDK v2.1.0
 *
 * Collects behavioral + device fingerprint signals to distinguish humans from bots.
 *
 * Signals collected:
 *   Behavioral  — mouse entropy, keystroke cadence, scroll velocity variance, interaction timing
 *   Canvas      — GPU-rendered text/geometry hash (detects headless rendering pipelines)
 *   Font        — installed font enumeration via canvas width measurement (high entropy)
 *   WebGL       — GPU vendor/renderer + 12 capability parameters
 *   Hardware    — CPU cores, device memory, touch support, screen geometry, pixel ratio
 *   Network     — connection type, effective type, downlink estimate
 *   Battery     — charging state, level (bot VMs usually report 1.0 always)
 *   Media       — camera/mic device counts (real user agents enumerate these)
 *   Permissions — notification/camera/mic permission state
 *   Storage     — navigator.storage.estimate() quota
 *   Identity    — Webdriver flag, plugins, languages, chrome object, notification API presence
 */
(function (w, d) {
  'use strict';

  var cfg = w.PoH || {};
  var token = cfg.token;
  if (!token) return;

  var nav = w.navigator;
  var scr = w.screen || {};

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

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function isMobile() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(nav.userAgent || '');
  }

  // 32-bit FNV-1a hash over a string — fast, consistent across all browsers
  function fnv32a(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h >>> 0;
  }

  // ── Session identity ─────────────────────────────────────────────────────────

  var sidCookie = (d.cookie.match(/(?:^|;\s*)_poh_sid=([^;]+)/) || [])[1];
  var sessionId = cfg.sessionId || sidCookie || uuid();
  try {
    d.cookie = '_poh_sid=' + sessionId + '; path=/; max-age=1800; SameSite=Lax';
  } catch (e) {}

  var apiEndpoint = w.location.origin + '/api/ingest';

  // ── Accumulators ─────────────────────────────────────────────────────────────

  var mouse  = { moves: [], lastX: null, lastY: null, lastT: null };
  var keys   = { intervals: [], lastT: null };
  var scroll = { vels: [], lastY: 0, lastT: Date.now() };
  var timing = { loadT: Date.now(), firstT: null, count: 0 };
  var sent      = false;
  var clickCount = 0;

  // ── Listeners ─────────────────────────────────────────────────────────────────

  function markInteraction(t) {
    if (!timing.firstT) timing.firstT = t;
    timing.count++;
  }

  d.addEventListener('mousemove', function (e) {
    var t = Date.now();
    var x = e.clientX, y = e.clientY;
    if (mouse.lastX !== null && mouse.moves.length < 400) {
      var dx = x - mouse.lastX, dy = y - mouse.lastY, dt = t - mouse.lastT;
      if (dt > 0 && (Math.abs(dx) + Math.abs(dy)) > 1)
        mouse.moves.push({ dx: dx, dy: dy, dt: dt });
    }
    mouse.lastX = x; mouse.lastY = y; mouse.lastT = t;
    markInteraction(t);
  }, { passive: true });

  d.addEventListener('keydown', function () {
    var t = Date.now();
    if (keys.lastT !== null && t - keys.lastT < 5000 && keys.intervals.length < 200)
      keys.intervals.push(t - keys.lastT);
    keys.lastT = t;
    markInteraction(t);
  }, { passive: true });

  w.addEventListener('scroll', function () {
    var t = Date.now(), y = w.scrollY || w.pageYOffset || 0;
    var dt = t - scroll.lastT;
    if (dt > 0 && dt < 1000 && scroll.vels.length < 200)
      scroll.vels.push(Math.abs(y - scroll.lastY) / dt);
    scroll.lastY = y; scroll.lastT = t;
    markInteraction(t);
  }, { passive: true });

  d.addEventListener('click',      function () { clickCount++; markInteraction(Date.now()); }, { passive: true });
  d.addEventListener('touchstart', function () { markInteraction(Date.now()); }, { passive: true });

  // ── Signal scorers ───────────────────────────────────────────────────────────

  function scoreMouseEntropy() {
    var moves = mouse.moves;
    if (moves.length < 8) return moves.length === 0 ? 0.05 : 0.2;
    var bins = [0,0,0,0,0,0,0,0], speeds = [];
    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      var angle = Math.atan2(m.dy, m.dx);
      bins[Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 8) % 8]++;
      speeds.push(Math.sqrt(m.dx*m.dx + m.dy*m.dy) / m.dt);
    }
    var n = moves.length, entropy = 0;
    for (var j = 0; j < 8; j++) {
      if (bins[j] > 0) { var p = bins[j]/n; entropy -= p * Math.log2(p); }
    }
    var entropyScore = clamp(entropy / 3, 0, 1);
    var sm = mean(speeds);
    var speedScore = sm > 0 ? clamp(stddev(speeds, sm) / sm * 1.5, 0, 1) : 0;
    var dirChanges = 0;
    for (var k = 1; k < moves.length; k++) {
      var diff = Math.abs(Math.atan2(moves[k].dy, moves[k].dx) - Math.atan2(moves[k-1].dy, moves[k-1].dx));
      if (diff > 0.3) dirChanges++;
    }
    var dirScore = clamp(dirChanges / moves.length * 1.5, 0, 1);
    return clamp(entropyScore*0.5 + speedScore*0.3 + dirScore*0.2, 0, 1);
  }

  function scoreKeystrokeCadence() {
    var ivs = keys.intervals;
    if (ivs.length < 3) return 0.5;
    var m = mean(ivs);
    if (m === 0) return 0;
    return clamp(stddev(ivs, m) / m / 0.45, 0, 1);
  }

  function scoreScrollPattern() {
    var vels = scroll.vels;
    if (vels.length < 3) return 0.4;
    var m = mean(vels);
    if (m === 0) return 0.4;
    return clamp(stddev(vels, m) / m / 0.7, 0, 1);
  }

  function scoreTimingPattern() {
    if (!timing.firstT) return 0.15;
    var delay = timing.firstT - timing.loadT;
    if (delay < 50)    return 0.05;
    if (delay < 150)   return 0.4;
    if (delay < 500)   return 0.75;
    if (delay < 15000) return 1.0;
    return 0.7;
  }

  // ── Canvas fingerprint ───────────────────────────────────────────────────────

  function canvasFingerprint() {
    try {
      var c = d.createElement('canvas');
      c.width = 280; c.height = 60;
      var ctx = c.getContext('2d');
      if (!ctx) return { hash: 0, blank: true };

      // Layer 1: gradient background
      var grad = ctx.createLinearGradient(0, 0, 280, 0);
      grad.addColorStop(0, '#f00'); grad.addColorStop(0.5, '#0f0'); grad.addColorStop(1, '#00f');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 280, 60);

      // Layer 2: emoji + non-ASCII text (font rendering is GPU/OS specific)
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#069'; ctx.font = '11pt no-real-font,Arial,sans-serif';
      ctx.fillText('PoH \u2603 \u00e9 \u00e0', 2, 18);
      ctx.fillStyle = 'rgba(102,204,0,0.85)'; ctx.font = '18pt Georgia,serif';
      ctx.fillText('Proof\u2122', 4, 44);

      // Layer 3: geometric shapes (sub-pixel rendering differences)
      ctx.beginPath();
      ctx.arc(240, 30, 18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,128,0,0.6)'; ctx.fill();
      ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.stroke();

      var url = c.toDataURL('image/png');
      var dataStr = url.slice(22);
      return {
        hash:  fnv32a(dataStr),
        blank: url.length < 200,
      };
    } catch (e) {
      return { hash: 0, blank: false };
    }
  }

  // ── Font enumeration ─────────────────────────────────────────────────────────
  //
  // Technique: render a test string in a probe font, measure its width.
  // If width != baseline (monospace/sans-serif), the font is installed.
  // Only measures — never reads pixel data — so no canvas fingerprinting CSP issues.

  var FONT_PROBE_TEXT  = 'mmmmmmmmmmlli';
  var FONT_PROBE_SIZE  = '72px';
  var FONT_BASELINES   = ['monospace', 'sans-serif', 'serif'];
  var PROBE_FONTS = [
    'Arial', 'Arial Black', 'Arial Narrow', 'Calibri', 'Cambria', 'Comic Sans MS',
    'Courier New', 'Georgia', 'Gill Sans', 'Helvetica', 'Impact', 'Lucida Console',
    'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype', 'Segoe UI',
    'Tahoma', 'Times New Roman', 'Trebuchet MS', 'Verdana',
    'Apple Chancery', 'Apple Color Emoji', 'Helvetica Neue', 'Menlo', 'Monaco',
    'San Francisco', 'SF Pro Display', 'Optima', 'Futura',
    'Droid Sans', 'Roboto', 'Noto Sans', 'Ubuntu', 'DejaVu Sans', 'Liberation Sans',
    'Source Code Pro', 'Fira Code', 'JetBrains Mono',
    'MS Gothic', 'MS PGothic', 'MS UI Gothic', 'Meiryo', 'Yu Gothic',
    'SimSun', 'SimHei', 'Microsoft YaHei',
    'Malgun Gothic', 'Gulim', 'Dotum',
  ];

  function detectFonts() {
    try {
      var el = d.createElement('span');
      el.style.cssText = 'position:absolute;top:-9999px;left:-9999px;visibility:hidden;' +
        'font-size:' + FONT_PROBE_SIZE + ';';
      el.textContent = FONT_PROBE_TEXT;
      d.body.appendChild(el);

      // Measure baseline widths for each fallback family
      var baseW = {};
      for (var b = 0; b < FONT_BASELINES.length; b++) {
        el.style.fontFamily = FONT_BASELINES[b];
        baseW[FONT_BASELINES[b]] = el.offsetWidth;
      }

      var found = [];
      for (var i = 0; i < PROBE_FONTS.length; i++) {
        var f = PROBE_FONTS[i];
        el.style.fontFamily = '"' + f + '",' + FONT_BASELINES[0];
        var w1 = el.offsetWidth;
        el.style.fontFamily = '"' + f + '",' + FONT_BASELINES[1];
        var w2 = el.offsetWidth;
        // Font is present if it makes at least one baseline measure differently
        if (w1 !== baseW[FONT_BASELINES[0]] || w2 !== baseW[FONT_BASELINES[1]]) {
          found.push(f);
        }
      }
      d.body.removeChild(el);
      return { count: found.length, hash: fnv32a(found.join(',')) };
    } catch (e) {
      return { count: 0, hash: 0 };
    }
  }

  // ── WebGL fingerprint ─────────────────────────────────────────────────────────

  function webglFingerprint() {
    var result = {
      vendor: '', renderer: '', version: '',
      maxTextureSize: 0, maxViewportDims: '',
      maxVertexAttribs: 0, maxFragmentUniforms: 0,
      aliasedLineWidthRange: '', aliasedPointSizeRange: '',
      extensions: 0,
      isSoftware: false,
    };
    try {
      var c = d.createElement('canvas');
      var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return result;

      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      result.vendor   = ext ? (gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)   || '') : (gl.getParameter(gl.VENDOR)   || '');
      result.renderer = ext ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '') : (gl.getParameter(gl.RENDERER) || '');
      result.version  = gl.getParameter(gl.VERSION) || '';

      result.maxTextureSize     = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
      result.maxVertexAttribs   = gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 0;
      result.maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 0;

      var vd = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      result.maxViewportDims = vd ? (vd[0] + 'x' + vd[1]) : '';

      var alw = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE);
      result.aliasedLineWidthRange = alw ? (alw[0] + '-' + alw[1]) : '';

      var aps = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE);
      result.aliasedPointSizeRange = aps ? (aps[0] + '-' + aps[1]) : '';

      result.extensions = (gl.getSupportedExtensions() || []).length;
      result.isSoftware = /SwiftShader|llvmpipe|Software|Microsoft Basic/i.test(result.renderer + result.vendor);
    } catch (e) {}
    return result;
  }

  // ── Browser fingerprint score ─────────────────────────────────────────────────

  function scoreBrowserFingerprint(wgl, canvas) {
    var score = 1.0;
    if (nav.webdriver === true)                                   score -= 0.75;
    if (!isMobile() && nav.plugins && nav.plugins.length === 0)  score -= 0.25;
    if (!nav.languages || nav.languages.length === 0)            score -= 0.2;
    if (w.outerWidth === 0 || w.outerHeight === 0)               score -= 0.2;
    if (nav.userAgent.indexOf('Chrome') > -1 && typeof w.chrome === 'undefined') score -= 0.2;
    if (scr.width === 800 && scr.height === 600)                 score -= 0.1;
    if (canvas.blank)                                            score -= 0.15;
    if (canvas.hash === 0 && !canvas.blank)                      score -= 0.05;
    if (wgl.isSoftware)                                          score -= 0.4;
    if (typeof w.Notification === 'undefined')                   score -= 0.05;
    return clamp(score, 0, 1);
  }

  // ── Async hardware / permission signals ───────────────────────────────────────

  var extras = {
    batteryCharging: null,
    batteryLevel: null,
    connectionType: '',
    connectionEffectiveType: '',
    connectionDownlink: -1,
    mediaAudioInputs: -1,
    mediaVideoInputs: -1,
    storageQuota: -1,
    permNotification: '',
    permCamera: '',
    permMicrophone: '',
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: 'deviceMemory' in nav ? nav.deviceMemory : -1,
    devicePixelRatio: w.devicePixelRatio || 1,
    colorDepth: scr.colorDepth || 0,
    maxTouchPoints: nav.maxTouchPoints || 0,
  };

  // Connection info (synchronous)
  try {
    var conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (conn) {
      extras.connectionType          = conn.type || '';
      extras.connectionEffectiveType = conn.effectiveType || '';
      extras.connectionDownlink      = conn.downlink != null ? conn.downlink : -1;
    }
  } catch (e) {}

  // Battery (async, best-effort)
  if (nav.getBattery) {
    try {
      nav.getBattery().then(function (b) {
        extras.batteryCharging = b.charging;
        extras.batteryLevel    = Math.round(b.level * 100);
      }).catch(function () {});
    } catch (e) {}
  }

  // Media devices (async, best-effort)
  if (nav.mediaDevices && nav.mediaDevices.enumerateDevices) {
    try {
      nav.mediaDevices.enumerateDevices().then(function (devs) {
        var audio = 0, video = 0;
        for (var i = 0; i < devs.length; i++) {
          if (devs[i].kind === 'audioinput') audio++;
          if (devs[i].kind === 'videoinput') video++;
        }
        extras.mediaAudioInputs = audio;
        extras.mediaVideoInputs = video;
      }).catch(function () {});
    } catch (e) {}
  }

  // Storage estimate (async, best-effort)
  if (nav.storage && nav.storage.estimate) {
    try {
      nav.storage.estimate().then(function (est) {
        extras.storageQuota = est.quota ? Math.round(est.quota / 1048576) : -1; // MB
      }).catch(function () {});
    } catch (e) {}
  }

  // Permissions API (async, best-effort)
  if (nav.permissions && nav.permissions.query) {
    var queryPerm = function (name, key) {
      try {
        nav.permissions.query({ name: name }).then(function (r) {
          extras[key] = r.state;
        }).catch(function () {});
      } catch (e) {}
    };
    queryPerm('notifications', 'permNotification');
    queryPerm('camera',        'permCamera');
    queryPerm('microphone',    'permMicrophone');
  }

  // ── Composite score ───────────────────────────────────────────────────────────

  function computeSignals() {
    var canvas  = canvasFingerprint();
    var fonts   = detectFonts();
    var wgl     = webglFingerprint();
    var fpScore = scoreBrowserFingerprint(wgl, canvas);

    var mouseScore  = scoreMouseEntropy();
    var keyScore    = scoreKeystrokeCadence();
    var scrollScore = scoreScrollPattern();
    var timingScore_ = scoreTimingPattern();

    var composite = (
      mouseScore   * 0.25 +
      keyScore     * 0.15 +
      scrollScore  * 0.15 +
      timingScore_ * 0.10 +
      fpScore      * 0.35
    );

    if (nav.webdriver === true) composite = Math.min(composite, 0.08);
    if (fpScore < 0.15)         composite = Math.min(composite, 0.25);
    if (wgl.isSoftware)         composite = Math.min(composite, 0.20);

    return {
      // Scores
      composite:        parseFloat(clamp(composite, 0, 1).toFixed(4)),
      mouseEntropy:     parseFloat(mouseScore.toFixed(4)),
      keystrokeCv:      parseFloat(keyScore.toFixed(4)),
      scrollVariance:   parseFloat(scrollScore.toFixed(4)),
      timingScore:      parseFloat(timingScore_.toFixed(4)),
      fingerprintScore: parseFloat(fpScore.toFixed(4)),

      // Raw event counts
      mouseEventCount:   mouse.moves.length,
      keystrokeCount:    keys.intervals.length,
      scrollEventCount:  scroll.vels.length,
      interactionCount:  timing.count,
      firstInteractMs:   timing.firstT ? timing.firstT - timing.loadT : null,
      sessionDurationMs: Date.now() - timing.loadT,
      clickCount:        0,

      // Canvas
      canvasHash:  canvas.hash,
      canvasBlank: canvas.blank,

      // Font enumeration
      fontCount: fonts.count,
      fontHash:  fonts.hash,

      // WebGL
      webglVendor:              wgl.vendor,
      webglRenderer:            wgl.renderer,
      webglVersion:             wgl.version,
      webglMaxTextureSize:      wgl.maxTextureSize,
      webglMaxViewportDims:     wgl.maxViewportDims,
      webglMaxVertexAttribs:    wgl.maxVertexAttribs,
      webglMaxFragmentUniforms: wgl.maxFragmentUniforms,
      webglExtensions:          wgl.extensions,
      webglIsSoftware:          wgl.isSoftware,

      // Browser identity
      isMobile:            isMobile(),
      hasWebdriver:        nav.webdriver === true,
      pluginCount:         nav.plugins ? nav.plugins.length : 0,
      hasLanguages:        !!(nav.languages && nav.languages.length > 0),
      languages:           nav.languages ? Array.prototype.slice.call(nav.languages, 0, 5).join(',') : '',
      userAgent:           nav.userAgent || '',
      cookieEnabled:       !!nav.cookieEnabled,

      // Screen + hardware
      screenW:             scr.width  || 0,
      screenH:             scr.height || 0,
      outerW:              w.outerWidth  || 0,
      outerH:              w.outerHeight || 0,
      devicePixelRatio:    extras.devicePixelRatio,
      colorDepth:          extras.colorDepth,
      hardwareConcurrency: extras.hardwareConcurrency,
      deviceMemory:        extras.deviceMemory,
      maxTouchPoints:      extras.maxTouchPoints,
      hasTouchSupport:     'ontouchstart' in w || extras.maxTouchPoints > 0,

      // Network
      connectionType:          extras.connectionType,
      connectionEffectiveType: extras.connectionEffectiveType,
      connectionDownlink:      extras.connectionDownlink,

      // Battery (populated async before send fires at 6s)
      batteryCharging: extras.batteryCharging,
      batteryLevel:    extras.batteryLevel,

      // Media
      mediaAudioInputs: extras.mediaAudioInputs,
      mediaVideoInputs: extras.mediaVideoInputs,

      // Storage
      storageQuotaMb: extras.storageQuota,

      // Permissions
      permNotification: extras.permNotification,
      permCamera:       extras.permCamera,
      permMicrophone:   extras.permMicrophone,

      // Timezone
      timezone: typeof Intl !== 'undefined' && Intl.DateTimeFormat
        ? (Intl.DateTimeFormat().resolvedOptions().timeZone || '') : '',
    };
  }

  // ── Beacon sender ─────────────────────────────────────────────────────────────

  function sendBeacon() {
    if (sent) return;
    sent = true;

    var signals = computeSignals();
    var payload = JSON.stringify({
      session_id:  sessionId,
      domain:      w.location.hostname,
      event_type:  'page_view',
      referrer:    d.referrer || null,
      duration_ms: signals.sessionDurationMs,
      signals:     signals,
    });

    try {
      fetch(apiEndpoint, {
        method:    'POST',
        headers:   { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body:      payload,
        keepalive: true,
      });
    } catch (e) {}
  }

  // Defer 6 s to let async signals (battery, permissions, media) populate
  setTimeout(sendBeacon, 6000);
  w.addEventListener('pagehide',     sendBeacon);
  w.addEventListener('beforeunload', sendBeacon);

  // ── Public API ────────────────────────────────────────────────────────────────

  w.PoH = w.PoH || {};
  w.PoH.sessionId = sessionId;
  w.PoH.send      = sendBeacon;
  w.PoH.inspect   = computeSignals;

})(window, document);
