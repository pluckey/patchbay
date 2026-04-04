"use client"

import { useState, useRef, useCallback } from "react"

type DrawState =
  | { phase: "idle" }
  | { phase: "drawing"; startX: number; startY: number }
  | { phase: "resizing"; rect: Rect; grip: GripId | null; gripStart: { x: number; y: number } | null }
  | { phase: "labeling"; rect: Rect }

type Rect = { x: number; y: number; width: number; height: number }

type GripId = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

const MIN_DRAG_THRESHOLD = 10
const MIN_RECT_SIZE = 10

function normalizeRect(startX: number, startY: number, endX: number, endY: number): Rect {
  return {
    x: Math.min(startX, endX),
    y: Math.min(startY, endY),
    width: Math.abs(endX - startX),
    height: Math.abs(endY - startY),
  }
}

function clampRect(rect: Rect): Rect {
  return {
    x: rect.x,
    y: rect.y,
    width: Math.max(rect.width, MIN_RECT_SIZE),
    height: Math.max(rect.height, MIN_RECT_SIZE),
  }
}

function resizeByGrip(rect: Rect, grip: GripId, dx: number, dy: number): Rect {
  const r = { ...rect }
  if (grip.includes("w")) { r.x += dx; r.width -= dx }
  if (grip.includes("e")) { r.width += dx }
  if (grip.includes("n")) { r.y += dy; r.height -= dy }
  if (grip.includes("s")) { r.height += dy }
  return clampRect(r)
}

import { svgLocalCoords } from "@/client/ui/components/pdf-coordinates"

function toLocal(e: React.PointerEvent): { x: number; y: number } {
  const el = e.currentTarget as SVGElement
  const svg = ('ownerSVGElement' in el && el.ownerSVGElement) ? el.ownerSVGElement : el as SVGSVGElement
  return svgLocalCoords(svg, e.clientX, e.clientY)
}

export function usePdfAnnotationDraw(
  onComplete: (localRect: Rect, label: string) => void
) {
  const [annotateMode, setAnnotateMode] = useState(false)
  const [drawState, setDrawState] = useState<DrawState>({ phase: "idle" })
  const [drawingRect, setDrawingRect] = useState<Rect | null>(null)

  const currentMouseRef = useRef<{ x: number; y: number } | null>(null)

  const toggleAnnotateMode = useCallback(() => {
    setAnnotateMode((prev) => {
      if (prev) {
        setDrawState({ phase: "idle" })
        setDrawingRect(null)
        currentMouseRef.current = null
      }
      return !prev
    })
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!annotateMode) return
      e.stopPropagation()
      const local = toLocal(e)

      if (drawState.phase === "idle") {
        currentMouseRef.current = local
        setDrawState({ phase: "drawing", startX: local.x, startY: local.y })
        setDrawingRect(null)
        ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
      }
    },
    [annotateMode, drawState.phase]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      const local = toLocal(e)

      if (drawState.phase === "drawing") {
        currentMouseRef.current = local
        setDrawingRect(normalizeRect(drawState.startX, drawState.startY, local.x, local.y))
      } else if (drawState.phase === "resizing" && drawState.grip && drawState.gripStart) {
        const dx = local.x - drawState.gripStart.x
        const dy = local.y - drawState.gripStart.y
        const newRect = resizeByGrip(drawState.rect, drawState.grip, dx, dy)
        setDrawState({ ...drawState, rect: newRect, gripStart: local })
      }
    },
    [drawState]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      const local = toLocal(e)

      if (drawState.phase === "drawing") {
        const rect = normalizeRect(drawState.startX, drawState.startY, local.x, local.y)
        if (rect.width < MIN_DRAG_THRESHOLD && rect.height < MIN_DRAG_THRESHOLD) {
          setDrawState({ phase: "idle" })
          setDrawingRect(null)
          currentMouseRef.current = null
          return
        }
        // Transition to resizing phase — user can adjust grips before labeling
        setDrawingRect(null)
        setDrawState({ phase: "resizing", rect, grip: null, gripStart: null })
        currentMouseRef.current = null
      } else if (drawState.phase === "resizing" && drawState.grip) {
        // Finished grip drag — stay in resizing
        setDrawState({ ...drawState, grip: null, gripStart: null })
      }
    },
    [drawState]
  )

  // Called by grip elements in the annotation layer
  const startGripResize = useCallback(
    (gripId: GripId, e: React.PointerEvent) => {
      if (drawState.phase !== "resizing") return
      e.stopPropagation()
      e.preventDefault()
      const local = toLocal(e)
      setDrawState({ ...drawState, grip: gripId, gripStart: local })
      // Capture on the parent SVG so move/up handlers fire correctly
      const el = e.currentTarget as SVGElement
      const svg = el.ownerSVGElement ?? el
      svg.setPointerCapture?.(e.pointerId)
    },
    [drawState]
  )

  // Confirm the rect and move to labeling
  const confirmRect = useCallback(() => {
    if (drawState.phase !== "resizing") return
    setDrawState({ phase: "labeling", rect: drawState.rect })
  }, [drawState])

  const confirmLabel = useCallback(
    (label: string) => {
      if (drawState.phase !== "labeling") return
      onComplete(drawState.rect, label)
      setDrawState({ phase: "idle" })
    },
    [drawState, onComplete]
  )

  const cancelLabel = useCallback(() => {
    setDrawState({ phase: "idle" })
  }, [])

  // Allow external code to push into resizing mode (for editing existing annotations)
  const enterResizing = useCallback((rect: Rect) => {
    setDrawState({ phase: "resizing", rect, grip: null, gripStart: null })
  }, [])

  const pendingRect = drawState.phase === "labeling" ? drawState.rect : null
  const resizingRect = drawState.phase === "resizing" ? drawState.rect : null
  const activeGrip = drawState.phase === "resizing" ? drawState.grip : null

  return {
    annotateMode,
    toggleAnnotateMode,
    drawState,
    drawingRect,
    resizingRect,
    activeGrip,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
    startGripResize,
    confirmRect,
    confirmLabel,
    cancelLabel,
    enterResizing,
    pendingRect,
  }
}

export type { GripId, Rect }
