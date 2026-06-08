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

  function warn(msg) {
    if (W.console) W.console.warn('[PoH] ' + msg);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // ── Event buffers ─────────────────────────────────────────────────────────────

  var mousePoints   = [];
  var keyTimes      = [];
  var scrollPos     = [];
  var allTimes      = [];
  var clickCount    = 0;
  var interactions  = 0;
  var firstMs       = null;

  function touch(t) {
    interactions++;

    if (firstMs === null) {
      firstMs = t - T0;
    }

    if (allTimes.length < 500) {
      allTimes.push(t);
    }
  }

  // ── Listeners ────────────────────────────────────────────────────────────────

  var lmx = -1;
  var lmy = -1;

  W.addEventListener('mousemove', function (e) {
    var t = Date.now();

    if (
      Math.abs(e.clientX - lmx) > 1 ||
      Math.abs(e.clientY - lmy) > 1
    ) {
      if (mousePoints.length < 300) {
        mousePoints.push({
          x: e.clientX,
          y: e.clientY
        });
      }

      lmx = e.clientX;
      lmy = e.clientY;
    }

    touch(t);
  }, { passive: true });

  W.addEventListener('keydown', function () {
    var t = Date.now();

    if (keyTimes.length < 200) {
      keyTimes.push(t);
    }

    touch(t);
  }, { passive: true });

  W.addEventListener('scroll', function () {
    var t = Date.now();

    if (scrollPos.length < 200) {
      scrollPos.push(W.scrollY || 0);
    }

    touch(t);
  }, { passive: true });

  W.addEventListener('click', function () {
    clickCount++;
    touch(Date.now());
  }, { passive: true });

  W.addEventListener('touchstart', function () {
    touch(Date.now());
  }, { passive: true });

  // ── Behavioral metrics ───────────────────────────────────────────────────────

  function mouseEntropy() {
    if (mousePoints.length < 10) {
      return mousePoints.length > 0 ? 0.35 : 0;
    }

    var b = [0,0,0,0,0,0,0,0];

    for (var i = 1; i < mousePoints.length; i++) {
      var dx = mousePoints[i].x - mousePoints[i - 1].x;
      var dy = mousePoints[i].y - mousePoints[i - 1].y;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        continue;
      }

      var ang = Math.atan2(dy, dx);

      b[Math.floor((ang + Math.PI) / (Math.PI / 4)) % 8]++;
    }

    var tot = 0;

    for (var j = 0; j < 8; j++) {
      tot += b[j];
    }

    if (!tot) {
      return 0;
    }

    var H = 0;
    var L2 = Math.LN2;

    for (var k = 0; k < 8; k++) {
      if (b[k]) {
        var p = b[k] / tot;
        H -= p * (Math.log(p) / L2);
      }
    }

    return clamp(H / 3, 0, 1);
  }

  function keystrokeCv() {
    if (keyTimes.length < 4) {
      return keyTimes.length > 0 ? 0.35 : 0;
    }

    var iv = [];

    for (var i = 1; i < keyTimes.length; i++) {
      iv.push(keyTimes[i] - keyTimes[i - 1]);
    }

    var mean = iv.reduce(function(a, b) {
      return a + b;
    }, 0) / iv.length;

    if (!mean) {
      return 0;
    }

    var sd = Math.sqrt(
      iv.reduce(function(s, v) {
        return s + Math.pow(v - mean, 2);
      }, 0) / iv.length
    );

    return clamp(sd / mean / 2, 0, 1);
  }

  function scrollVariance() {
    if (scrollPos.length < 3) {
      return scrollPos.length > 0 ? 0.35 : 0;
    }

    var d = [];

    for (var i = 1; i < scrollPos.length; i++) {
      d.push(Math.abs(scrollPos[i] - scrollPos[i - 1]));
    }

    var mean = d.reduce(function(a, b) {
      return a + b;
    }, 0) / d.length;

    var sd = Math.sqrt(
      d.reduce(function(s, v) {
        return s + Math.pow(v - mean, 2);
      }, 0) / d.length
    );

    return clamp(sd / 100, 0, 1);
  }

  function timingScore() {
    if (allTimes.length < 5) {
      return 0.5;
    }

    var iv = [];

    for (var i = 1; i < allTimes.length; i++) {
      var d = allTimes[i] - allTimes[i - 1];

      if (d > 0 && d < 10000) {
        iv.push(d);
      }
    }

    if (iv.length < 4) {
      return 0.5;
    }

    var mean = iv.reduce(function(a, b) {
      return a + b;
    }, 0) / iv.length;

    if (!mean) {
      return 0;
    }

    var sd = Math.sqrt(
      iv.reduce(function(s, v) {
        return s + Math.pow(v - mean, 2);
      }, 0) / iv.length
    );

    return clamp(sd / mean, 0, 1);
  }

  // ── Fingerprinting ───────────────────────────────────────────────────────────

  function canvasHash() {
    try {
      var c = document.createElement('canvas');

      c.width = 220;
      c.height = 30;

      var x = c.getContext('2d');

      if (!x) {
        return 0;
      }

      x.textBaseline = 'alphabetic';

      x.fillStyle = '#f0f';
      x.fillRect(10, 1, 100, 20);

      x.fillStyle = '#069';
      x.font = '11pt no-real-font,Arial';
      x.fillText('PoH \u2603 \u00e9', 2, 15);

      x.fillStyle = 'rgba(102,204,0,0.7)';
      x.font = '16pt Arial';
      x.fillText('PoH \u2603 \u00e9', 4, 20);

      var d = c.toDataURL().slice(22);
      var h = 0;

      for (var i = 0; i < Math.min(d.length, 600); i++) {
        h = ((h << 5) - h + d.charCodeAt(i)) | 0;
      }

      return h;

    } catch (e) {
      return 0;
    }
  }

  function audioHash(cb) {
    try {
      if (typeof W.OfflineAudioContext === 'undefined') {
        cb(0);
        return;
      }

      var ctx = new W.OfflineAudioContext(1, 44100, 44100);
      var osc = ctx.createOscillator();
      var cmp = ctx.createDynamicsCompressor();

      cmp.threshold.setValueAtTime(-50, 0);
      cmp.knee.setValueAtTime(40, 0);
      cmp.ratio.setValueAtTime(12, 0);
      cmp.attack.setValueAtTime(0, 0);
      cmp.release.setValueAtTime(0.25, 0);

      osc.connect(cmp);
      cmp.connect(ctx.destination);

      osc.start(0);

      ctx.oncomplete = function(e) {
        try {
          var d = e.renderedBuffer.getChannelData(0);
          var s = 0;

          for (var i = 4500; i < Math.min(d.length, 5000); i++) {
            s += Math.abs(d[i]);
          }

          cb(Math.round(s * 1e6) | 0);

        } catch (err) {
          cb(0);
        }
      };

      ctx.startRendering();

    } catch (e) {
      cb(0);
    }
  }

  // ── Environment ──────────────────────────────────────────────────────────────

  var nav = W.navigator || {};
  var scr = W.screen || {};

  var ENV = {
    isMobile: /Mobi|Android|iPhone|iPad/i.test(nav.userAgent || ''),
    hasWebdriver: !!nav.webdriver,
    pluginCount: (nav.plugins || []).length,
    hasLanguages: !!(nav.languages && nav.languages.length > 0),
    screenW: scr.width || 0,
    screenH: scr.height || 0,
    outerW: W.outerWidth || 0,
    outerH: W.outerHeight || 0,
    hardwareConcurrency: nav.hardwareConcurrency || 0,
    deviceMemory: 'deviceMemory' in nav ? nav.deviceMemory : -1,
    colorDepth: scr.colorDepth || 0,
    devicePixelRatio: W.devicePixelRatio || 1,
    hasTouchSupport: 'ontouchstart' in W || !!(nav.maxTouchPoints > 0),
    maxTouchPoints: nav.maxTouchPoints || 0,
    cookieEnabled: !!nav.cookieEnabled,
    canvasHash: 0,
    audioHash: 0,
    timezone:
      typeof Intl !== 'undefined' &&
      Intl.DateTimeFormat
        ? (Intl.DateTimeFormat().resolvedOptions().timeZone || '')
        : ''
  };

  // ── Build signals ────────────────────────────────────────────────────────────

  function buildSignals() {
    ENV.canvasHash = canvasHash();

    return {
      mouseEntropy: mouseEntropy(),
      keystrokeCv: keystrokeCv(),
      scrollVariance: scrollVariance(),
      timingScore: timingScore(),
      mouseEventCount: mousePoints.length,
      keystrokeCount: keyTimes.length,
      scrollEventCount: scrollPos.length,
      clickCount: clickCount,
      interactionCount: interactions,
      firstInteractMs: firstMs,
      sessionDurationMs: Date.now() - T0,
      isMobile: ENV.isMobile,
      hasWebdriver: ENV.hasWebdriver,
      pluginCount: ENV.pluginCount,
      hasLanguages: ENV.hasLanguages,
      screenW: ENV.screenW,
      screenH: ENV.screenH,
      outerW: ENV.outerW,
      outerH: ENV.outerH,
      hardwareConcurrency: ENV.hardwareConcurrency,
      deviceMemory: ENV.deviceMemory,
      colorDepth: ENV.colorDepth,
      hasTouchSupport: ENV.hasTouchSupport,
      maxTouchPoints: ENV.maxTouchPoints,
      cookieEnabled: ENV.cookieEnabled,
      canvasHash: ENV.canvasHash,
      audioHash: ENV.audioHash,
      devicePixelRatio: ENV.devicePixelRatio,
      timezone: ENV.timezone
    };
  }

  // ── Send ─────────────────────────────────────────────────────────────────────

  function dispatchVerdict(result) {
    try {
      document.dispatchEvent(new CustomEvent('poh:verdict', {
        bubbles: true,
        detail: {
          sessionId: SESSION,
          score: result.score,
          verdict: result.verdict,
          flags: result.flags || [],
          eventType: 'page_view'
        }
      }));

      if (typeof cfg.onVerdict === 'function') {
        cfg.onVerdict(result);
      }

    } catch (e) {}
  }

  function send(sig, keepalive) {
    var body = JSON.stringify({
      session_id: SESSION,
      event_type: 'page_view',
      domain: DOMAIN,
      referrer: document.referrer || null,
      duration_ms: sig.sessionDurationMs,
      signals: sig
    });

    try {
      W.fetch(INGEST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + TOKEN
        },
        body: body,
        keepalive: !!keepalive
      })
      .then(function(res) {
        if (res.ok) {
          return res.json();
        }
      })
      .then(function(data) {
        if (data) {
          dispatchVerdict(data);
        }
      })
      .catch(function(err) {
        console.error('[PoH] fetch failed', err);
      });

    } catch (e) {
      console.error('[PoH] send exception', e);
    }
  }

  // ── Scheduling ───────────────────────────────────────────────────────────────


      // Safari/WebKit fallback
      W.setTimeout(function() {
        try {
          send(buildSignals(), false);
        } catch (err) {}
      }, 1500);

    } catch (err) {
      console.error('[PoH] audioHash failed', err);

      try {
        send(buildSignals(), false);
      } catch (e) {}
    }

  }, 5000);

  // Final send on page hide/unload

  function onHide() {
    if (!earlyFired) {
      W.clearTimeout(earlyTimer);
    }

    try {
      audioHash(function(h) {
        ENV.audioHash = h;

        try {
          send(buildSignals(), true);
        } catch (err) {}
      });

      W.setTimeout(function() {
        try {
          send(buildSignals(), true);
        } catch (err) {}
      }, 1000);

    } catch (err) {
      try {
        send(buildSignals(), true);
      } catch (e) {}
    }
  }

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      onHide();
    }
  });

  W.addEventListener('pagehide', onHide, { once: true });

}(window));
