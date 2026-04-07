"use client"

import type { ReactNode } from "react"
import { NodeChrome } from "./NodeChrome"

export type CellHealth = "current" | "stale" | "error"

type CellShellProps = {
  cellId: string
  title: string
  hasInput: boolean
  health?: CellHealth
  onDelete: (cellId: string) => void
  onDuplicate: (cellId: string) => void
  onResizeEnd: (cellId: string, dimensions: { width: number; height: number }) => void
  /**
   * Additional buttons to render in the header bar, left of the duplicate/close
   * controls. Used by code/ai cells to surface their Run button alongside the
   * window chrome.
   */
  headerActions?: ReactNode
  children: ReactNode
}

function HealthDot({ health }: { health?: CellHealth }) {
  let colorClass: string
  let label: string

  switch (health) {
    case "current":
      colorClass = "bg-primary"
      label = "current"
      break
    case "stale":
      colorClass = "bg-indicator"
      label = "stale"
      break
    case "error":
      colorClass = "bg-destructive"
      label = "error"
      break
    default:
      colorClass = "bg-muted-foreground/50"
      label = "no output"
  }

  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${colorClass}`}
      title={label}
      aria-label={`health: ${label}`}
    />
  )
}

/**
 * Thin wrapper around NodeChrome for signal-field Cell renderers. Owns the
 * cell-specific HealthDot prefix and the "cell" entity label; everything else
 * (resize handles, header bar layout, duplicate/delete buttons, I/O handles)
 * lives in NodeChrome and is shared with NodeShell.
 */
export function CellShell({
  cellId,
  title,
  hasInput,
  health,
  onDelete,
  onDuplicate,
  onResizeEnd,
  headerActions,
  children,
}: CellShellProps) {
  const titleNode = (
    <>
      <HealthDot health={health} />
      <span className="text-xs font-medium text-foreground truncate flex-1">{title}</span>
    </>
  )

  return (
    <NodeChrome
      entityId={cellId}
      entityLabel="cell"
      title={titleNode}
      headerActions={headerActions}
      hasInput={hasInput}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onResizeEnd={onResizeEnd}
    >
      {children}
    </NodeChrome>
  )
}
