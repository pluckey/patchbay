import type { SourceKindContribution } from "@/kernel/source-kinds"
import type { MarkdownNodeData } from "@/kernel/entities"

/**
 * Markdown source kind.
 *
 * Markdown is the simplest case: no library to load, the parser is the
 * identity function, the cell author binds to the raw text string. The
 * type-def fragment declares a `MarkdownContent` type — a plain string
 * with branding for clarity in IntelliSense.
 */

export const markdownSourceKind: SourceKindContribution = {
  kind: "markdown",
  bindingName: "markdown",

  loadLibrary: async () => undefined,

  extractFromNode: async (node: unknown) => {
    const md = node as MarkdownNodeData
    return md.content
  },

  parse: async (rawArtifact: unknown) => {
    if (typeof rawArtifact === "string") return rawArtifact
    if (rawArtifact instanceof ArrayBuffer) return new TextDecoder().decode(rawArtifact)
    if (rawArtifact instanceof Uint8Array) return new TextDecoder().decode(rawArtifact)
    return String(rawArtifact ?? "")
  },

  typeDefFragment: `/**
 * Markdown source content. The cell author receives the raw markdown text
 * as a string. No parsing, no AST — just the text the user wrote.
 */
type MarkdownContent = string`,

  bindingTypeExpression: "MarkdownContent",

  presentation: {
    label: "Markdown",
    glyph: "md",
  },
}
