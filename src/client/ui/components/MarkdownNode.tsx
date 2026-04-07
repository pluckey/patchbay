"use client"

import { memo } from "react"
import type { NodeProps } from "@xyflow/react"
import { NodeShell } from "./NodeShell"
import { MarkdownContent } from "./MarkdownContent"
import type { MarkdownFlowNodeData } from "@/client/adapters/canvas/flow-node-mapper"

function MarkdownNodeInner({ data }: NodeProps) {
  const { nodeId, content, onContentChange, onDelete, onDuplicate, onResizeEnd } =
    data as unknown as MarkdownFlowNodeData

  return (
    <NodeShell
      nodeId={nodeId}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onResizeEnd={onResizeEnd}
      title={
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/50 shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">Markdown</span>
        </>
      }
    >
      <MarkdownContent
        content={content}
        onContentChange={(newContent) => onContentChange(nodeId, newContent)}
      />
    </NodeShell>
  )
}

export const MarkdownNode = memo(MarkdownNodeInner)
