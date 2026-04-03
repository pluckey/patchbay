"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/client/ui/components/ui/button"

type PdfPageNavProps = {
  currentPage: number
  totalPages: number
  onNavigate: (page: number) => void
}

export function PdfPageNav({ currentPage, totalPages, onNavigate }: PdfPageNavProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const startEditing = useCallback(() => {
    setEditValue(String(currentPage))
    setIsEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }, [currentPage])

  const commitEdit = useCallback(() => {
    setIsEditing(false)
    const parsed = parseInt(editValue, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onNavigate(parsed)
    }
  }, [editValue, totalPages, onNavigate])

  const cancelEdit = useCallback(() => {
    setIsEditing(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === "Enter") commitEdit()
      if (e.key === "Escape") cancelEdit()
    },
    [commitEdit, cancelEdit]
  )

  return (
    <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-border shrink-0">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onNavigate(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        &lt;
      </Button>
      {isEditing ? (
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onPointerDown={(e) => e.stopPropagation()}
          min={1}
          max={totalPages}
          className="w-10 text-xs text-center bg-transparent border border-input rounded px-1 py-0.5 text-foreground outline-none"
        />
      ) : (
        <button
          onClick={startEditing}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-text"
          title="Click to jump to page"
        >
          {currentPage} / {totalPages}
        </button>
      )}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onNavigate(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        &gt;
      </Button>
    </div>
  )
}
