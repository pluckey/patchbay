import { NextResponse } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { getClientIP } from "./request-utils"

const redis = Redis.fromEnv()

// Conservative defaults for the public demo. Override via env.
const ANON_PER_MIN = parseInt(process.env.RATE_LIMIT_ANON_PER_MINUTE ?? "5", 10)
const ANON_PER_DAY = parseInt(process.env.RATE_LIMIT_ANON_PER_DAY ?? "50", 10)

const minuteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(ANON_PER_MIN, "1 m"),
  prefix: "rl:patchbay:min",
  analytics: true,
})

const dayLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(ANON_PER_DAY, "1 d"),
  prefix: "rl:patchbay:day",
  analytics: true,
})

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; remaining: number; window: "minute" | "day" | "redis-down" }

export async function rateLimit(identifier: string): Promise<RateLimitResult> {
  try {
    const minRes = await minuteLimiter.limit(identifier)
    if (!minRes.success) return { ok: false, remaining: minRes.remaining, window: "minute" }
    const dayRes = await dayLimiter.limit(identifier)
    if (!dayRes.success) return { ok: false, remaining: dayRes.remaining, window: "day" }
    return { ok: true, remaining: Math.min(minRes.remaining, dayRes.remaining) }
  } catch (err) {
    console.error("[rate-limit] Redis unavailable, failing closed:", err)
    return { ok: false, remaining: 0, window: "redis-down" }
  }
}

export function rateLimitResponse(window: "minute" | "day" | "redis-down" | "session" = "session"): NextResponse {
  const message =
    window === "minute"
      ? "You're going fast. Wait a minute and try again."
      : window === "day"
        ? "Daily quota reached for this IP. Patchbay's public demo is capped — fork the repo to run unrestricted."
        : "Rate limit exceeded."
  return NextResponse.json({ error: message }, { status: 429 })
}

/**
 * Thin per-route wrapper. Looks up the request's IP, runs the sliding-window
 * rate limit, and returns:
 *   - a NextResponse (429) when the request should be rejected
 *   - null when the request should proceed
 *
 * Routes use this as `const limited = await enforceRateLimit(request); if (limited) return limited;`
 * which keeps the call site to two lines.
 */
export async function enforceRateLimit(request: Request): Promise<NextResponse | null> {
  const ip = getClientIP(request)
  const rl = await rateLimit(ip)
  if (!rl.ok) return rateLimitResponse(rl.window)
  return null
}
