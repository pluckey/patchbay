import type { SourceKindContribution } from "@/kernel/source-kinds"

/**
 * Derived source kind — represents the output of an upstream signal-field
 * cell flowing into a downstream cell.
 *
 * This is the simplest contribution: no library, no node extraction (cells
 * have no WorkspaceNode shape — they live in the cells array, not the
 * nodes array), and the parser is the identity function. The cascade
 * builds the raw artifact directly from `cell.output.text` and the worker
 * binds it under the connection label.
 *
 * The "derived" kind is what makes the cell worker uniform: with this
 * contribution registered, every input the worker sees can be looked up
 * in the registry — there's no special "if it came from a cell" branch
 * anywhere in the cell pipeline.
 */
export const derivedSourceKind: SourceKindContribution = {
  kind: "derived",
  bindingName: "derived",

  loadLibrary: async () => undefined,

  // No extractFromNode — derived inputs come from upstream cell outputs,
  // not from WorkspaceNodes. The cascade handles cell-source extraction
  // directly because there's no node to extract from.

  parse: async (rawArtifact: unknown) => {
    if (typeof rawArtifact === "string") return rawArtifact
    return String(rawArtifact ?? "")
  },

  typeDefFragment: `/**
 * Output of an upstream cell — a plain string. Cell-to-cell connections
 * carry the upstream cell's output text as the input value.
 */
type DerivedContent = string`,

  bindingTypeExpression: "DerivedContent",

  presentation: {
    label: "Cell",
    glyph: "cell",
  },
}
