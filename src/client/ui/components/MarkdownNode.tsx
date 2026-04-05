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
    <NodeShell nodeId={nodeId} onDelete={onDelete} onDuplicate={onDuplicate} onResizeEnd={onResizeEnd}>
      <MarkdownContent
        content={content}
        onContentChange={(newContent) => onContentChange(nodeId, newContent)}
      />
    </NodeShell>
  )
}

export const MarkdownNode = memo(MarkdownNodeInner)
