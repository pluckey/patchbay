"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { usePdfViewer } from "@/client/ui/hooks/use-pdf-viewer"
import { usePdfSearch } from "@/client/ui/hooks/use-pdf-search"
import { usePdfAnnotationDraw } from "@/client/ui/hooks/use-pdf-annotation-draw"
import { useAdapters } from "@/client/ui/app/adapters-context"
import type { PdfOutlineItem, PdfAnnotation, PdfTextItem, PdfRegion } from "@/kernel/entities"
import { extractRegionText } from "@/kernel/transforms/extract-region-text"
import { screenToPdf } from "./pdf-coordinates"
import { PdfSearchBar } from "./PdfSearchBar"
import { PdfTableOfContents } from "./PdfTableOfContents"
import { PdfPageNav } from "./PdfPageNav"
import { PdfZoomBar } from "./PdfZoomBar"
import { PdfTextLayer } from "./PdfTextLayer"
import { PdfAnnotationLayer } from "./PdfAnnotationLayer"
import { PdfAnnotationLabelInput } from "./PdfAnnotationLabelInput"

type PdfContentProps = {
  blobId: string
  filename: string
  currentPage: number
  totalPages: number
  zoomLevel: number
  darkMode: boolean
  annotations: PdfAnnotation[]
  onNavigatePage: (page: number) => void
  onZoomChange: (zoomLevel: number) => void
  onDarkModeToggle: () => void
  onAnnotationCreate: (page: number, region: PdfRegion, label: string, text: string) => void
  onAnnotationDelete: (annotationId: string) => void
}

export function PdfContent({
  blobId,
  currentPage,
  totalPages,
  zoomLevel,
  darkMode,
  annotations,
  onNavigatePage,
  onZoomChange,
  onDarkModeToggle,
  onAnnotationCreate,
  onAnnotationDelete,
}: PdfContentProps) {
  const { blobStorage, pdfRenderer } = useAdapters()
  const { status, doc, renderPage, preRenderAdjacent } = usePdfViewer({
    blobId,
    blobStorage,
    renderer: pdfRenderer,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [outline, setOutline] = useState<PdfOutlineItem[] | null>(null)
  const [showToc, setShowToc] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [textItems, setTextItems] = useState<PdfTextItem[]>([])
  const [pageDims, setPageDims] = useState<{ width: number; height: number } | null>(null)

  const { totalMatches, currentMatchIndex, isSearching, nextMatch, prevMatch } = usePdfSearch({
    doc,
    port: pdfRenderer,
    query: searchQuery,
    onNavigatePage,
  })

  // Track canvas host content width so renders respond to node resizing
  const [hostWidth, setHostWidth] = useState(0)
  useEffect(() => {
    const host = canvasHostRef.current
    if (!host) return
    const measure = () => {
      const padding = parseFloat(getComputedStyle(host).paddingLeft) + parseFloat(getComputedStyle(host).paddingRight)
      setHostWidth(host.clientWidth - padding)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    return () => ro.disconnect()
  }, [status])

  useEffect(() => {
    if (!doc) return
    doc.getOutline().then(setOutline).catch(() => setOutline(null))
  }, [doc])

  // Fetch text items and page dimensions when page changes
  useEffect(() => {
    if (status !== "ready" || !doc) return
    let cancelled = false
    Promise.all([
      pdfRenderer.getPageTextItems(doc, currentPage),
      pdfRenderer.getPageDimensions(doc, currentPage),
    ]).then(([items, dims]) => {
      if (cancelled) return
      setTextItems(items)
      setPageDims(dims)
    }).catch(() => {
      if (!cancelled) {
        setTextItems([])
        setPageDims(null)
      }
    })
    return () => { cancelled = true }
  }, [status, doc, currentPage, pdfRenderer])

  // Render canvas
  useEffect(() => {
    if (status !== "ready" || hostWidth === 0) return
    let cancelled = false
    renderPage(currentPage, hostWidth, zoomLevel).then((canvas) => {
      if (cancelled || !canvas || !canvasRef.current) return
      canvasRef.current.innerHTML = ""
      canvasRef.current.appendChild(canvas)
    })
    preRenderAdjacent(currentPage, totalPages, hostWidth, zoomLevel)
    return () => { cancelled = true }
  }, [status, currentPage, totalPages, zoomLevel, hostWidth, renderPage, preRenderAdjacent])

  // Compute render scale (must match use-pdf-viewer.ts)
  const renderScale = hostWidth > 0 && pageDims ? Math.max((hostWidth / 612) * zoomLevel, 0.1) : 0

  // Filter annotations for current page
  const pageAnnotations = useMemo(
    () => annotations.filter((a) => a.page === currentPage),
    [annotations, currentPage]
  )

  // Annotation draw hook
  const handleAnnotationComplete = useCallback(
    (screenRect: { x: number; y: number; width: number; height: number }, label: string) => {
      if (!pageDims || renderScale === 0) return
      const topLeft = toHostRelative(screenRect.x, screenRect.y)
      const relativeRect = {
        ...topLeft,
        width: screenRect.width,
        height: screenRect.height,
      }
      const pdfRegion = screenToPdf(relativeRect, renderScale, pageDims.height)
      const text = extractRegionText(textItems, pdfRegion)
      onAnnotationCreate(currentPage, pdfRegion, label, text)
    },
    [pageDims, renderScale, textItems, currentPage, onAnnotationCreate]
  )

  const {
    annotateMode, toggleAnnotateMode,
    drawingRect, handlers,
    confirmLabel, cancelLabel, pendingRect,
  } = usePdfAnnotationDraw(handleAnnotationComplete)

  // Convert viewport coords to canvas-host content-relative (accounting for scroll + padding)
  const toHostRelative = useCallback((viewportX: number, viewportY: number) => {
    const host = canvasHostRef.current
    if (!host) return { x: 0, y: 0 }
    const hostRect = host.getBoundingClientRect()
    const paddingLeft = parseFloat(getComputedStyle(host).paddingLeft)
    const paddingTop = parseFloat(getComputedStyle(host).paddingTop)
    return {
      x: viewportX - hostRect.left - paddingLeft + host.scrollLeft,
      y: viewportY - hostRect.top - paddingTop + host.scrollTop,
    }
  }, [])

  const relativeDrawingRect = useMemo(() => {
    if (!drawingRect || !canvasHostRef.current) return null
    const topLeft = toHostRelative(drawingRect.x, drawingRect.y)
    return { ...topLeft, width: drawingRect.width, height: drawingRect.height }
  }, [drawingRect, toHostRelative])

  const labelPosition = useMemo(() => {
    if (!pendingRect || !canvasHostRef.current) return null
    const bottomLeft = toHostRelative(pendingRect.x, pendingRect.y + pendingRect.height)
    return bottomLeft
  }, [pendingRect, toHostRelative])

  const handleTocNavigate = useCallback(
    (pageNumber: number) => {
      onNavigatePage(pageNumber)
      setShowToc(false)
    },
    [onNavigatePage]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return

      switch (e.key) {
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault()
          if (currentPage > 1) onNavigatePage(currentPage - 1)
          break
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
          e.preventDefault()
          if (currentPage < totalPages) onNavigatePage(currentPage + 1)
          break
      }
    },
    [currentPage, totalPages, onNavigatePage]
  )

  const handleFitToWidth = useCallback(() => {
    onZoomChange(1)
  }, [onZoomChange])

  const handleFitToPage = useCallback(async () => {
    if (!doc || !canvasHostRef.current || hostWidth === 0) return
    const hostHeight = canvasHostRef.current.clientHeight
    const dims = await pdfRenderer.getPageDimensions(doc, currentPage)
    const baseScale = hostWidth / dims.width
    const heightZoom = hostHeight / (baseScale * dims.height)
    onZoomChange(Math.min(1, heightZoom))
  }, [doc, currentPage, pdfRenderer, onZoomChange, hostWidth])

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center p-3">
        <div className="text-sm text-muted-foreground">Loading PDF...</div>
      </div>
    )
  }

  if (status === "unavailable") {
    return (
      <div className="flex-1 flex items-center justify-center p-3">
        <div className="text-sm text-muted-foreground">
          PDF unavailable — the file could not be loaded.
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full outline-none" tabIndex={0} onKeyDown={handleKeyDown}>
      {outline && (
        <PdfTableOfContents
          outline={outline}
          isOpen={showToc}
          onClose={() => setShowToc(false)}
          onNavigate={handleTocNavigate}
        />
      )}
      <PdfSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalMatches={totalMatches}
        currentMatchIndex={currentMatchIndex}
        isSearching={isSearching}
        onNextMatch={nextMatch}
        onPrevMatch={prevMatch}
        showTocToggle={!!outline && outline.length > 0}
        isTocOpen={showToc}
        onToggleToc={() => setShowToc(!showToc)}
      />
      <PdfZoomBar
        zoomLevel={zoomLevel}
        darkMode={darkMode}
        annotateMode={annotateMode}
        onZoomChange={onZoomChange}
        onDarkModeToggle={onDarkModeToggle}
        onToggleAnnotate={toggleAnnotateMode}
        onFitToWidth={handleFitToWidth}
        onFitToPage={handleFitToPage}
      />
      <div
        ref={canvasHostRef}
        className="flex-1 overflow-auto p-2 relative"
        style={darkMode ? { filter: "invert(1) hue-rotate(180deg)" } : undefined}
      >
        {/* Canvas container — imperatively managed, React does not touch this */}
        <div ref={canvasRef} />

        {/* Text layer — transparent text for native selection (hidden in annotate mode) */}
        {pageDims && !annotateMode && (
          <PdfTextLayer
            textItems={textItems}
            scale={renderScale}
            pageHeight={pageDims.height}
          />
        )}

        {/* Annotation layer — SVG overlay for annotations + drawing */}
        {pageDims && (
          <PdfAnnotationLayer
            annotations={pageAnnotations}
            scale={renderScale}
            pageHeight={pageDims.height}
            drawMode={annotateMode}
            drawingRect={relativeDrawingRect}
            onDelete={onAnnotationDelete}
            drawHandlers={annotateMode ? handlers : undefined}
          />
        )}

        {/* Label input — shown after drawing completes */}
        {labelPosition && (
          <PdfAnnotationLabelInput
            position={labelPosition}
            onConfirm={confirmLabel}
            onCancel={cancelLabel}
          />
        )}
      </div>
      <div className="h-0.5 bg-muted shrink-0">
        <div
          className="h-full bg-indicator transition-all duration-200"
          style={{ width: `${(currentPage / totalPages) * 100}%` }}
        />
      </div>
      <PdfPageNav
        currentPage={currentPage}
        totalPages={totalPages}
        onNavigate={onNavigatePage}
      />
    </div>
  )
}
