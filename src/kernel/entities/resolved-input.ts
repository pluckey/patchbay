import type { PdfRegion } from "./pdf-annotation"

export type ResolvedMarkdownInput = {
  text: string
  type: "markdown"
}

export type ResolvedPdfInput = {
  text: string
  pages: string[]
  type: "pdf"
  currentPage: number
  totalPages: number
  filename: string
  annotations: Array<{ label: string; page: number; region: PdfRegion; text: string }>
}

export type ResolvedDerivedInput = {
  text: string
  type: "derived"
}

export type ResolvedInput = ResolvedMarkdownInput | ResolvedPdfInput | ResolvedDerivedInput
