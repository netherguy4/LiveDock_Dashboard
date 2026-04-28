// Default polling cadence. The base is configurable via env
// (NUXT_PUBLIC_POLL_INTERVAL); per-task multipliers express "this can be
// less frequent" without coupling to absolute numbers.
//
// Effective interval = max(base * every, minMs).

export const POLLING = {
  // Base tick — drives snapshot refresh.
  DEFAULT_MS: 2000,
  MIN_MS: 1000,
  MAX_MS: 5 * 60 * 1000, // 5 minutes — matches the design's refresh selector

  // Multipliers (× base interval) for slower-moving data.
  HISTORY_EVERY: 5,        // 10s @ default base
  HISTORY_MIN_MS: 10_000,
  REQUESTS_EVERY: 30,      // 1 min @ default base — minute-resolution data
  REQUESTS_MIN_MS: 60_000,
  CONTAINERS_EVERY: 1,     // every tick
  LOGS_EVERY: 1,           // tail follows the base tick

  // Pre-set options shown in the refresh selector.
  CHOICES_MS: [1000, 2000, 5000, 10_000, 30_000, 60_000, 300_000],
} as const
