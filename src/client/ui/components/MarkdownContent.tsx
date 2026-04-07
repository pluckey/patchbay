"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Switch } from "@/client/ui/components/ui/switch"
import { MarkdownView } from "./MarkdownView"

type MarkdownContentProps = {
  content: string
  onContentChange: (content: string) => void
}

export function MarkdownContent({ content, onContentChange }: MarkdownContentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!isEditing) {
      setDraft(content)
    }
  }, [content, isEditing])

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [isEditing])

  const toggleEdit = useCallback(
    (checked: boolean) => {
      if (!checked && draft !== content) {
        onContentChange(draft)
      }
      setIsEditing(checked)
    },
    [draft, content, onContentChange]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        toggleEdit(false)
      }
      e.stopPropagation()
    },
    [toggleEdit]
  )

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0 bg-muted">
        <Switch checked={isEditing} onCheckedChange={toggleEdit} />
        <span className="text-xs text-muted-foreground">Edit</span>
      </div>
      <div
        className={`flex-1 p-3 text-sm ${isEditing ? "overflow-hidden flex flex-col bg-muted rounded" : "overflow-auto"}`}
        onPointerDown={isEditing ? (e) => e.stopPropagation() : undefined}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full h-full min-h-[60px] resize-none border-none outline-none bg-transparent text-foreground"
            placeholder="Write markdown here..."
          />
        ) : (
          <div className="min-h-[40px]">
            {content ? (
              <MarkdownView content={content} />
            ) : (
              <p className="text-muted-foreground italic">
                Toggle edit to add content...
              </p>
            )}
          </div>
        )}
      </div>
    </>
  )
}
