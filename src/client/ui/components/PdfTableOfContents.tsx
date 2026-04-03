"use client"

import { Button } from "@/client/ui/components/ui/button"
import type { PdfOutlineItem } from "@/kernel/entities"

type PdfTableOfContentsProps = {
  outline: PdfOutlineItem[]
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: number) => void
}

export function PdfTableOfContents({ outline, isOpen, onClose, onNavigate }: PdfTableOfContentsProps) {
  if (!isOpen) return null

  return (
    <div className="absolute inset-0 z-20 bg-background/95 overflow-auto p-3 rounded-b-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground">Contents</span>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>x</Button>
      </div>
      <TocList items={outline} onSelect={onNavigate} />
    </div>
  )
}

function TocList({ items, onSelect, depth = 0 }: {
  items: PdfOutlineItem[]
  onSelect: (page: number) => void
  depth?: number
}) {
  return (
    <ul className={depth > 0 ? "ml-3" : ""}>
      {items.map((item, i) => (
        <li key={`${item.pageNumber}-${i}`}>
          <button
            onClick={() => onSelect(item.pageNumber)}
            className="text-xs text-left w-full px-1 py-0.5 rounded hover:bg-muted text-foreground truncate"
          >
            {item.title}
          </button>
          {item.children && <TocList items={item.children} onSelect={onSelect} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  )
}
