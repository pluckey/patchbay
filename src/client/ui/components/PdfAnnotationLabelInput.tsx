"use client"

import { useEffect, useRef } from "react"

type PdfAnnotationLabelInputProps = {
  position: { x: number; y: number }
  width?: number
  initialValue?: string
  onConfirm: (label: string) => void
  onCancel: () => void
}

const MIN_WIDTH = 320 // ~20em at default font size

export function PdfAnnotationLabelInput({
  position,
  width,
  initialValue,
  onConfirm,
  onCancel,
}: PdfAnnotationLabelInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
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

  const handleSubmit = () => {
    const value = textareaRef.current?.value.trim()
    if (value) onConfirm(value)
  }

  const inputWidth = Math.max(width ?? MIN_WIDTH, MIN_WIDTH)

  return (
    <div
      ref={containerRef}
      className="nodrag"
      style={{
        position: "absolute",
        left: position.x,
        top: position.y + 4,
        zIndex: 10,
        width: inputWidth,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        defaultValue={initialValue ?? ""}
        placeholder="Annotation..."
        rows={3}
        className="bg-background border border-input text-foreground text-xs rounded px-2 py-1 resize-none w-full"
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
          } else if (e.key === "Escape") {
            onCancel()
          }
        }}
      />
      <div className="text-[9px] text-muted-foreground mt-0.5">
        Enter to save · Shift+Enter for newline · Esc to cancel
      </div>
    </div>
  )
}
