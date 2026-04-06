import type { InputLegendEntry } from "@/kernel/entities"
import { sourceKindRegistry } from "@/kernel/source-kinds"
// Side-effect import: ensures every source kind is registered before
// buildInputTypeDefs runs.
import "@/client/source-kinds"

/**
 * Generates Monaco type definitions for a cell editor by composing
 * `typeDefFragment` strings from every source kind contribution that
 * the cell's incoming connections actually use.
 *
 * The generator contains ZERO source-kind-specific code: no hardcoded
 * MarkdownInput, PdfInput, helper namespace, or any per-kind branch.
 * It iterates the legend, looks up each entry's contribution by kind,
 * concatenates the fragments, and emits one `declare const <bindingName>`
 * line per entry using the contribution's `bindingTypeExpression`.
 *
 * Adding a new source kind never requires editing this file.
 *
 * Note on legacy `derived` entries: signal-field cell-to-cell connections
 * use a synthetic `derived` source-type tag that is NOT a registered kind
 * (it's just a marker for "the upstream is another cell whose output is
 * a string"). The generator handles this by typing the binding as
 * `unknown` (the cell author can still reference it; they just don't get
 * type hints for it). When/if cell-to-cell becomes a first-class kind,
 * it'll get its own contribution and lose the special case.
 */
export function buildInputTypeDefs(legend: InputLegendEntry[]): string {
  // Collect the unique source kinds present in the legend (so we don't
  // emit the same typeDefFragment twice if a cell has two inputs of the
  // same kind).
  const seenKinds = new Set<string>()
  const fragments: string[] = []
  const declarations: string[] = []

  for (const entry of legend) {
    let contribution
    try {
      contribution = sourceKindRegistry.get(entry.sourceType)
    } catch {
      // Unknown kind in the legend (e.g., a `derived` placeholder for
      // cell-to-cell connections that have no contribution). Bind it as
      // unknown so the variable still exists in the editor's scope.
      declarations.push(
        `  /** ${entry.sourceName} (${entry.sourceType}) */\n  ${entry.label}: unknown;`,
      )
      continue
    }

    if (!seenKinds.has(contribution.kind)) {
      seenKinds.add(contribution.kind)
      if (contribution.typeDefFragment) {
        fragments.push(contribution.typeDefFragment)
      }
    }

    const typeExpr = contribution.bindingTypeExpression ?? "unknown"
    declarations.push(
      `  /** ${entry.sourceName} (${contribution.kind}) */\n  ${entry.label}: ${typeExpr};`,
    )
  }

  if (legend.length === 0) {
    // No incoming connections — emit every kind's typeDefFragment so the
    // author still gets type info if they manually reference a known
    // shape, but the input bindings are an empty record.
    const allFragments = sourceKindRegistry
      .list()
      .map((c) => c.typeDefFragment)
      .filter(Boolean)
      .join("\n\n")
    return `${allFragments}\n\ndeclare const input: Record<string, unknown>;`
  }

  return `${fragments.join("\n\n")}\n\ndeclare const input: {\n${declarations.join("\n")}\n};`
}
