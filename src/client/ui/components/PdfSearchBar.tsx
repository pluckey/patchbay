"use client"

import { Button } from "@/client/ui/components/ui/button"

type PdfSearchBarProps = {
  searchQuery: string
  onSearchChange: (query: string) => void
  totalMatches: number
  currentMatchIndex: number
  isSearching: boolean
  onNextMatch: () => void
  onPrevMatch: () => void
  showTocToggle: boolean
  isTocOpen: boolean
  onToggleToc: () => void
}

export function PdfSearchBar({
  searchQuery,
  onSearchChange,
  totalMatches,
  currentMatchIndex,
  isSearching,
  onNextMatch,
  onPrevMatch,
  showTocToggle,
  isTocOpen,
  onToggleToc,
}: PdfSearchBarProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 border-b border-border shrink-0">
      {showTocToggle && (
        <Button variant="ghost" size="icon-xs" onClick={onToggleToc} title="Table of Contents">
          ☰
        </Button>
      )}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        placeholder="Search..."
        className="flex-1 text-xs bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
      />
      {searchQuery && (
        <>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {isSearching
              ? `${totalMatches}...`
              : totalMatches > 0
                ? `${currentMatchIndex} of ${totalMatches}`
                : "0 matches"}
          </span>
          {totalMatches > 0 && (
            <>
              <Button variant="ghost" size="icon-xs" onClick={onPrevMatch} title="Previous match">
                ↑
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={onNextMatch} title="Next match">
                ↓
              </Button>
            </>
          )}
        </>
      )}
    </div>
  )
}
