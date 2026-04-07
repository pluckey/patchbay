"use client"

import { Handle, Position } from "@xyflow/react"

/**
 * The four canvas attachment-point identifiers, exported so any future call
 * site (programmatic edge creation, layout helpers, tests) imports the
 * constant instead of re-typing the literal strings. These ids are written
 * into Connection.sourcePort/targetPort and round-trip through persistence,
 * so changing them is a storage-envelope migration — keep them stable.
 */
export const PORT_IDS = {
  OUT_RIGHT: "out-right",
  OUT_BOTTOM: "out-bottom",
  IN_LEFT: "in-left",
  IN_TOP: "in-top",
} as const

export type PortId = (typeof PORT_IDS)[keyof typeof PORT_IDS]

type NodeIOHandlesProps = {
  /** Render the input (target) handles. False on source-only cells. */
  hasInput?: boolean
}

/**
 * Four canvas attachment points: out-right + out-bottom for source, in-left +
 * in-top for target. The right and left handles render first so legacy
 * connections without an explicit handle id default back to them, preserving
 * pre-feature edge layouts.
 */
export function NodeIOHandles({ hasInput = true }: NodeIOHandlesProps) {
  return (
    <>
      <Handle id={PORT_IDS.OUT_RIGHT} type="source" position={Position.Right} className={IO_HANDLE_CLASS}>
        <span className={IO_LABEL_CLASS}>O</span>
      </Handle>
      <Handle id={PORT_IDS.OUT_BOTTOM} type="source" position={Position.Bottom} className={IO_HANDLE_CLASS}>
        <span className={IO_LABEL_CLASS}>O</span>
      </Handle>
      {hasInput && (
        <>
          <Handle id={PORT_IDS.IN_LEFT} type="target" position={Position.Left} className={IO_HANDLE_CLASS}>
            <span className={IO_LABEL_CLASS}>I</span>
          </Handle>
          <Handle id={PORT_IDS.IN_TOP} type="target" position={Position.Top} className={IO_HANDLE_CLASS}>
            <span className={IO_LABEL_CLASS}>I</span>
          </Handle>
        </>
      )}
    </>
  )
}

// The Handle becomes a 16px circle with the I/O letter centered inside.
// xyflow positions the circle so its center sits exactly on the node border,
// which means the letter is half-on, half-off the border — readable on both sides.
const IO_HANDLE_CLASS =
  "!w-4 !h-4 !bg-background !border !border-muted-foreground !rounded-full flex items-center justify-center"
const IO_LABEL_CLASS =
  "text-[9px] font-mono font-bold text-muted-foreground leading-none pointer-events-none select-none"
