"use client"

import { memo, useState, lazy, Suspense } from "react"
import type { NodeProps } from "@xyflow/react"
import { NodeShell } from "./NodeShell"
import type { TransformFlowNodeData } from "@/client/adapters/canvas/flow-node-mapper"

const TransformCodeEditor = lazy(() =>
  import("./TransformCodeEditor").then((m) => ({ default: m.TransformCodeEditor }))
)

function TransformNodeInner({ data }: NodeProps) {
  const { nodeId, transformCode, transformResult, sourceNodeType, onTransformCodeChange, onDelete, onResizeEnd } =
    data as unknown as TransformFlowNodeData
  const [isEditing, setIsEditing] = useState(false)

  const statusColor =
    !transformResult ? "bg-muted-foreground" :
    transformResult.status === "success" ? "bg-primary" :
    "bg-destructive"

  const header = (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
        Transform
      </span>
      {sourceNodeType && (
        <span className="text-[10px] text-muted-foreground">
          {sourceNodeType} source
        </span>
      )}
      <button
        className="ml-auto text-[10px] text-muted-foreground hover:text-foreground"
        onClick={() => setIsEditing(!isEditing)}
      >
        {isEditing ? "done" : "edit"}
      </button>
    </div>
  )

  return (
    <NodeShell nodeId={nodeId} onDelete={onDelete} onResizeEnd={onResizeEnd} header={header}>
      <div className="p-2 gap-1 h-full" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {isEditing ? (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">Loading editor...</div>}>
            <TransformCodeEditor
              value={transformCode}
              sourceNodeType={sourceNodeType ?? "markdown"}
              onChange={(code) => onTransformCodeChange(nodeId, code)}
              onClose={() => setIsEditing(false)}
            />
          </Suspense>
        ) : (
          <pre
            className="flex-1 text-xs font-mono text-muted-foreground whitespace-pre-wrap cursor-pointer overflow-auto"
            onClick={() => setIsEditing(true)}
          >
            {transformCode}
          </pre>
        )}
        {transformResult?.status === "error" && (
          <div className="text-destructive text-[10px] border-t border-border pt-1 truncate">
            {transformResult.message}
          </div>
        )}
      </div>
    </NodeShell>
  )
}

export const TransformNode = memo(TransformNodeInner)
