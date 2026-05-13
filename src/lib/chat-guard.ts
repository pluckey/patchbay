import { NextResponse } from "next/server"
import { enforceRateLimit } from "./rate-limit"
import { checkContent } from "./content-guard"

type Body = {
  messages?: Array<{ role: string; content: string }>
  systemPrompt?: string
  [k: string]: unknown
}

/**
 * Wraps the /api/chat handler with two-layer abuse protection:
 * 1. IP-based rate limiting (Upstash Redis sliding windows: per-minute + per-day)
 * 2. Two-layer content moderation (regex pre-filter + Haiku contextual check, fail-closed)
 *
 * Parses the body once, passes the parsed object to the handler.
 */
export async function withChatGuardrails(
  request: Request,
  handler: (body: Body) => Promise<Response>,
): Promise<Response> {
  const limited = await enforceRateLimit(request)
  if (limited) return limited

  let body: Body | null
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // Concatenate user-controlled strings worth moderating
  const strings: string[] = []
  if (Array.isArray(body.messages)) {
    for (const m of body.messages) {
      if (typeof m?.content === "string" && m.content.trim().length > 20) {
        strings.push(m.content.trim())
      }
    }
  }
  if (typeof body.systemPrompt === "string" && body.systemPrompt.trim().length > 20) {
    strings.push(body.systemPrompt.trim())
  }
  if (strings.length > 0) {
    const combined = strings.join("\n\n")
    const { allowed, reason } = await checkContent(combined)
    if (!allowed) {
      return NextResponse.json(
        { error: reason || "This content is not appropriate for this platform." },
        { status: 422 },
      )
    }
  }

  return handler(body)
}
