"use client"

import { useEffect, useRef } from "react"

type PdfAnnotationLabelInputProps = {
  position: { x: number; y: number }
  onConfirm: (label: string) => void
  onCancel: () => void
}

export function PdfAnnotationLabelInput({
  position,
  onConfirm,
  onCancel,
}: PdfAnnotationLabelInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onCancel()
      }
    }
    document.addEventListener("pointerdown", handleClickOutside)
    return () => document.removeEventListener("pointerdown", handleClickOutside)
  }, [onCancel])

  return (
    <div
      ref={containerRef}
      className="nodrag"
      style={{
        position: "absolute",
        left: position.x + 4,
        top: position.y + 4,
        zIndex: 10,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <input
        ref={inputRef}
        type="text"
        placeholder="Label..."
        className="bg-background border border-input text-foreground text-xs rounded px-2 py-1"
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === "Enter") {
            const value = (e.target as HTMLInputElement).value.trim()
            if (value) {
              onConfirm(value)
            }
          } else if (e.key === "Escape") {
            onCancel()
          }
        }}
      />
    </div>
  )
}
