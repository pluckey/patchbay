import type { InputLegendEntry } from "@/kernel/entities"

const MARKDOWN_INTERFACE = `interface MarkdownInput {
  /** The markdown content of the source node */
  text: string;
  /** Source node type */
  type: "markdown";
}`

const PDF_INTERFACE = `interface PdfInput {
  /** Text content of the currently viewed page */
  text: string;
  /** All page texts, 0-indexed — pages[0] is page 1 */
  pages: string[];
  /** Source node type */
  type: "pdf";
  /** Currently viewed page number (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** PDF filename */
  filename: string;
}`

/**
 * Generates Monaco type definitions with concrete property names
 * based on the actual connection labels.
 */
export function buildInputTypeDefs(legend: InputLegendEntry[]): string {
  if (legend.length === 0) {
    return `${MARKDOWN_INTERFACE}\n${PDF_INTERFACE}\ndeclare const input: Record<string, MarkdownInput | PdfInput>;`
  }

  const props = legend.map((entry) => {
    const type = entry.sourceType === "pdf" ? "PdfInput" : "MarkdownInput"
    return `  /** ${entry.sourceName} (${entry.sourceType}) */\n  ${entry.label}: ${type};`
  }).join("\n")

  return `${MARKDOWN_INTERFACE}\n\n${PDF_INTERFACE}\n\ndeclare const input: {\n${props}\n};`
}
