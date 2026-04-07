/**
 * Parse the raw text payload of an AI cell/transform's structured output.
 * Returns null on any parse failure — callers fall back to rendering raw text.
 *
 * Single source of truth: do not inline JSON.parse for structured AI output
 * anywhere else. Three components used to do this independently and drifted
 * (one returned `{}` on failure, two returned `null`).
 */
export function parseStructuredOutput(
  text: string | undefined | null,
): Record<string, unknown> | Record<string, unknown>[] | null {
  if (!text) return null
  try {
    return JSON.parse(text) as Record<string, unknown> | Record<string, unknown>[]
  } catch {
    return null
  }
}
