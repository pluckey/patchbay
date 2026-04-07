"use client"

import type { ReactNode } from "react"
import { NodeChrome } from "./NodeChrome"

type NodeShellProps = {
  nodeId: string
  /**
   * Left side of the title bar — typically a status indicator + node-type
   * label, e.g. `<>● Transform</>`. Mirrors CellShell's title slot so cell
   * and legacy node chrome look the same.
   */
  title?: ReactNode
  /**
   * Custom controls between the title and the duplicate/close buttons —
   * model picker, timeout selector, re-run button, etc. Always visible.
   */
  headerActions?: ReactNode
  onDelete: (nodeId: string) => void
  onDuplicate: (nodeId: string) => void
  onResizeEnd: (nodeId: string, dimensions: { width: number; height: number }) => void
  children: ReactNode
}

/**
 * Thin wrapper around NodeChrome for legacy WorkspaceNode renderers. Exists
 * to keep the legacy `nodeId` prop name and "node" entity label localised so
 * call sites in MarkdownNode/PdfNode/TransformNode/ChatNode/AiTransformNode
 * don't need to know about the shared chrome component.
 */
export function NodeShell({
  nodeId,
  title,
  headerActions,
  onDelete,
  onDuplicate,
  onResizeEnd,
  children,
}: NodeShellProps) {
  return (
    <NodeChrome
      entityId={nodeId}
      entityLabel="node"
      title={title}
      headerActions={headerActions}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onResizeEnd={onResizeEnd}
    >
      {children}
    </NodeChrome>
  )
}
