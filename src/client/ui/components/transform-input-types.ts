export const MARKDOWN_INPUT_DEFS = `
declare const input: {
  /** The markdown content of the source node */
  text: string;
  /** Source node type */
  type: "markdown";
};
`

export const PDF_INPUT_DEFS = `
declare const input: {
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
};
`
