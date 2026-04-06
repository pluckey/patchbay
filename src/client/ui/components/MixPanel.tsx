'use client'

import { useState, useEffect, useCallback } from "react"
import type { MixEntry } from "@/kernel/transforms"
import { Button } from "@/client/ui/components/ui/button"

interface MixPanelProps {
  entries: MixEntry[]
}

const STORAGE_KEY = "context-canvas:mix-collapsed"

export function MixPanel({ entries }: MixPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Persist collapsed state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === "true") setCollapsed(true)
    } catch { /* ignore */ }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-l border-border bg-background py-2 px-1 shrink-0">
        <Button variant="ghost" size="icon-xs" onClick={toggleCollapsed} title="Expand The Mix">
          {/* chevron-left → "expand into the canvas" */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Button>
        <span className="text-[10px] text-muted-foreground [writing-mode:vertical-lr] select-none">
          The Mix
        </span>
      </div>
    )
  }

  return (
    <div className="w-[300px] h-full border-l border-border bg-muted overflow-y-auto flex flex-col shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <span className="text-sm font-medium text-muted-foreground select-none">The Mix</span>
        <Button variant="ghost" size="icon-xs" onClick={toggleCollapsed} title="Collapse The Mix">
          {/* chevron-right → "collapse to the right edge" */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="p-3">
          <p className="text-sm text-muted-foreground">
            No terminal cells. Connect cells to see composed output.
          </p>
        </div>
      ) : (
        <div className="flex flex-col">
          {entries.map((entry) => (
            <div key={entry.cellId} className="border-b border-border p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">{entry.title}</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{entry.output}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
