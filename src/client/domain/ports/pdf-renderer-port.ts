import type { PdfDocument } from "@/kernel/entities"

export type { PdfDocument, PdfOutlineItem } from "@/kernel/entities"

export interface PdfRendererPort {
  loadDocument(blob: Blob): Promise<PdfDocument>
  renderPage(doc: PdfDocument, pageNum: number, scale: number): Promise<HTMLCanvasElement>
  getPageText(doc: PdfDocument, pageNum: number): Promise<string>
  getPageDimensions(doc: PdfDocument, pageNum: number): Promise<{ width: number; height: number }>
}
