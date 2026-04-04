"use client"

import { useState } from "react"
import type { PdfAnnotation } from "@/kernel/entities"
import type { GripId } from "@/client/ui/hooks/use-pdf-annotation-draw"
import { pdfToScreen } from "./pdf-coordinates"

type Rect = { x: number; y: number; width: number; height: number }

type PdfAnnotationLayerProps = {
  annotations: PdfAnnotation[]
  scale: number
  pageHeight: number
  drawMode: boolean
  drawingRect: Rect | null
  resizingRect: Rect | null
  editingRect: Rect | null
  editingAnnotationId: string | null
  onDelete: (annotationId: string) => void
  onEdit: (annotationId: string) => void
  onStartGripResize?: (gripId: GripId, e: React.PointerEvent) => void
  onEditGripResize?: (gripId: GripId, e: React.PointerEvent) => void
  onConfirmRect?: () => void
  drawHandlers?: {
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: (e: React.PointerEvent) => void
  }
}

const GRIP_SIZE = 10
const GRIP_HIT_SIZE = 24 // larger invisible hit area
const GRIP_POSITIONS: { id: GripId; getPos: (r: Rect) => { cx: number; cy: number }; cursor: string }[] = [
  { id: "nw", getPos: (r) => ({ cx: r.x, cy: r.y }), cursor: "nwse-resize" },
  { id: "n",  getPos: (r) => ({ cx: r.x + r.width / 2, cy: r.y }), cursor: "ns-resize" },
  { id: "ne", getPos: (r) => ({ cx: r.x + r.width, cy: r.y }), cursor: "nesw-resize" },
  { id: "e",  getPos: (r) => ({ cx: r.x + r.width, cy: r.y + r.height / 2 }), cursor: "ew-resize" },
  { id: "se", getPos: (r) => ({ cx: r.x + r.width, cy: r.y + r.height }), cursor: "nwse-resize" },
  { id: "s",  getPos: (r) => ({ cx: r.x + r.width / 2, cy: r.y + r.height }), cursor: "ns-resize" },
  { id: "sw", getPos: (r) => ({ cx: r.x, cy: r.y + r.height }), cursor: "nesw-resize" },
  { id: "w",  getPos: (r) => ({ cx: r.x, cy: r.y + r.height / 2 }), cursor: "ew-resize" },
]

export function PdfAnnotationLayer({
  annotations,
  scale,
  pageHeight,
  drawMode,
  drawingRect,
  resizingRect,
  editingRect,
  editingAnnotationId,
  onDelete,
  onEdit,
  onStartGripResize,
  onEditGripResize,
  onConfirmRect,
  drawHandlers,
}: PdfAnnotationLayerProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const hoveredAnnotation = hoveredId ? annotations.find((a) => a.id === hoveredId) : null
  const hoveredRect = hoveredAnnotation ? pdfToScreen(hoveredAnnotation.region, scale, pageHeight) : null

  return (
    <>
    {/* Confirm button for resizing phase — rendered as HTML for reliable click handling */}
    {resizingRect && onConfirmRect && (
      <div
        className="absolute nodrag"
        style={{
          left: resizingRect.x + resizingRect.width / 2,
          top: resizingRect.y + resizingRect.height + 4,
          transform: "translateX(-50%)",
          zIndex: 10,
          pointerEvents: "all",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          className="bg-indicator text-indicator-foreground text-[10px] font-medium px-3 py-1 rounded shadow-sm hover:opacity-90"
          onClick={(e) => { e.stopPropagation(); onConfirmRect() }}
        >
          ✓ Confirm region
        </button>
        <span className="text-[9px] text-muted-foreground ml-2">or press Enter</span>
      </div>
    )}
    {/* Instant tooltip — rendered as HTML div outside SVG for proper text wrapping */}
    {hoveredAnnotation && hoveredRect && (
      <div
        className="absolute bg-popover text-popover-foreground text-xs rounded px-2 py-1 shadow-md border border-border max-w-[200px] whitespace-pre-wrap z-10"
        style={{
          left: hoveredRect.x,
          top: hoveredRect.y - 4,
          transform: "translateY(-100%)",
          pointerEvents: "none",
        }}
      >
        {hoveredAnnotation.label}
      </div>
    )}
    <svg
      className={drawMode ? "nodrag nopan" : ""}
      pointerEvents={drawMode ? "all" : "none"}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "visible",
        cursor: drawMode ? "crosshair" : undefined,
      }}
      {...(drawMode && drawHandlers ? {
        onPointerDown: drawHandlers.onPointerDown,
        onPointerMove: drawHandlers.onPointerMove,
        onPointerUp: drawHandlers.onPointerUp,
      } : {})}
    >
      {annotations.map((annotation) => {
        const isEditing = annotation.id === editingAnnotationId
        const rect = isEditing && editingRect ? editingRect : pdfToScreen(annotation.region, scale, pageHeight)
        const isHovered = hoveredId === annotation.id

        return (
          <g
            key={annotation.id}
            onPointerEnter={() => setHoveredId(annotation.id)}
            onPointerLeave={() => setHoveredId(null)}
            style={{ pointerEvents: "all", cursor: "pointer" }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              onEdit(annotation.id)
            }}
          >
            {/* Fill rect */}
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill="currentColor"
              stroke="none"
              className="text-indicator/25"
            />
            {/* Stroke rect */}
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="text-indicator"
            />

            {annotation.label && (
              <text
                x={rect.x + 2}
                y={rect.y - 3 > 10 ? rect.y - 3 : rect.y + 12}
                className="text-[10px] fill-indicator-foreground font-medium"
                style={{ pointerEvents: "all", cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(annotation.id)
                }}
              >
                {annotation.label.split("\n")[0].substring(0, 40)}{annotation.label.length > 40 || annotation.label.includes("\n") ? "…" : ""}
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

            {/* Grips for editing existing annotation */}
            {isEditing && editingRect && GRIP_POSITIONS.map(({ id, getPos, cursor }) => {
              const { cx, cy } = getPos(rect)
              return (
                <g key={`edit-grip-${id}`}>
                  <rect
                    x={cx - GRIP_HIT_SIZE / 2} y={cy - GRIP_HIT_SIZE / 2}
                    width={GRIP_HIT_SIZE} height={GRIP_HIT_SIZE}
                    fill="transparent"
                    style={{ cursor, pointerEvents: "all" }}
                    onPointerDown={(e) => onEditGripResize?.(id, e)}
                  />
                  <rect
                    x={cx - GRIP_SIZE / 2} y={cy - GRIP_SIZE / 2}
                    width={GRIP_SIZE} height={GRIP_SIZE}
                    rx={2} fill="currentColor" stroke="currentColor" strokeWidth={1.5}
                    className="fill-indicator text-indicator-foreground"
                    style={{ cursor, pointerEvents: "none" }}
                  />
                </g>
              )
            })}
          </g>
        )
      })}

      {/* Drawing preview — dashed rect while dragging */}
      {drawingRect && (
        <g>
          <rect x={drawingRect.x} y={drawingRect.y} width={drawingRect.width} height={drawingRect.height}
            fill="currentColor" stroke="none" className="text-indicator/15" />
          <rect x={drawingRect.x} y={drawingRect.y} width={drawingRect.width} height={drawingRect.height}
            fill="none" stroke="currentColor" strokeWidth={1.5} strokeDasharray="4 2" className="text-indicator" />
        </g>
      )}

      {/* Resizing — solid rect with grip handles */}
      {resizingRect && (
        <g>
          <rect x={resizingRect.x} y={resizingRect.y} width={resizingRect.width} height={resizingRect.height}
            fill="currentColor" stroke="none" className="text-indicator/20" />
          <rect x={resizingRect.x} y={resizingRect.y} width={resizingRect.width} height={resizingRect.height}
            fill="none" stroke="currentColor" strokeWidth={1.5} className="text-indicator" />
          {/* Grip handles */}
          {GRIP_POSITIONS.map(({ id, getPos, cursor }) => {
            const { cx, cy } = getPos(resizingRect)
            return (
              <g key={id}>
                {/* Larger invisible hit area */}
                <rect
                  x={cx - GRIP_HIT_SIZE / 2}
                  y={cy - GRIP_HIT_SIZE / 2}
                  width={GRIP_HIT_SIZE}
                  height={GRIP_HIT_SIZE}
                  fill="transparent"
                  style={{ cursor, pointerEvents: "all" }}
                  onPointerDown={(e) => onStartGripResize?.(id, e)}
                />
                {/* Visible grip */}
                <rect
                  x={cx - GRIP_SIZE / 2}
                  y={cy - GRIP_SIZE / 2}
                  width={GRIP_SIZE}
                  height={GRIP_SIZE}
                  rx={2}
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="fill-indicator text-indicator-foreground"
                  style={{ cursor, pointerEvents: "none" }}
                />
              </g>
            )
          })}
        </g>
      )}
    </svg>
    </>
  )
}
