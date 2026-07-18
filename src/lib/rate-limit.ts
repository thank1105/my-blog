// In-memory sliding-window rate limiter for login attempts.
//
// Phase 1 Day 1 scope (per DEVELOPMENT.md Day 1 task list and acceptance
// criteria: 5 failures / 15 minutes). State is kept in a process-local Map,
// which is single-instance only -- behind multiple Node workers or after a
// restart, the counters reset. Phase 10 will replace this with the same
// shape backed by Postgres so it works at horizontal scale.
//
// Conventions:
//   - Window length is fixed at 15 minutes (matches REQUIREMENTS section 4.1.2).
//   - The key is whatever the caller chooses (typically lower-cased email so
//     'USER@x' and 'user@x' share a bucket).
//   - Expired entries are pruned lazily on every check. No timers, no GC
//     dependencies -- safe for serverless warm starts and Next.js HMR.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILURES = 5;

type Bucket = number[]; // unix-ms timestamps of recent failures

// Reuse the same Map across Next.js dev hot reloads; otherwise the in-process
// limiter would forget its counts on every code edit.
const globalForLimiter = globalThis as unknown as {
  __loginLimiter?: Map<string, Bucket>;
};

const buckets: Map<string, Bucket> = globalForLimiter.__loginLimiter ?? new Map<string, Bucket>();

if (!globalForLimiter.__loginLimiter) {
  globalForLimiter.__loginLimiter = buckets;
}

function pruneToWindow(now: number, list: number[]): number[] {
  const cutoff = now - WINDOW_MS;
  let i = 0;
  while (i < list.length && list[i] <= cutoff) i += 1;
  return i === 0 ? list : list.slice(i);
}

export interface RateLimitCheck {
  /** Total failures currently within the rolling window. */
  count: number;
  /** Whether the caller is allowed to attempt another login right now. */
  allowed: boolean;
  /** Seconds the caller must wait before the oldest failure rolls out. */
  retryAfterSec: number;
  /** Limit configured for this window (MAX_FAILURES). */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
}

export function checkLoginRate(key: string, now: number = Date.now()): RateLimitCheck {
  const raw = buckets.get(key) ?? [];
  const recent = pruneToWindow(now, raw);
  if (recent.length !== raw.length) {
    if (recent.length === 0) buckets.delete(key);
    else buckets.set(key, recent);
  }

  const count = recent.length;
  const allowed = count < MAX_FAILURES;
  const oldest = recent[0] ?? now;
  const resetAtMs = oldest + WINDOW_MS;
  const retryAfterSec = Math.max(0, Math.ceil((resetAtMs - now) / 1000));

  return {
    count,
    allowed,
    retryAfterSec,
    limit: MAX_FAILURES,
    windowSec: WINDOW_MS / 1000,
  };
}

export function recordLoginFailure(key: string, now: number = Date.now()): RateLimitCheck {
  const raw = buckets.get(key) ?? [];
  const recent = pruneToWindow(now, raw);
  recent.push(now);
  buckets.set(key, recent);
  return checkLoginRate(key, now);
}

export function clearLoginAttempts(key: string): void {
  buckets.delete(key);
}

// Test helper. Used by the planned Phase 1 Day 2 Vitest suite.
export function __resetLoginLimiterForTests(): void {
  buckets.clear();
}

export const LOGIN_RATE_LIMIT = {
  windowMs: WINDOW_MS,
  maxFailures: MAX_FAILURES,
} as const;
