"use client"

import { useEffect, useId, useState } from "react"

type MermaidDiagramProps = {
  source: string
}

// Module-level flag so mermaid.initialize() runs only once across the app.
// Subsequent calls to ensureMermaid() skip re-initialization.
let initialized = false

async function ensureMermaid() {
  // Dynamic import keeps mermaid (~1MB with d3) out of the main bundle —
  // it's lazy-loaded only when the user actually views a diagram.
  const mod = await import("mermaid")
  const mermaid = mod.default
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      // securityLevel: "loose" allows HTML (<b>, <br/>, emoji spans) inside
      // mermaid node labels. The AI uses these heavily; stripping them visibly
      // degrades diagrams.
      //
      // THREAT MODEL: This is acceptable *only* because Context Canvas is
      // currently a single-user local tool. The browser session has no other
      // users to attack and no privileged data beyond what the user already
      // controls. Prompt injection via Source-cell content can cause the AI
      // to emit malicious mermaid (e.g. `<img onerror=...>` in a label) which
      // "loose" mode will execute — but only against the user themselves.
      //
      // If this app ever becomes multi-tenant, gets deployed publicly, or
      // starts processing content on behalf of a third party, this setting
      // MUST be revisited. Options at that point: switch to "strict" (loses
      // HTML in labels), "sandbox" (iframe isolation, requires render rework),
      // or DOMPurify the SVG before injection.
      securityLevel: "loose",
    })
    initialized = true
  }
  return mermaid
}

/**
 * Renders a mermaid diagram source string as inline SVG.
 *
 * - Dynamically imports mermaid so the main bundle stays lean.
 * - Re-renders when `source` changes (e.g. the AI cell re-runs).
 * - On parse error, shows the error + the raw source in a collapsible details
 *   block instead of crashing the cell.
 * - The rendered SVG is injected via dangerouslySetInnerHTML — mermaid's own
 *   output, not user markdown, and securityLevel: "loose" is already trusting
 *   the source.
 */
export function MermaidDiagram({ source }: MermaidDiagramProps) {
  // useId returns ":r0:"-style identifiers; mermaid requires a valid HTML id
  // so we strip the colons.
  const rawId = useId()
  const id = `mermaid-${rawId.replace(/[^a-zA-Z0-9]/g, "")}`

  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setSvg(null)

    ensureMermaid()
      .then(async (mermaid) => {
        try {
          const result = await mermaid.render(id, source)
          if (!cancelled) setSvg(result.svg)
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : String(e))
          }
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e))
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, source])

  if (error) {
    return (
      <div className="flex flex-col gap-1 my-2">
        <div className="text-[10px] text-destructive uppercase tracking-wider">
          Mermaid error
        </div>
        <pre className="text-xs text-destructive whitespace-pre-wrap break-words font-mono">
          {error}
        </pre>
        <details className="text-[10px]">
          <summary className="cursor-pointer text-muted-foreground">source</summary>
          <pre className="mt-1 text-xs text-foreground whitespace-pre-wrap break-words font-mono bg-muted rounded px-2 py-1.5">
            {source}
          </pre>
        </details>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="text-[10px] text-muted-foreground italic my-2">
        Rendering diagram…
      </div>
    )
  }

  return (
    <div
      className="mermaid-wrapper w-full overflow-auto my-2"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
