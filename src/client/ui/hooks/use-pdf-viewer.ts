"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import type { PdfDocument } from "@/kernel/entities"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"

const MAX_CACHE_SIZE = 5

type PdfViewerState =
  | { status: "loading" }
  | { status: "ready"; doc: PdfDocument }
  | { status: "unavailable" }

type UsePdfViewerArgs = {
  blobId: string
  blobStorage: BlobStoragePort
  renderer: PdfRendererPort
}

export function usePdfViewer({ blobId, blobStorage, renderer }: UsePdfViewerArgs) {
  const [state, setState] = useState<PdfViewerState>({ status: "loading" })
  const docRef = useRef<PdfDocument | null>(null)
  // LRU page cache: Map preserves insertion order, most recently used at end
  const pageCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map())

  // Load document on mount
  useEffect(() => {
    let destroyed = false

    async function load() {
      try {
        const blob = await blobStorage.retrieve(blobId)
        if (!blob || destroyed) {
          if (!destroyed) setState({ status: "unavailable" })
          return
        }
        const doc = await renderer.loadDocument(blob)
        if (destroyed) {
          await doc.destroy()
          return
        }
        docRef.current = doc
        setState({ status: "ready", doc })
      } catch {
        if (!destroyed) setState({ status: "unavailable" })
      }
    }

    load()

    return () => {
      destroyed = true
      if (docRef.current) {
        docRef.current.destroy()
        docRef.current = null
      }
      pageCacheRef.current.clear()
    }
  }, [blobId, blobStorage, renderer])

  const getCacheKey = (pageNum: number, width: number, zoom: number) => `${pageNum}:${width}:${zoom}`

  // Render a page — serves from cache if available, evicts LRU if full
  const renderPage = useCallback(
    async (pageNum: number, containerWidth: number, zoomLevel: number = 1.0): Promise<HTMLCanvasElement | null> => {
      if (state.status !== "ready") return null

      const cache = pageCacheRef.current
      const key = getCacheKey(pageNum, containerWidth, zoomLevel)

      // Cache hit — move to end (most recently used)
      if (cache.has(key)) {
        const canvas = cache.get(key)!
        cache.delete(key)
        cache.set(key, canvas)
        return canvas
      }

      // Cache miss — render
      try {
        const scale = Math.max((containerWidth / 612) * zoomLevel, 0.5)
        const canvas = await renderer.renderPage(state.doc, pageNum, scale)

        // Evict LRU if cache is full
        if (cache.size >= MAX_CACHE_SIZE) {
          const oldest = cache.keys().next().value
          if (oldest !== undefined) cache.delete(oldest)
        }
        cache.set(key, canvas)

        return canvas
      } catch {
        return null
      }
    },
    [state, renderer]
  )

  // Pre-render adjacent pages in the background
  const preRenderAdjacent = useCallback(
    (currentPage: number, totalPages: number, containerWidth: number, zoomLevel: number = 1.0) => {
      if (state.status !== "ready") return

      const pagesToPreRender = [currentPage - 1, currentPage + 1].filter(
        (p) => p >= 1 && p <= totalPages
      )

      for (const page of pagesToPreRender) {
        const key = getCacheKey(page, containerWidth, zoomLevel)
        if (!pageCacheRef.current.has(key)) {
          renderPage(page, containerWidth, zoomLevel).catch(() => {})
        }
      }
    },
    [state, renderPage]
  )

  return {
    status: state.status,
    doc: state.status === "ready" ? state.doc : null,
    renderPage,
    preRenderAdjacent,
  }
}
