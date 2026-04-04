"use client"

import { useState, useRef, useCallback } from "react"

type DrawState =
  | { phase: "idle" }
  | { phase: "drawing"; startX: number; startY: number }
  | { phase: "labeling"; rect: { x: number; y: number; width: number; height: number } }

type Rect = { x: number; y: number; width: number; height: number }

const MIN_DRAG_THRESHOLD = 10

function normalizeRect(startX: number, startY: number, endX: number, endY: number): Rect {
  const x = Math.min(startX, endX)
  const y = Math.min(startY, endY)
  const width = Math.abs(endX - startX)
  const height = Math.abs(endY - startY)
  return { x, y, width, height }
}

export function usePdfAnnotationDraw(
  onComplete: (screenRect: Rect, label: string) => void
) {
  const [annotateMode, setAnnotateMode] = useState(false)
  const [drawState, setDrawState] = useState<DrawState>({ phase: "idle" })
  const [drawingRect, setDrawingRect] = useState<Rect | null>(null)

  const currentMouseRef = useRef<{ x: number; y: number } | null>(null)

  const toggleAnnotateMode = useCallback(() => {
    setAnnotateMode((prev) => {
      if (prev) {
        // Turning off — reset everything
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
      if (drawState.phase !== "idle") return

      const startX = e.clientX
      const startY = e.clientY
      currentMouseRef.current = { x: startX, y: startY }
      setDrawState({ phase: "drawing", startX, startY })
      setDrawingRect(null)
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    },
    [annotateMode, drawState.phase]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (drawState.phase !== "drawing") return

      const endX = e.clientX
      const endY = e.clientY
      currentMouseRef.current = { x: endX, y: endY }

      const rect = normalizeRect(drawState.startX, drawState.startY, endX, endY)
      setDrawingRect(rect)
    },
    [drawState]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (drawState.phase !== "drawing") return

      const endX = e.clientX
      const endY = e.clientY
      const rect = normalizeRect(drawState.startX, drawState.startY, endX, endY)

      // Check minimum drag threshold
      if (rect.width < MIN_DRAG_THRESHOLD && rect.height < MIN_DRAG_THRESHOLD) {
        setDrawState({ phase: "idle" })
        setDrawingRect(null)
        currentMouseRef.current = null
        return
      }

      setDrawingRect(null)
      setDrawState({ phase: "labeling", rect })
      currentMouseRef.current = null
    },
    [drawState]
  )

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

  const pendingRect = drawState.phase === "labeling" ? drawState.rect : null

  return {
    annotateMode,
    toggleAnnotateMode,
    drawState,
    drawingRect,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
    confirmLabel,
    cancelLabel,
    pendingRect,
  }
}
