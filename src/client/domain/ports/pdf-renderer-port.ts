import type { PdfDocument } from "@/kernel/entities"

export type { PdfDocument, PdfOutlineItem } from "@/kernel/entities"

export interface PdfRendererPort {
  loadDocument(blob: Blob): Promise<PdfDocument>
  renderPage(doc: PdfDocument, pageNum: number, scale: number): Promise<HTMLCanvasElement>
  searchText(doc: PdfDocument, pageNum: number, query: string): Promise<number>
  getPageText(doc: PdfDocument, pageNum: number): Promise<string>
}
