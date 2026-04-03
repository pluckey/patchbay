"use client"

import { useState, useCallback, type ReactNode } from "react"
import { NodeResizer, Handle, Position } from "@xyflow/react"

type NodeShellProps = {
  nodeId: string
  onDelete: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
  header?: ReactNode
  children: ReactNode
}

export function NodeShell({
  nodeId,
  onDelete,
  onResizeEnd,
  header,
  children,
}: NodeShellProps) {
  const [isHovered, setIsHovered] = useState(false)

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
          onResizeEnd(nodeId, {
            width: params.width,
            height: params.height,
          })
        }}
      />

      {isHovered && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center hover:opacity-90 z-10"
        >
          x
        </button>
      )}

      {header && (
        <div className="shrink-0 border-b border-border bg-muted rounded-t-lg">
          {header}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {children}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-muted-foreground !border-border"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-muted-foreground !border-border"
      />
    </div>
  )
}
