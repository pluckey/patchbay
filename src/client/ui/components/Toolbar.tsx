"use client"

import { useRef } from "react"
import { Button } from "@/client/ui/components/ui/button"

type ToolbarProps = {
  onAddNode: () => void
  onAddChat?: () => void
  onUploadPdf?: (file: File) => void
}

export function Toolbar({ onAddNode, onAddChat, onUploadPdf }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2">
      <Button onClick={onAddNode}>+ Markdown</Button>
      {onAddChat && (
        <Button variant="outline" onClick={onAddChat}>+ Chat</Button>
      )}
      {onUploadPdf && (
        <>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            + PDF
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                onUploadPdf(file)
                e.target.value = ""
              }
            }}
          />
        </>
      )}
    </div>
  )
}
