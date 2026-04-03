"use client"

import { useState, useRef, useEffect } from "react"
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react"
import { validateConnectionLabel } from "@/kernel/transforms/update-connection-label"

type LabeledEdgeData = {
  label: string
  onLabelChange: (connectionId: string, label: string) => void
}

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const { label, onLabelChange } = (data ?? {}) as LabeledEdgeData
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(label ?? "")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing) setDraft(label ?? "")
  }, [label, isEditing])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  })

  const [error, setError] = useState<string | null>(null)

  const handleBlur = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== label) {
      const validation = validateConnectionLabel(trimmed)
      if (!validation.valid) {
        setError(validation.reason)
        return
      }
      setError(null)
      onLabelChange(id, trimmed)
    }
    setError(null)
    setIsEditing(false)
  }

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ stroke: selected ? "var(--color-primary)" : "var(--color-border)", strokeWidth: selected ? 2 : 1.5 }} />
      <foreignObject
        x={labelX - 60}
        y={labelY - 10}
        width={120}
        height={isEditing && error ? 36 : 20}
        className="overflow-visible"
      >
        {isEditing ? (
          <div>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setError(null) }}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === "Enter") handleBlur()
                if (e.key === "Escape") { setDraft(label ?? ""); setError(null); setIsEditing(false) }
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`w-full text-[10px] font-mono bg-background border rounded px-1 py-0.5 text-foreground outline-none text-center ${error ? "border-destructive" : "border-input"}`}
            />
            {error && <div className="text-[8px] text-destructive text-center mt-0.5">{error}</div>}
          </div>
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="text-[10px] font-mono text-muted-foreground text-center cursor-pointer bg-background/80 rounded px-1 py-0.5 truncate"
          >
            {label}
          </div>
        )}
      </foreignObject>
    </>
  )
}
