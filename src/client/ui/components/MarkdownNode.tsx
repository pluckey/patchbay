"use client"

import { memo } from "react"
import type { NodeProps } from "@xyflow/react"
import { NodeShell } from "./NodeShell"
import { MarkdownContent } from "./MarkdownContent"
import type { MarkdownFlowNodeData } from "@/client/adapters/canvas/flow-node-mapper"

function MarkdownNodeInner({ data }: NodeProps) {
  const { nodeId, content, isDerived, derivedContent, derivedError, onContentChange, onDelete, onResizeEnd } =
    data as unknown as MarkdownFlowNodeData

  const header = isDerived ? (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Derived</span>
    </div>
  ) : undefined

  return (
    <NodeShell nodeId={nodeId} onDelete={onDelete} onResizeEnd={onResizeEnd} header={header}>
      {isDerived ? (
        <div className="flex-1 p-3 text-sm overflow-auto">
          {derivedError ? (
            <div className="text-destructive text-xs">{derivedError}</div>
          ) : derivedContent ? (
            <pre className="whitespace-pre-wrap font-mono text-xs text-foreground">{derivedContent}</pre>
          ) : (
            <span className="text-muted-foreground italic">Waiting for transform...</span>
          )}
        </div>
      ) : (
        <MarkdownContent
          content={content}
          onContentChange={(newContent) => onContentChange(nodeId, newContent)}
        />
      )}
    </NodeShell>
  )
}

export const MarkdownNode = memo(MarkdownNodeInner)
