"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePdfViewer } from "@/client/ui/hooks/use-pdf-viewer"
import { useAdapters } from "@/client/ui/app/adapters-context"
import type { PdfOutlineItem } from "@/kernel/entities"
import { PdfSearchBar } from "./PdfSearchBar"
import { PdfTableOfContents } from "./PdfTableOfContents"
import { PdfPageNav } from "./PdfPageNav"

type PdfContentProps = {
  blobId: string
  filename: string
  currentPage: number
  totalPages: number
  onNavigatePage: (page: number) => void
}

export function PdfContent({
  blobId,
  currentPage,
  totalPages,
  onNavigatePage,
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
  const [searchCount, setSearchCount] = useState(0)

  useEffect(() => {
    if (!doc) return
    doc.getOutline().then(setOutline).catch(() => setOutline(null))
  }, [doc])

  useEffect(() => {
    if (status !== "ready") return
    let cancelled = false
    const width = containerRef.current?.clientWidth ?? 400
    renderPage(currentPage, width).then((canvas) => {
      if (cancelled || !canvas || !canvasHostRef.current) return
      canvasHostRef.current.innerHTML = ""
      canvas.style.width = "100%"
      canvas.style.height = "auto"
      canvasHostRef.current.appendChild(canvas)
    })
    preRenderAdjacent(currentPage, totalPages, width)
    return () => { cancelled = true }
  }, [status, currentPage, totalPages, renderPage, preRenderAdjacent])

  useEffect(() => {
    if (!doc || !searchQuery.trim()) {
      setSearchCount(0)
      return
    }
    pdfRenderer.searchText(doc, currentPage, searchQuery)
      .then(setSearchCount)
      .catch(() => setSearchCount(0))
  }, [doc, currentPage, searchQuery])

  const handleTocNavigate = useCallback(
    (pageNumber: number) => {
      onNavigatePage(pageNumber)
      setShowToc(false)
    },
    [onNavigatePage]
  )

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
    <div ref={containerRef} className="flex flex-col h-full">
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
        matchCount={searchCount}
        showTocToggle={!!outline && outline.length > 0}
        isTocOpen={showToc}
        onToggleToc={() => setShowToc(!showToc)}
      />
      <div ref={canvasHostRef} className="flex-1 overflow-auto p-2" />
      <PdfPageNav
        currentPage={currentPage}
        totalPages={totalPages}
        onNavigate={onNavigatePage}
      />
    </div>
  )
}
