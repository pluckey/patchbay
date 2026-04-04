import type { PdfRegion } from "@/kernel/entities"

/** Convert viewport clientX/clientY to SVG-local coordinates using SVG's CTM */
export function svgLocalCoords(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  if (svg.createSVGPoint) {
    try {
      const pt = svg.createSVGPoint()
      pt.x = clientX
      pt.y = clientY
      const ctm = svg.getScreenCTM()
      if (ctm) {
        const local = pt.matrixTransform(ctm.inverse())
        return { x: local.x, y: local.y }
      }
    } catch {
      // Singular matrix — fall through
    }
  }
  const rect = svg.getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top }
}

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
