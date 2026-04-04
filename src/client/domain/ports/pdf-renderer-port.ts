import type { PdfDocument, PdfTextItem } from "@/kernel/entities"

export type { PdfDocument, PdfOutlineItem, PdfTextItem } from "@/kernel/entities"

export interface PdfRendererPort {
  loadDocument(blob: Blob): Promise<PdfDocument>
  renderPage(doc: PdfDocument, pageNum: number, scale: number): Promise<HTMLCanvasElement>
  getPageText(doc: PdfDocument, pageNum: number): Promise<string>
  getPageTextItems(doc: PdfDocument, pageNum: number): Promise<PdfTextItem[]>
  getPageDimensions(doc: PdfDocument, pageNum: number): Promise<{ width: number; height: number }>
}
