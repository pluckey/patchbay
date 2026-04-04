import type { PdfRegion } from "@/kernel/entities"

/** Convert PDF region (origin bottom-left, points) to screen rect (origin top-left, pixels) */
export function pdfToScreen(
  region: PdfRegion,
  scale: number,
  pageHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: region.x * scale,
    y: (pageHeight - region.y - region.height) * scale,
    width: region.width * scale,
    height: region.height * scale,
  }
}

/** Convert screen rect (origin top-left, pixels) to PDF region (origin bottom-left, points) */
export function screenToPdf(
  rect: { x: number; y: number; width: number; height: number },
  scale: number,
  pageHeight: number
): PdfRegion {
  return {
    x: rect.x / scale,
    y: pageHeight - (rect.y + rect.height) / scale,
    width: rect.width / scale,
    height: rect.height / scale,
  }
}
