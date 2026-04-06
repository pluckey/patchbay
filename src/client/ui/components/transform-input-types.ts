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
  /** User-authored annotation regions on this PDF */
  annotations: Array<{
    label: string;
    page: number;
    region: { x: number; y: number; width: number; height: number };
    text: string;
  }>;
}`

const DERIVED_INTERFACE = `interface DerivedInput {
  /** Text output from an upstream cell or transform */
  text: string;
  /** Source node type */
  type: "derived";
}`

const PDF_HELPERS_INTERFACE = `interface PdfHelpers {
  /** Pages from \`from\` to \`to\` (1-indexed, inclusive) as array of { page, text }. */
  pageRange(input: PdfInput | MarkdownInput | DerivedInput, from: number, to: number): Array<{ page: number; text: string }>;
  /** Pages surrounding currentPage within \`radius\` as array of { page, text }. */
  surrounding(input: PdfInput | MarkdownInput | DerivedInput, radius: number): Array<{ page: number; text: string }>;
  /** All pages joined. */
  allText(input: PdfInput | MarkdownInput | DerivedInput): string;
  /** All annotation texts as an array. */
  annotationTexts(input: PdfInput | MarkdownInput | DerivedInput): string[];
  /** Total page count. */
  pageCount(input: PdfInput | MarkdownInput | DerivedInput): number;
  /** Text of the current page. */
  currentPageText(input: PdfInput | MarkdownInput | DerivedInput): string;
}
/** PDF helper functions — safe to call on any input (returns "" or [] for non-PDF). */
declare const pdf: PdfHelpers;`

const ALL_INTERFACES = `${MARKDOWN_INTERFACE}\n\n${PDF_INTERFACE}\n\n${DERIVED_INTERFACE}\n\n${PDF_HELPERS_INTERFACE}`

function typeForSourceType(sourceType: string): string {
  switch (sourceType) {
    case "pdf":
      return "PdfInput"
    case "markdown":
      return "MarkdownInput"
    case "derived":
      return "DerivedInput"
    default:
      return "MarkdownInput"
  }
}

/**
 * Generates Monaco type definitions with concrete property names
 * based on the actual connection labels.
 */
export function buildInputTypeDefs(legend: InputLegendEntry[]): string {
  if (legend.length === 0) {
    return `${ALL_INTERFACES}\ndeclare const input: Record<string, MarkdownInput | PdfInput | DerivedInput>;`
  }

  const props = legend.map((entry) => {
    const type = typeForSourceType(entry.sourceType)
    return `  /** ${entry.sourceName} (${entry.sourceType}) */\n  ${entry.label}: ${type};`
  }).join("\n")

  return `${ALL_INTERFACES}\n\ndeclare const input: {\n${props}\n};`
}
