"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePdfViewer } from "@/client/ui/hooks/use-pdf-viewer"
import { usePdfSearch } from "@/client/ui/hooks/use-pdf-search"
import { useAdapters } from "@/client/ui/app/adapters-context"
import type { PdfOutlineItem } from "@/kernel/entities"
import { PdfSearchBar } from "./PdfSearchBar"
import { PdfTableOfContents } from "./PdfTableOfContents"
import { PdfPageNav } from "./PdfPageNav"
import { PdfZoomBar } from "./PdfZoomBar"

type PdfContentProps = {
  blobId: string
  filename: string
  currentPage: number
  totalPages: number
  zoomLevel: number
  darkMode: boolean
  onNavigatePage: (page: number) => void
  onZoomChange: (zoomLevel: number) => void
  onDarkModeToggle: () => void
}

export function PdfContent({
  blobId,
  currentPage,
  totalPages,
  zoomLevel,
  darkMode,
  onNavigatePage,
  onZoomChange,
  onDarkModeToggle,
}: PdfContentProps) {
  const { blobStorage, pdfRenderer } = useAdapters()
  const { status, doc, renderPage, preRenderAdjacent } = usePdfViewer({
    blobId,
    blobStorage,
    renderer: pdfRenderer,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const [outline, setOutline] = useState<PdfOutlineItem[] | null>(null)
  const [showToc, setShowToc] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

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

  useEffect(() => {
    if (status !== "ready" || hostWidth === 0) return
    let cancelled = false
    renderPage(currentPage, hostWidth, zoomLevel).then((canvas) => {
      if (cancelled || !canvas || !canvasHostRef.current) return
      canvasHostRef.current.innerHTML = ""
      canvasHostRef.current.appendChild(canvas)
    })
    preRenderAdjacent(currentPage, totalPages, hostWidth, zoomLevel)
    return () => { cancelled = true }
  }, [status, currentPage, totalPages, zoomLevel, hostWidth, renderPage, preRenderAdjacent])

  const handleTocNavigate = useCallback(
    (pageNumber: number) => {
      onNavigatePage(pageNumber)
      setShowToc(false)
    },
    [onNavigatePage]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Don't intercept when user is typing in an input
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
    // zoomLevel 1.0 = fit to container width (render scale = containerWidth / 612 * 1.0)
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
        onZoomChange={onZoomChange}
        onDarkModeToggle={onDarkModeToggle}
        onFitToWidth={handleFitToWidth}
        onFitToPage={handleFitToPage}
      />
      <div
        ref={canvasHostRef}
        className="flex-1 overflow-auto p-2"
        style={darkMode ? { filter: "invert(1) hue-rotate(180deg)" } : undefined}
      />
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
