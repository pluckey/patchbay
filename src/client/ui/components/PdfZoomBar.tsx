"use client"

import { Button } from "@/client/ui/components/ui/button"

type PdfZoomBarProps = {
  zoomLevel: number
  darkMode: boolean
  onZoomChange: (zoomLevel: number) => void
  onDarkModeToggle: () => void
  onFitToWidth: () => void
  onFitToPage: () => void
}

const ZOOM_STEP = 0.25
const ZOOM_MIN = 0.25
const ZOOM_MAX = 4.0

export function PdfZoomBar({
  zoomLevel,
  darkMode,
  onZoomChange,
  onDarkModeToggle,
  onFitToWidth,
  onFitToPage,
}: PdfZoomBarProps) {
  const zoomOut = () => onZoomChange(Math.max(zoomLevel - ZOOM_STEP, ZOOM_MIN))
  const zoomIn = () => onZoomChange(Math.min(zoomLevel + ZOOM_STEP, ZOOM_MAX))

  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border shrink-0">
      <Button variant="ghost" size="icon-xs" onClick={zoomOut} disabled={zoomLevel <= ZOOM_MIN} title="Zoom out">
        &minus;
      </Button>
      <span className="text-xs text-muted-foreground min-w-[3ch] text-center">
        {Math.round(zoomLevel * 100)}%
      </span>
      <Button variant="ghost" size="icon-xs" onClick={zoomIn} disabled={zoomLevel >= ZOOM_MAX} title="Zoom in">
        +
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={onFitToWidth} title="Fit to width">
        ↔
      </Button>
      <Button variant="ghost" size="icon-xs" onClick={onFitToPage} title="Fit to page">
        ⊡
      </Button>
      <div className="flex-1" />
      <Button
        variant={darkMode ? "secondary" : "ghost"}
        size="icon-xs"
        onClick={onDarkModeToggle}
        title="Toggle dark mode"
      >
        ◐
      </Button>
    </div>
  )
}
