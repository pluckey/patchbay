"use client"

import { memo, useState, useRef, useEffect, useCallback } from "react"
import type { NodeProps } from "@xyflow/react"
import ReactMarkdown from "react-markdown"
import type { MarkdownNodeData } from "@/adapters/canvas/flow-node-mapper"

function MarkdownNodeInner({ data }: NodeProps) {
  const { nodeId, content, onContentChange, onDelete } =
    data as unknown as MarkdownNodeData
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Sync draft when content changes externally
  useEffect(() => {
    if (!isEditing) {
      setDraft(content)
    }
  }, [content, isEditing])

  // Auto-focus textarea on edit
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [isEditing])

  const commitEdit = useCallback(() => {
    setIsEditing(false)
    if (draft !== content) {
      onContentChange(nodeId, draft)
    }
  }, [draft, content, nodeId, onContentChange])

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setIsEditing(true)
    },
    []
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        commitEdit()
      }
      // Stop propagation so xyflow doesn't capture key events
      e.stopPropagation()
    },
    [commitEdit]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isEditing) {
        // Prevent xyflow from starting a drag while editing
        e.stopPropagation()
      }
    },
    [isEditing]
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (window.confirm("Delete this node?")) {
        onDelete(nodeId)
      }
    },
    [nodeId, onDelete]
  )

  return (
    <div
      className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-sm min-w-[200px] max-w-[400px] relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
      onPointerDown={handlePointerDown}
    >
      {/* Delete button */}
      {isHovered && !isEditing && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 z-10"
        >
          x
        </button>
      )}

      <div className="p-3">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full min-h-[100px] resize-y border-none outline-none bg-gray-50 dark:bg-zinc-800 dark:text-zinc-100 rounded p-2 font-mono text-sm"
            placeholder="Write markdown here..."
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none min-h-[40px]">
            {content ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 dark:text-zinc-500 italic">
                Double-click to edit...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const MarkdownNode = memo(MarkdownNodeInner)
