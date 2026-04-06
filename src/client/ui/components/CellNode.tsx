"use client"

import { useCallback, useState } from "react"
import type { Node, NodeProps } from "@xyflow/react"
import { CellShell } from "./CellShell"
import type { CellFlowNodeData } from "@/client/adapters/canvas/flow-node-mapper"

type CellNodeProps = NodeProps<Node<CellFlowNodeData>>

function OutputPreview({ data }: { data: CellFlowNodeData }) {
  const { output, cellType } = data

  if (!output) {
    return (
      <p className="text-xs text-muted-foreground italic">
        {cellType === "source" ? "No content." : "No output yet."}
      </p>
    )
  }

  if (output.status === "running") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full bg-indicator animate-pulse shrink-0" />
        <span className="text-xs text-muted-foreground">Running…</span>
      </div>
    )
  }

  if (output.status === "error") {
    return (
      <p className="text-xs text-destructive line-clamp-3 break-words">
        {output.error}
      </p>
    )
  }

  // status === "success"
  return (
    <p className="text-xs text-foreground line-clamp-3 break-words whitespace-pre-wrap">
      {output.text || <span className="text-muted-foreground italic">Empty output.</span>}
    </p>
  )
}

export function CellNode({ data }: CellNodeProps) {
  const { cellId, cellType, title, output, health, hasInput, callbacks } = data
  const [isHovered, setIsHovered] = useState(false)

  const showTrigger = (cellType === "ai" || cellType === "code") && isHovered
  const isRunning = output?.status === "running"

  const handleTrigger = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      callbacks.onTrigger(cellId)
    },
    [cellId, callbacks]
  )

  return (
    <div
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CellShell
        cellId={cellId}
        title={title}
        hasInput={hasInput}
        health={health}
        onDelete={callbacks.onDelete}
        onDuplicate={callbacks.onDuplicate}
        onResizeEnd={callbacks.onResizeEnd}
      >
        <div className="relative px-3 py-2 h-full">
          <OutputPreview data={data} />

          {showTrigger && !isRunning && (
            <div className="absolute bottom-2 right-2">
              <button
                className="nodrag px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                onClick={handleTrigger}
                title={`Run ${cellType} cell`}
              >
                Run
              </button>
            </div>
          )}
        </div>
      </CellShell>
    </div>
  )
}
