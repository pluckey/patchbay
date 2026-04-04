"use client"

import { useState } from "react"
import type { PdfAnnotation } from "@/kernel/entities"
import { pdfToScreen } from "./pdf-coordinates"

type PdfAnnotationLayerProps = {
  annotations: PdfAnnotation[]
  scale: number
  pageHeight: number
  drawMode: boolean
  drawingRect: { x: number; y: number; width: number; height: number } | null
  onDelete: (annotationId: string) => void
  drawHandlers?: {
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: (e: React.PointerEvent) => void
  }
}

export function PdfAnnotationLayer({
  annotations,
  scale,
  pageHeight,
  drawMode,
  drawingRect,
  onDelete,
  drawHandlers,
}: PdfAnnotationLayerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
        pointerEvents: drawMode ? "all" : "none",
        cursor: drawMode ? "crosshair" : undefined,
      }}
      {...(drawMode && drawHandlers ? {
        onPointerDown: drawHandlers.onPointerDown,
        onPointerMove: drawHandlers.onPointerMove,
        onPointerUp: drawHandlers.onPointerUp,
      } : {})}
    >
      {annotations.map((annotation) => {
        const rect = pdfToScreen(annotation.region, scale, pageHeight)
        const isHovered = hoveredId === annotation.id

        return (
          <g
            key={annotation.id}
            onPointerEnter={() => setHoveredId(annotation.id)}
            onPointerLeave={() => setHoveredId(null)}
            style={{ pointerEvents: "all" }}
          >
            {/* Fill rect */}
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill="currentColor"
              stroke="none"
              className="text-primary/20"
            />
            {/* Stroke rect */}
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              className="text-primary"
            />

            {annotation.label && (
              <text
                x={rect.x + 2}
                y={rect.y - 3 > 10 ? rect.y - 3 : rect.y + 12}
                className="text-[10px] fill-foreground"
                style={{ pointerEvents: "none" }}
              >
                {annotation.label}
              </text>
            )}

            {isHovered && (
              <g
                style={{ cursor: "pointer", pointerEvents: "all" }}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(annotation.id)
                }}
              >
                <rect
                  x={rect.x + rect.width - 16}
                  y={rect.y}
                  width={16}
                  height={16}
                  rx={2}
                  className="fill-destructive"
                />
                <line
                  x1={rect.x + rect.width - 12}
                  y1={rect.y + 4}
                  x2={rect.x + rect.width - 4}
                  y2={rect.y + 12}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="text-destructive-foreground"
                />
                <line
                  x1={rect.x + rect.width - 4}
                  y1={rect.y + 4}
                  x2={rect.x + rect.width - 12}
                  y2={rect.y + 12}
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="text-destructive-foreground"
                />
              </g>
            )}
          </g>
        )
      })}

      {drawingRect && (
        <g>
          <rect
            x={drawingRect.x}
            y={drawingRect.y}
            width={drawingRect.width}
            height={drawingRect.height}
            fill="currentColor"
            stroke="none"
            className="text-primary/10"
          />
          <rect
            x={drawingRect.x}
            y={drawingRect.y}
            width={drawingRect.width}
            height={drawingRect.height}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeDasharray="4 2"
            className="text-primary"
          />
        </g>
      )}
    </svg>
  )
}
