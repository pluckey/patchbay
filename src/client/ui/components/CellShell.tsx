"use client"

import { useState, useCallback, type ReactNode } from "react"
import { NodeResizer, Handle, Position } from "@xyflow/react"

export type CellHealth = "current" | "stale" | "error"

type CellShellProps = {
  cellId: string
  title: string
  hasInput: boolean
  health?: CellHealth
  onDelete: (cellId: string) => void
  onDuplicate: (cellId: string) => void
  onResizeEnd: (cellId: string, dimensions: { width: number; height: number }) => void
  children: ReactNode
}

function HealthDot({ health }: { health?: CellHealth }) {
  let colorClass: string
  let label: string

  switch (health) {
    case "current":
      colorClass = "bg-green-500"
      label = "current"
      break
    case "stale":
      colorClass = "bg-amber-500"
      label = "stale"
      break
    case "error":
      colorClass = "bg-red-500"
      label = "error"
      break
    default:
      colorClass = "bg-muted-foreground/50"
      label = "no output"
  }

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${colorClass}`}
      title={label}
      aria-label={`health: ${label}`}
    />
  )
}

export function CellShell({
  cellId,
  title,
  hasInput,
  health,
  onDelete,
  onDuplicate,
  onResizeEnd,
  children,
}: CellShellProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (window.confirm("Delete this cell?")) {
        onDelete(cellId)
      }
    },
    [cellId, onDelete]
  )

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDuplicate(cellId)
    },
    [cellId, onDuplicate]
  )

  return (
    <div
      className="bg-background text-foreground border border-border rounded-lg shadow-sm min-w-[200px] h-full flex flex-col relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeResizer
        minWidth={200}
        minHeight={80}
        isVisible={isHovered}
        lineClassName="!border-border"
        handleClassName="!w-2 !h-2 !bg-muted-foreground !border-border !rounded-sm"
        onResizeEnd={(_event, params) => {
          onResizeEnd(cellId, {
            width: params.width,
            height: params.height,
          })
        }}
      />

      {isHovered && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 z-10">
          <button
            onClick={handleDuplicate}
            className="w-5 h-5 bg-muted text-muted-foreground border border-border rounded-full text-xs flex items-center justify-center hover:text-foreground"
          >
            ⧉
          </button>
          <button
            onClick={handleDelete}
            className="w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center hover:opacity-90"
          >
            x
          </button>
        </div>
      )}

      <div className="shrink-0 border-b border-border bg-muted rounded-t-lg px-3 py-1.5 flex items-center gap-2">
        <HealthDot health={health} />
        <span className="text-xs font-medium text-foreground truncate flex-1">{title}</span>
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-muted-foreground !border-border"
      />

      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !bg-muted-foreground !border-border"
        />
      )}
    </div>
  )
}
