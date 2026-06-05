/**
 * Proof of Human — Server-Side Scoring Engine
 *
 * Combines client-side SDK signals with server-side heuristics
 * to produce a final human probability score (0.0 = bot, 1.0 = human).
 */

export interface SdkSignals {
  composite:        number;   // client's own composite score
  mouseEntropy:     number;   // 0–1
  keystrokeCv:      number;   // 0–1
  scrollVariance:   number;   // 0–1
  timingScore:      number;   // 0–1
  fingerprintScore: number;   // 0–1
  mouseEventCount:  number;
  keystrokeCount:   number;
  scrollEventCount: number;
  interactionCount: number;
  firstInteractMs:  number | null;
  sessionDurationMs:number;
  isMobile:         boolean;
  hasWebdriver:     boolean;
  pluginCount:      number;
  hasLanguages:     boolean;
  screenW:          number;
  screenH:          number;
  outerW:           number;
  outerH:           number;
}

export interface ScoreResult {
  score:   number;           // final 0.0–1.0
  verdict: 'HUMAN' | 'CAPTCHA' | 'BOT';
  factors: Record<string, number>;
  flags:   string[];
}

// ── Utility ───────────────────────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, v));
}

// ── User-Agent Heuristics ─────────────────────────────────────────────────────

const HEADLESS_UA_PATTERNS = [
  /HeadlessChrome/i,
  /PhantomJS/i,
  /SlimerJS/i,
  /Nightmare/i,
  /selenium/i,
  /webdriver/i,
  /puppeteer/i,
  /playwright/i,
  /cypress/i,
  /python-requests/i,
  /go-http-client/i,
  /curl\//i,
  /wget\//i,
  /libwww-perl/i,
  /scrapy/i,
  /axios\//i,
  /node-fetch/i,
  /java\//i,
  /okhttp\//i,
];

const SUSPICIOUS_UA_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /scraper/i,
  /fetch/i,
  /http-client/i,
  /scan/i,
];

function scoreUserAgent(ua: string | undefined | null): {
  score: number;
  flags: string[];
} {
  const flags: string[] = [];

  if (!ua || ua.trim() === '') {
    flags.push('missing_user_agent');
    return { score: 0.02, flags };
  }

  for (const pattern of HEADLESS_UA_PATTERNS) {
    if (pattern.test(ua)) {
      flags.push('headless_ua:' + pattern.source.toLowerCase().replace(/\\\//g, '/').replace(/[/\\^$*+?.()|[\]{}]/g, ''));
      return { score: 0.03, flags };
    }
  }

  for (const pattern of SUSPICIOUS_UA_PATTERNS) {
    if (pattern.test(ua)) {
      flags.push('suspicious_ua');
      return { score: 0.2, flags };
    }
  }

  // Very short or truncated UA
  if (ua.length < 20) {
    flags.push('short_user_agent');
    return { score: 0.25, flags };
  }

  return { score: 1.0, flags };
}

// ── SDK Signal Scorer ─────────────────────────────────────────────────────────

function scoreSdkSignals(signals: Partial<SdkSignals>): {
  score: number;
  flags: string[];
} {
  const flags: string[] = [];

  // Hard-fail on webdriver
  if (signals.hasWebdriver === true) {
    flags.push('webdriver_detected');
    return { score: 0.02, flags };
  }

  // Hard-fail on fingerprint score near zero
  if (signals.fingerprintScore !== undefined && signals.fingerprintScore < 0.1) {
    flags.push('fingerprint_failure');
  }

  // Zero interaction is suspicious (page opened by a bot that doesn't interact)
  if (signals.interactionCount === 0 && (signals.sessionDurationMs ?? 0) > 3000) {
    flags.push('zero_interaction');
  }

  // Impossibly fast first interaction
  if (signals.firstInteractMs !== null && signals.firstInteractMs !== undefined && signals.firstInteractMs < 30) {
    flags.push('instant_interaction');
  }

  // Desktop with zero plugins
  if (!signals.isMobile && signals.pluginCount === 0) {
    flags.push('no_plugins_desktop');
  }

  // No language headers
  if (signals.hasLanguages === false) {
    flags.push('no_languages');
  }

  // outerWidth === 0 (headless Chrome)
  if (signals.outerW === 0 || signals.outerH === 0) {
    flags.push('zero_outer_dimensions');
  }

  // Use the client composite if available
  if (signals.composite !== undefined) {
    let adjusted = signals.composite;

    // Apply server-side penalties
    if (flags.includes('zero_interaction'))         adjusted -= 0.20;
    if (flags.includes('fingerprint_failure'))       adjusted -= 0.30;
    if (flags.includes('instant_interaction'))       adjusted -= 0.25;
    if (flags.includes('no_plugins_desktop'))        adjusted -= 0.10;
    if (flags.includes('no_languages'))              adjusted -= 0.10;
    if (flags.includes('zero_outer_dimensions'))     adjusted -= 0.15;

    return { score: clamp(adjusted), flags };
  }

  return { score: 0.5, flags }; // no composite from client, neutral
}

// ── Referrer / Network Heuristics ─────────────────────────────────────────────

function scoreNetworkContext(params: {
  referrer?: string | null;
  domain?: string | null;
}): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 1.0;

  // Empty referrer from non-direct traffic (not a guaranteed signal but a soft one)
  // We don't penalise hard — people use privacy browsers
  if (!params.referrer) {
    // neutral — many humans browse without referrer
  }

  return { score, flags };
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

  // 1. User-Agent analysis (always available)
  const { score: uaScore, flags: uaFlags } = scoreUserAgent(params.userAgent);
  allFlags.push(...uaFlags);
  factors.userAgent = uaScore;

  // 2. SDK signals (from browser SDK)
  const hasSdkSignals = !!params.signals && typeof params.signals.composite === 'number';
  let sdkScore = 0.5;
  if (hasSdkSignals) {
    const { score, flags } = scoreSdkSignals(params.signals!);
    sdkScore = score;
    allFlags.push(...flags);
    factors.sdkComposite     = params.signals!.composite!;
    factors.mouseEntropy     = params.signals!.mouseEntropy    ?? 0;
    factors.keystrokeCv      = params.signals!.keystrokeCv     ?? 0;
    factors.scrollVariance   = params.signals!.scrollVariance  ?? 0;
    factors.timingScore      = params.signals!.timingScore     ?? 0;
    factors.fingerprintScore = params.signals!.fingerprintScore ?? 0;
    factors.sdkAdjusted      = score;
  }

  // 3. Network context
  const { score: netScore, flags: netFlags } = scoreNetworkContext({
    referrer: params.referrer,
    domain:   params.domain,
  });
  allFlags.push(...netFlags);
  factors.network = netScore;

  // ── Weighted combination ──────────────────────────────────────────────────

  let finalScore: number;

  if (hasSdkSignals) {
    // SDK signals available — they carry the most weight
    // UA is a hard gate (if it fails, we cap the score regardless of SDK)
    finalScore = (sdkScore * 0.70) + (uaScore * 0.25) + (netScore * 0.05);

    // UA hard cap: headless UA trumps everything
    if (uaScore < 0.15) {
      finalScore = Math.min(finalScore, 0.08);
    }
  } else {
    // No SDK signals — fall back to UA + basic heuristics
    finalScore = (uaScore * 0.80) + (netScore * 0.20);
    allFlags.push('no_sdk_signals');
  }

  finalScore = clamp(finalScore);

  // Round to 4dp
  finalScore = parseFloat(finalScore.toFixed(4));

  // ── Verdict ───────────────────────────────────────────────────────────────

  let verdict: 'HUMAN' | 'CAPTCHA' | 'BOT';
  if (finalScore >= 0.70) {
    verdict = 'HUMAN';
  } else if (finalScore >= 0.30) {
    verdict = 'CAPTCHA';
  } else {
    verdict = 'BOT';
  }

  return { score: finalScore, verdict, factors, flags: allFlags };
}

export function verdictFromScore(score: number): 'HUMAN' | 'CAPTCHA' | 'BOT' {
  if (score >= 0.70) return 'HUMAN';
  if (score >= 0.30) return 'CAPTCHA';
  return 'BOT';
}
