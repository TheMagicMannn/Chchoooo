/**
 * Proof of Human — Server-Side Scoring Engine
 *
 * Combines client-side SDK signals with server-side heuristics
 * to produce a final human probability score (0.0 = bot, 1.0 = human).
 *
 * Signal pipeline:
 *   Browser SDK → signals{}  →  scoreSdkSignals()  ─┐
 *   HTTP User-Agent header   →  scoreUserAgent()   ──┤→ computeScore() → { score, verdict, flags, factors }
 *   Referrer / domain        →  scoreNetworkContext()─┘
 */

export interface SdkSignals {
  // ── Behavioral (computed by SDK) ─────────────────────────────────────────────
  composite:           number;   // client's weighted composite (0–1)
  mouseEntropy:        number;   // direction-entropy of mouse paths (0–1)
  keystrokeCv:         number;   // coefficient of variation of key intervals (0–1)
  scrollVariance:      number;   // variance of scroll increment sizes (0–1)
  timingScore:         number;   // event-timing irregularity (0=robotic, 1=human)
  fingerprintScore:    number;   // client-side env fingerprint pass rate (0–1)

  // ── Counts ───────────────────────────────────────────────────────────────────
  mouseEventCount:     number;
  keystrokeCount:      number;
  scrollEventCount:    number;
  clickCount:          number;   // mouse/touch click events
  interactionCount:    number;   // any interaction event total

  // ── Timing ───────────────────────────────────────────────────────────────────
  firstInteractMs:     number | null;   // ms from page load to first interaction
  sessionDurationMs:   number;

  // ── Browser environment ───────────────────────────────────────────────────────
  isMobile:            boolean;
  hasWebdriver:        boolean;   // navigator.webdriver === true
  pluginCount:         number;    // navigator.plugins.length
  hasLanguages:        boolean;   // navigator.languages.length > 0
  screenW:             number;
  screenH:             number;
  outerW:              number;    // window.outerWidth (0 in headless Chrome)
  outerH:              number;
  hardwareConcurrency: number;    // navigator.hardwareConcurrency
  deviceMemory:        number;    // navigator.deviceMemory, -1 if unsupported
  colorDepth:          number;    // screen.colorDepth
  hasTouchSupport:     boolean;
  maxTouchPoints:      number;
  cookieEnabled:       boolean;

  // ── Fingerprints ─────────────────────────────────────────────────────────────
  webglVendor:         string;    // e.g. "Google Inc. (Intel)"
  webglRenderer:       string;    // e.g. "ANGLE (Intel...)" vs "SwiftShader"
  canvasHash:          number;    // pixel-data hash of canvas fingerprint draw
  audioHash:           number;    // OfflineAudioContext output hash
  timezone:            string;    // Intl timezone string
}

export interface ScoreResult {
  score:   number;
  verdict: 'HUMAN' | 'CAPTCHA' | 'BOT';
  factors: Record<string, number>;
  flags:   string[];
}

// ── Utility ───────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, v));
}

// ── User-Agent Analysis ───────────────────────────────────────────────────────

const HEADLESS_UA_PATTERNS = [
  /HeadlessChrome/i, /PhantomJS/i, /SlimerJS/i, /Nightmare/i,
  /selenium/i, /webdriver/i, /puppeteer/i, /playwright/i, /cypress/i,
  /python-requests/i, /go-http-client/i, /curl\//i, /wget\//i,
  /libwww-perl/i, /scrapy/i, /axios\//i, /node-fetch/i,
  /java\//i, /okhttp\//i,
];

const SUSPICIOUS_UA_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /scraper/i, /fetch/i, /http-client/i, /scan/i,
];

function scoreUserAgent(ua: string | undefined | null): { score: number; flags: string[] } {
  const flags: string[] = [];

  if (!ua || ua.trim() === '') {
    flags.push('missing_user_agent');
    return { score: 0.02, flags };
  }

  for (const p of HEADLESS_UA_PATTERNS) {
    if (p.test(ua)) {
      flags.push('headless_ua:' + p.source.toLowerCase().replace(/\\\//g, '/').replace(/[/\\^$*+?.()|[\]{}]/g, ''));
      return { score: 0.03, flags };
    }
  }

  for (const p of SUSPICIOUS_UA_PATTERNS) {
    if (p.test(ua)) {
      flags.push('suspicious_ua');
      return { score: 0.2, flags };
    }
  }

  if (ua.length < 20) {
    flags.push('short_user_agent');
    return { score: 0.25, flags };
  }

  return { score: 1.0, flags };
}

// ── SDK Signal Scoring ────────────────────────────────────────────────────────

const SOFTWARE_RENDERERS = ['swiftshader', 'llvmpipe', 'mesa offscreen', 'softpipe', 'virgl'];

function scoreSdkSignals(signals: Partial<SdkSignals>): { score: number; flags: string[] } {
  const flags: string[] = [];

  // ── Hard failures (return immediately, score near zero) ─────────────────────

  if (signals.hasWebdriver === true) {
    flags.push('webdriver_detected');
    return { score: 0.02, flags };
  }

  const renderer = (signals.webglRenderer ?? '').toLowerCase();
  if (renderer && SOFTWARE_RENDERERS.some(sw => renderer.includes(sw))) {
    flags.push('software_rendering:' + renderer.split(' ')[0]);
    return { score: 0.04, flags };
  }

  // ── Soft flags (accumulate penalties) ───────────────────────────────────────

  // Fingerprint anomalies
  if ((signals.fingerprintScore ?? 1) < 0.1) flags.push('fingerprint_failure');

  // Interaction anomalies
  if (signals.interactionCount === 0 && (signals.sessionDurationMs ?? 0) > 3000)
    flags.push('zero_interaction');
  if ((signals.clickCount ?? 1) === 0 && (signals.sessionDurationMs ?? 0) > 5000)
    flags.push('no_clicks');
  if (signals.firstInteractMs !== null && signals.firstInteractMs !== undefined && signals.firstInteractMs < 30)
    flags.push('instant_interaction');

  // Timing regularity (robotic keyboard)
  if ((signals.timingScore ?? 1) < 0.05 && (signals.keystrokeCount ?? 0) > 5)
    flags.push('robotic_timing');

  // Window/display anomalies
  if ((signals.outerW ?? 1) === 0 || (signals.outerH ?? 1) === 0)
    flags.push('zero_outer_dimensions');
  if ((signals.colorDepth ?? 24) > 0 && (signals.colorDepth ?? 24) < 16)
    flags.push('low_color_depth');

  // Hardware anomalies (only flag for desktop — mobile legitimately has low concurrency)
  if (!signals.isMobile) {
    if ((signals.pluginCount ?? 1) === 0)           flags.push('no_plugins_desktop');
    if ((signals.hardwareConcurrency ?? 2) <= 1)    flags.push('low_hardware_concurrency');
  }
  if (signals.deviceMemory !== undefined && signals.deviceMemory !== -1 && signals.deviceMemory < 0.5)
    flags.push('low_device_memory');

  // Browser feature anomalies
  if (signals.hasLanguages === false)               flags.push('no_languages');
  if (signals.cookieEnabled === false)              flags.push('cookies_disabled');

  // Canvas fingerprint absent (all real browsers produce a non-zero hash)
  if (signals.canvasHash !== undefined && signals.canvasHash === 0)
    flags.push('canvas_fingerprint_absent');

  // ── Apply penalties to composite ─────────────────────────────────────────────

  if (signals.composite !== undefined) {
    let adj = signals.composite;

    if (flags.includes('fingerprint_failure'))        adj -= 0.30;
    if (flags.includes('zero_interaction'))            adj -= 0.20;
    if (flags.includes('no_clicks'))                   adj -= 0.10;
    if (flags.includes('instant_interaction'))         adj -= 0.25;
    if (flags.includes('robotic_timing'))              adj -= 0.20;
    if (flags.includes('zero_outer_dimensions'))       adj -= 0.15;
    if (flags.includes('low_color_depth'))             adj -= 0.10;
    if (flags.includes('no_plugins_desktop'))          adj -= 0.10;
    if (flags.includes('low_hardware_concurrency'))    adj -= 0.15;
    if (flags.includes('low_device_memory'))           adj -= 0.10;
    if (flags.includes('no_languages'))                adj -= 0.10;
    if (flags.includes('cookies_disabled'))            adj -= 0.10;
    if (flags.includes('canvas_fingerprint_absent'))   adj -= 0.12;

    return { score: clamp(adj), flags };
  }

  return { score: 0.5, flags }; // no composite → neutral
}

// ── Network Context ───────────────────────────────────────────────────────────

const SCRAPER_REFERRER_PATTERNS = [
  /^https?:\/\/\d+\.\d+\.\d+\.\d+/,  // IP-address referrer
  /semrush\.com/i,
  /ahrefs\.com/i,
  /moz\.com/i,
  /majestic\.com/i,
  /similarweb\.com/i,
  /data\.for\.seo/i,
  /(?:^|\.)bot\./i,
  /(?:^|\.)crawl\./i,
];

function scoreNetworkContext(params: {
  referrer?: string | null;
  domain?: string | null;
}): { score: number; flags: string[] } {
  const flags: string[] = [];
  const { referrer } = params;

  if (!referrer || referrer.trim() === '') {
    return { score: 1.0, flags: [] };
  }

  // IP-address referrer is a strong bot indicator
  if (/^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(referrer)) {
    flags.push('ip_referrer');
    return { score: 0.2, flags };
  }

  for (const pattern of SCRAPER_REFERRER_PATTERNS) {
    if (pattern.test(referrer)) {
      flags.push('scraper_referrer');
      return { score: 0.4, flags };
    }
  }

  // Referrer contains bot/crawler keywords
  if (/[?&](bot|crawler|scraper|spider)=/i.test(referrer)) {
    flags.push('bot_referrer_param');
    return { score: 0.3, flags };
  }

  return { score: 1.0, flags: [] };
}

// ── Final Composite ───────────────────────────────────────────────────────────

export function computeScore(params: {
  userAgent?:  string | null;
  signals?:    Partial<SdkSignals> | null;
  referrer?:   string | null;
  domain?:     string | null;
}): ScoreResult {
  const allFlags: string[] = [];
  const factors: Record<string, number> = {};

  // 1. User-Agent (always available)
  const { score: uaScore, flags: uaFlags } = scoreUserAgent(params.userAgent);
  allFlags.push(...uaFlags);
  factors.userAgent = uaScore;

  // 2. SDK signals
  const hasSdk = !!params.signals && typeof params.signals.composite === 'number';
  let sdkScore = 0.5;
  if (hasSdk) {
    const { score, flags } = scoreSdkSignals(params.signals!);
    sdkScore = score;
    allFlags.push(...flags);

    // Store all signal values as factors for dashboard inspection
    const s = params.signals!;
    factors.sdkComposite        = s.composite          ?? 0;
    factors.mouseEntropy        = s.mouseEntropy        ?? 0;
    factors.keystrokeCv         = s.keystrokeCv         ?? 0;
    factors.scrollVariance      = s.scrollVariance      ?? 0;
    factors.timingScore         = s.timingScore         ?? 0;
    factors.fingerprintScore    = s.fingerprintScore    ?? 0;
    factors.hardwareConcurrency = s.hardwareConcurrency ?? 0;
    factors.deviceMemory        = s.deviceMemory        ?? -1;
    factors.colorDepth          = s.colorDepth          ?? 0;
    factors.pluginCount         = s.pluginCount         ?? 0;
    factors.clickCount          = s.clickCount          ?? 0;
    factors.interactionCount    = s.interactionCount    ?? 0;
    factors.sessionDurationMs   = s.sessionDurationMs   ?? 0;
    factors.sdkAdjusted         = score;
  }

  // 3. Network context
  const { score: netScore, flags: netFlags } = scoreNetworkContext({
    referrer: params.referrer,
    domain:   params.domain,
  });
  allFlags.push(...netFlags);
  factors.network = netScore;

  // ── Weighted combination ──────────────────────────────────────────────────────

  let finalScore: number;

  if (hasSdk) {
    // SDK carries 70% of the weight; UA is a hard gate
    finalScore = (sdkScore * 0.70) + (uaScore * 0.25) + (netScore * 0.05);
    if (uaScore < 0.15) finalScore = Math.min(finalScore, 0.08); // headless UA cap
  } else {
    finalScore = (uaScore * 0.80) + (netScore * 0.20);
    allFlags.push('no_sdk_signals');
  }

  finalScore = parseFloat(clamp(finalScore).toFixed(4));

  // ── Verdict ───────────────────────────────────────────────────────────────────

  let verdict: 'HUMAN' | 'CAPTCHA' | 'BOT';
  if (finalScore >= 0.70)      verdict = 'HUMAN';
  else if (finalScore >= 0.30) verdict = 'CAPTCHA';
  else                         verdict = 'BOT';

  return { score: finalScore, verdict, factors, flags: allFlags };
}

export function verdictFromScore(score: number): 'HUMAN' | 'CAPTCHA' | 'BOT' {
  if (score >= 0.70) return 'HUMAN';
  if (score >= 0.30) return 'CAPTCHA';
  return 'BOT';
}
