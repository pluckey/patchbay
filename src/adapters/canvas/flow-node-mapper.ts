import type { Node } from "@xyflow/react"
import type { Position, WorkspaceNode } from "@/domain/entities"

export type MarkdownNodeData = {
  nodeId: string
  content: string
  onContentChange: (nodeId: string, content: string) => void
  onDelete: (nodeId: string) => void
}

export function toFlowNodes(
  nodes: WorkspaceNode[],
  onContentChange: (nodeId: string, content: string) => void,
  onDelete: (nodeId: string) => void
): Node<MarkdownNodeData>[] {
  return nodes.map((node) => ({
    id: node.id,
    type: "markdown",
    position: node.position,
    data: {
      nodeId: node.id,
      content: node.content,
      onContentChange,
      onDelete,
    },
  }))
}

export function fromNodeDragStop(node: {
  id: string
  position?: { x: number; y: number }
}): { nodeId: string; position: Position } {
  return {
    nodeId: node.id,
    position: node.position ?? { x: 0, y: 0 },
  }
}
