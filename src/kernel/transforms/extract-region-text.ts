import type { PdfTextItem, PdfRegion } from "../entities"

export function extractRegionText(items: PdfTextItem[], region: PdfRegion): string {
  const contained = items.filter((item) => {
    const cx = item.x + item.width / 2
    const cy = item.y + item.height / 2
    return cx >= region.x && cx <= region.x + region.width &&
           cy >= region.y && cy <= region.y + region.height
  })
  // Sort by reading order: top-to-bottom (y descending in PDF), then left-to-right
  contained.sort((a, b) => b.y - a.y || a.x - b.x)
  return contained.map((item) => item.str).join(" ")
}
