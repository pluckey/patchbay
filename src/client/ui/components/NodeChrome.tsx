"use client"

import { useState, useCallback, type ReactNode } from "react"
import { NodeResizer } from "@xyflow/react"
import { Copy, X } from "lucide-react"
import { NodeIOHandles } from "./NodeIOHandles"

type NodeChromeProps = {
  /** ID of the underlying node or cell — passed to the lifecycle callbacks. */
  entityId: string
  /**
   * Singular noun used in the delete confirm dialog and aria labels:
   * "Delete this {entityLabel}?". Plain string — the chrome doesn't branch
   * on the value, so a closed union would only buy false safety. Today's
   * call sites pass "node" (NodeShell) and "cell" (CellShell); future
   * entities can pass anything they like.
   */
  entityLabel: string
  /**
   * Title bar content — typically status indicator + label. Already-composed
   * ReactNode so callers can prepend a HealthDot, status pill, etc.
   */
  title?: ReactNode
  /**
   * Custom controls between the title and the duplicate/close buttons —
   * model picker, run button, mode toggle, etc. Always visible.
   */
  headerActions?: ReactNode
  /** Whether to render input (target) handles. False for source-only cells. */
  hasInput?: boolean
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onResizeEnd: (id: string, dimensions: { width: number; height: number }) => void
  children: ReactNode
}

/**
 * The single source of truth for canvas-node visual chrome: outer card,
 * resize handles, header bar (title + actions + duplicate/delete), and the
 * I/O attachment points. Both NodeShell and CellShell collapse to thin
 * wrappers around this so the two systems stay visually identical without
 * duplicated DOM/styles. The strangler-fig boundary between legacy nodes
 * and signal-field cells is enforced at the data layer (validateConnection,
 * flow-node-mapper) — not here.
 */
export function NodeChrome({
  entityId,
  entityLabel,
  title,
  headerActions,
  hasInput = true,
  onDelete,
  onDuplicate,
  onResizeEnd,
  children,
}: NodeChromeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (window.confirm(`Delete this ${entityLabel}?`)) {
        onDelete(entityId)
      }
    },
    [entityId, entityLabel, onDelete]
  )

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDuplicate(entityId)
    },
    [entityId, onDuplicate]
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
          onResizeEnd(entityId, {
            width: params.width,
            height: params.height,
          })
        }}
      />

      <div className="shrink-0 border-b border-border bg-muted rounded-t-lg px-2 py-1 flex items-center gap-1.5">
        <div className="flex-1 min-w-0 flex items-center gap-1.5">{title}</div>
        {headerActions}
        <button
          type="button"
          onClick={handleDuplicate}
          onPointerDown={(e) => e.stopPropagation()}
          className="nodrag flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          title={`Duplicate ${entityLabel}`}
          aria-label={`Duplicate ${entityLabel}`}
        >
          <Copy size={12} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          onPointerDown={(e) => e.stopPropagation()}
          className="nodrag flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
          title={`Delete ${entityLabel}`}
          aria-label={`Delete ${entityLabel}`}
        >
          <X size={12} />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>

      <NodeIOHandles hasInput={hasInput} />
    </div>
  )
}
