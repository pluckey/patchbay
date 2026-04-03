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
}

export type ResolvedDerivedInput = {
  text: string
  type: "derived"
}

export type ResolvedInput = ResolvedMarkdownInput | ResolvedPdfInput | ResolvedDerivedInput
