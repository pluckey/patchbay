export type PdfDocument = {
  numPages: number
  getOutline(): Promise<PdfOutlineItem[] | null>
  destroy(): Promise<void>
}

export type PdfOutlineItem = {
  title: string
  pageNumber: number
  children?: PdfOutlineItem[]
}
