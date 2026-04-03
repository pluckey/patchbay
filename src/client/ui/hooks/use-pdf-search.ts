"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { PdfDocument } from "@/kernel/entities"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"
import { searchPdfDocument, type PageMatchResult } from "@/client/domain/use-cases/search-pdf-document"

type UsePdfSearchArgs = {
  doc: PdfDocument | null
  port: PdfRendererPort
  query: string
  onNavigatePage: (page: number) => void
}

type PdfSearchState = {
  results: PageMatchResult[]
  totalMatches: number
  currentMatchIndex: number
  isSearching: boolean
}

export function usePdfSearch({ doc, port, query, onNavigatePage }: UsePdfSearchArgs) {
  const [state, setState] = useState<PdfSearchState>({
    results: [],
    totalMatches: 0,
    currentMatchIndex: 0,
    isSearching: false,
  })
  const searchIdRef = useRef(0)

  useEffect(() => {
    if (!doc || !query.trim()) {
      setState({ results: [], totalMatches: 0, currentMatchIndex: 0, isSearching: false })
      return
    }

    const searchId = ++searchIdRef.current
    setState((prev) => ({ ...prev, isSearching: true, results: [], totalMatches: 0, currentMatchIndex: 0 }))

    searchPdfDocument(port, doc, query, (progressResults) => {
      if (searchIdRef.current !== searchId) return
      const total = progressResults.reduce((sum, r) => sum + r.count, 0)
      setState((prev) => ({ ...prev, results: [...progressResults], totalMatches: total }))
    }).then((finalResults) => {
      if (searchIdRef.current !== searchId) return
      const total = finalResults.reduce((sum, r) => sum + r.count, 0)
      setState({ results: finalResults, totalMatches: total, currentMatchIndex: total > 0 ? 1 : 0, isSearching: false })
    }).catch(() => {
      if (searchIdRef.current !== searchId) return
      setState({ results: [], totalMatches: 0, currentMatchIndex: 0, isSearching: false })
    })

    return () => { searchIdRef.current++ }
  }, [doc, query, port])

  const navigateToMatchIndex = useCallback(
    (index: number) => {
      if (state.totalMatches === 0) return
      // Wrap around
      const wrapped = ((index - 1 + state.totalMatches) % state.totalMatches) + 1
      setState((prev) => ({ ...prev, currentMatchIndex: wrapped }))

      // Find which page this match is on
      let remaining = wrapped
      for (const result of state.results) {
        if (remaining <= result.count) {
          onNavigatePage(result.page)
          return
        }
        remaining -= result.count
      }
    },
    [state.totalMatches, state.results, onNavigatePage]
  )

  const nextMatch = useCallback(() => {
    navigateToMatchIndex(state.currentMatchIndex + 1)
  }, [state.currentMatchIndex, navigateToMatchIndex])

  const prevMatch = useCallback(() => {
    navigateToMatchIndex(state.currentMatchIndex - 1)
  }, [state.currentMatchIndex, navigateToMatchIndex])

  return {
    totalMatches: state.totalMatches,
    currentMatchIndex: state.currentMatchIndex,
    isSearching: state.isSearching,
    nextMatch,
    prevMatch,
  }
}
