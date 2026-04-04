"use client"

import type { PdfTextItem } from "@/kernel/entities"
import { pdfToScreen } from "./pdf-coordinates"

type PdfTextLayerProps = {
  textItems: PdfTextItem[]
  scale: number
  pageHeight: number
}

export function PdfTextLayer({ textItems, scale, pageHeight }: PdfTextLayerProps) {
  return (
    <div
      style={{ position: "absolute", inset: 0, pointerEvents: "all" }}
      aria-hidden="true"
    >
      {textItems.map((item, i) => {
        const screen = pdfToScreen(
          { x: item.x, y: item.y, width: item.width, height: item.height },
          scale,
          pageHeight
        )
        return (
          <span
            key={i}
            className="selection:bg-primary/30"
            style={{
              position: "absolute",
              left: screen.x,
              top: screen.y,
              fontSize: item.height * scale,
              fontFamily: "sans-serif",
              color: "transparent",
              whiteSpace: "pre",
              lineHeight: 1,
            }}
          >
            {item.str}
          </span>
        )
      })}
    </div>
  )
}
