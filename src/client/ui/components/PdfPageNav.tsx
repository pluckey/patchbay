"use client"

import { Button } from "@/client/ui/components/ui/button"

type PdfPageNavProps = {
  currentPage: number
  totalPages: number
  onNavigate: (page: number) => void
}

export function PdfPageNav({ currentPage, totalPages, onNavigate }: PdfPageNavProps) {
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
      <span className="text-xs text-muted-foreground">
        {currentPage} / {totalPages}
      </span>
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
