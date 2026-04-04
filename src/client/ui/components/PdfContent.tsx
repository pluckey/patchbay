"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { usePdfViewer } from "@/client/ui/hooks/use-pdf-viewer"
import { usePdfSearch } from "@/client/ui/hooks/use-pdf-search"
import { usePdfAnnotationDraw, type GripId } from "@/client/ui/hooks/use-pdf-annotation-draw"
import { useAdapters } from "@/client/ui/app/adapters-context"
import type { PdfOutlineItem, PdfAnnotation, PdfTextItem, PdfRegion } from "@/kernel/entities"
import { extractRegionText } from "@/kernel/transforms/extract-region-text"
import { screenToPdf, pdfToScreen, svgLocalCoords } from "./pdf-coordinates"
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
  onAnnotationEdit: (annotationId: string, label: string, region?: PdfRegion) => void
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
  onAnnotationEdit,
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
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null)
  const [editingRegionScreen, setEditingRegionScreen] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

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

  // Annotation draw hook — rects are SVG-local (element-relative coordinates)
  const handleAnnotationComplete = useCallback(
    (localRect: { x: number; y: number; width: number; height: number }, label: string) => {
      if (!pageDims || renderScale === 0) return
      const pdfRegion = screenToPdf(localRect, renderScale, pageDims.height)
      const text = extractRegionText(textItems, pdfRegion)
      onAnnotationCreate(currentPage, pdfRegion, label, text)
    },
    [pageDims, renderScale, textItems, currentPage, onAnnotationCreate]
  )

  const {
    annotateMode, toggleAnnotateMode,
    drawingRect, resizingRect, handlers,
    startGripResize, confirmRect,
    confirmLabel, cancelLabel, pendingRect,
  } = usePdfAnnotationDraw(handleAnnotationComplete)

  // Label input position — pendingRect is already SVG-local
  const labelPosition = pendingRect ? { x: pendingRect.x, y: pendingRect.y + pendingRect.height } : null

  // Mutual exclusion: only one label input at a time
  useEffect(() => {
    if (pendingRect && editingAnnotationId) setEditingAnnotationId(null)
  }, [pendingRect, editingAnnotationId])

  // Global keyboard shortcuts for resizing phase
  useEffect(() => {
    if (!resizingRect) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") { e.preventDefault(); confirmRect() }
      if (e.key === "Escape") { e.preventDefault(); cancelLabel() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [resizingRect, confirmRect, cancelLabel])

  // Editing existing annotation — supports both label and region editing
  const editingAnnotation = editingAnnotationId ? pageAnnotations.find((a) => a.id === editingAnnotationId) : null

  // Start editing: initialize screen rect imperatively (Fix #5 — no eslint-disable needed)
  const startEditing = useCallback((id: string) => {
    cancelLabel()
    const ann = pageAnnotations.find((a) => a.id === id)
    if (ann && pageDims && renderScale > 0) {
      setEditingRegionScreen(pdfToScreen(ann.region, renderScale, pageDims.height))
    }
    setEditingAnnotationId(id)
  }, [pageAnnotations, pageDims, renderScale, cancelLabel])

  const editPosition = useMemo(() => {
    if (!editingRegionScreen) return null
    return { x: editingRegionScreen.x, y: editingRegionScreen.y + editingRegionScreen.height }
  }, [editingRegionScreen])

  // Edit grip resize — uses ref + document listeners with unmount cleanup
  const editDragCleanupRef = useRef<(() => void) | null>(null)

  // Cleanup on unmount or when editing ends
  useEffect(() => {
    if (!editingAnnotationId) {
      editDragCleanupRef.current?.()
      editDragCleanupRef.current = null
    }
    return () => {
      editDragCleanupRef.current?.()
      editDragCleanupRef.current = null
    }
  }, [editingAnnotationId])

  const editingRegionRef = useRef(editingRegionScreen)
  editingRegionRef.current = editingRegionScreen

  const handleEditGripResize = useCallback(
    (gripId: GripId, e: React.PointerEvent) => {
      if (!editingRegionRef.current) return
      e.stopPropagation()
      e.preventDefault()

      const el = e.currentTarget as SVGElement
      const svg = el.ownerSVGElement ?? el as unknown as SVGSVGElement
      const startLocal = svgLocalCoords(svg, e.clientX, e.clientY)
      const startRect = { ...editingRegionRef.current }

      const onMove = (me: PointerEvent) => {
        const local = svgLocalCoords(svg, me.clientX, me.clientY)
        const dx = local.x - startLocal.x
        const dy = local.y - startLocal.y
        const nr = { ...startRect }
        if (gripId.includes("w")) { nr.x += dx; nr.width -= dx }
        if (gripId.includes("e")) { nr.width += dx }
        if (gripId.includes("n")) { nr.y += dy; nr.height -= dy }
        if (gripId.includes("s")) { nr.height += dy }
        nr.width = Math.max(nr.width, 10)
        nr.height = Math.max(nr.height, 10)
        setEditingRegionScreen(nr)
      }

      const cleanup = () => {
        document.removeEventListener("pointermove", onMove)
        document.removeEventListener("pointerup", onUp)
        editDragCleanupRef.current = null
      }

      const onUp = () => cleanup()

      document.addEventListener("pointermove", onMove)
      document.addEventListener("pointerup", onUp)
      editDragCleanupRef.current = cleanup
    },
    []
  )

  const handleEditConfirm = useCallback(
    (label: string) => {
      if (!editingAnnotationId || !pageDims || renderScale === 0) return
      const region = editingRegionScreen
        ? screenToPdf(editingRegionScreen, renderScale, pageDims.height)
        : undefined
      onAnnotationEdit(editingAnnotationId, label, region)
      setEditingAnnotationId(null)
      setEditingRegionScreen(null)
    },
    [editingAnnotationId, editingRegionScreen, pageDims, renderScale, onAnnotationEdit]
  )

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
            drawingRect={drawingRect}
            resizingRect={resizingRect}
            editingRect={editingRegionScreen}
            editingAnnotationId={editingAnnotationId}
            onDelete={onAnnotationDelete}
            onEdit={startEditing}
            onStartGripResize={startGripResize}
            onEditGripResize={handleEditGripResize}
            onConfirmRect={confirmRect}
            drawHandlers={annotateMode ? handlers : undefined}
          />
        )}

        {/* Label input — shown after drawing completes */}
        {labelPosition && pendingRect && (
          <PdfAnnotationLabelInput
            position={labelPosition}
            width={pendingRect.width}
            onConfirm={confirmLabel}
            onCancel={cancelLabel}
          />
        )}

        {/* Edit label input — shown when clicking an annotation label */}
        {editPosition && editingAnnotation && (
          <PdfAnnotationLabelInput
            position={editPosition}
            width={editingRegionScreen?.width}
            initialValue={editingAnnotation.label}
            onConfirm={handleEditConfirm}
            onCancel={() => setEditingAnnotationId(null)}
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
