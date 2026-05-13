/**
 * Pull the originating client IP from a Vercel-fronted Request.
 * Falls back to "anon" so rate-limit lookups always have a key
 * (treating all unknown sources as a single bucket).
 */
export function getClientIP(request: Request): string {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return request.headers.get("x-real-ip") ?? "anon"
}
