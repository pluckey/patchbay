"use client"

import { useRef, useState } from "react"
import { Button } from "@/client/ui/components/ui/button"

type ToolbarProps = {
  onAddNode: () => void
  onAddTransform?: () => void
  onAddChat?: () => void
  onAddAiTransform?: () => void
  onUploadPdf?: (file: File) => void
  onAddSource?: () => void
  onAddAi?: () => void
  onAddCode?: () => void
  showLegacy?: boolean
}

export function Toolbar({
  onAddNode,
  onAddTransform,
  onAddChat,
  onAddAiTransform,
  onUploadPdf,
  onAddSource,
  onAddAi,
  onAddCode,
  showLegacy,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [legacyOpen, setLegacyOpen] = useState(false)

  const hasLegacy =
    showLegacy !== false &&
    (onAddNode || onAddTransform || onAddChat || onAddAiTransform || onUploadPdf)

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2 items-start">
      {onAddSource && (
        <Button onClick={onAddSource}>+ Source</Button>
      )}
      {onAddAi && (
        <Button onClick={onAddAi}>+ AI</Button>
      )}
      {onAddCode && (
        <Button onClick={onAddCode}>+ Code</Button>
      )}

      {hasLegacy && (
        <div className="flex gap-2 items-start">
          <Button
            variant="outline"
            onClick={() => setLegacyOpen((o) => !o)}
          >
            {legacyOpen ? "Legacy ▴" : "Legacy ▾"}
          </Button>
          {legacyOpen && (
            <>
              <Button variant="outline" onClick={onAddNode}>+ Markdown</Button>
              {onAddTransform && (
                <Button variant="outline" onClick={onAddTransform}>+ Transform</Button>
              )}
              {onAddChat && (
                <Button variant="outline" onClick={onAddChat}>+ Chat</Button>
              )}
              {onAddAiTransform && (
                <Button variant="outline" onClick={onAddAiTransform}>+ AI Transform</Button>
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
            </>
          )}
        </div>
      )}
    </div>
  )
}
