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

const PDF_HELPERS_INTERFACE = `interface PdfHelpers {
  /** Pages from \`from\` to \`to\` (1-indexed, inclusive) as array of { page, text }. */
  pageRange(input: PdfInput, from: number, to: number): Array<{ page: number; text: string }>;
  /** Pages surrounding currentPage within \`radius\` as array of { page, text }. */
  surrounding(input: PdfInput, radius: number): Array<{ page: number; text: string }>;
  /** All pages joined. */
  allText(input: PdfInput): string;
  /** All annotation texts as an array. */
  annotationTexts(input: PdfInput): string[];
  /** Total page count. */
  pageCount(input: PdfInput): number;
  /** Text of the current page. */
  currentPageText(input: PdfInput): string;
}
/** PDF helper functions — safe to call on any input (returns "" or [] for non-PDF). */
declare const pdf: PdfHelpers;`

/**
 * Generates Monaco type definitions with concrete property names
 * based on the actual connection labels.
 */
export function buildInputTypeDefs(legend: InputLegendEntry[]): string {
  if (legend.length === 0) {
    return `${MARKDOWN_INTERFACE}\n${PDF_INTERFACE}\n${PDF_HELPERS_INTERFACE}\ndeclare const input: Record<string, MarkdownInput | PdfInput>;`
  }

  const props = legend.map((entry) => {
    const type = entry.sourceType === "pdf" ? "PdfInput" : "MarkdownInput"
    return `  /** ${entry.sourceName} (${entry.sourceType}) */\n  ${entry.label}: ${type};`
  }).join("\n")

  return `${MARKDOWN_INTERFACE}\n\n${PDF_INTERFACE}\n\n${PDF_HELPERS_INTERFACE}\n\ndeclare const input: {\n${props}\n};`
}
