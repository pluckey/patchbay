import type { WorkspaceNode, Connection } from "@/kernel/entities"
import { removeNode } from "@/kernel/transforms/remove-node"
import { removeNodeConnections } from "@/kernel/transforms/remove-node-connections"

type RemoveResult = {
  updatedNodes: WorkspaceNode[]
  updatedConnections: Connection[]
  blobIdsToDelete: string[]
}

export function removeNodeWithCleanup(
  nodes: WorkspaceNode[],
  nodeId: string,
  connections: Connection[] = []
): RemoveResult {
  const node = nodes.find((n) => n.id === nodeId)
  const blobIdsToDelete = node?.type === "pdf" ? [node.blobId] : []
  const updatedNodes = removeNode(nodes, nodeId)
  const updatedConnections = removeNodeConnections(connections, nodeId)
  return { updatedNodes, updatedConnections, blobIdsToDelete }
}
