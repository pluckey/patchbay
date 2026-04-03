"use client"

import { memo, useState, lazy, Suspense } from "react"
import type { NodeProps } from "@xyflow/react"
import { NodeShell } from "./NodeShell"
import type { TransformFlowNodeData } from "@/client/adapters/canvas/flow-node-mapper"

const TransformCodeEditor = lazy(() =>
  import("./TransformCodeEditor").then((m) => ({ default: m.TransformCodeEditor }))
)

const TIMEOUT_OPTIONS = [
  { label: "1s", value: 1000 },
  { label: "5s", value: 5000 },
  { label: "10s", value: 10000 },
  { label: "30s", value: 30000 },
  { label: "60s", value: 60000 },
]

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function TransformNodeInner({ data }: NodeProps) {
  const {
    nodeId, transformCode, timeoutMs, transformResult, sourceNodeType,
    onTransformCodeChange, onTimeoutChange, onRerun, onDelete, onResizeEnd,
  } = data as unknown as TransformFlowNodeData

  const [isEditing, setIsEditing] = useState(false)
  const [showOutput, setShowOutput] = useState(false)

  const isRunning = transformResult?.status === "running"
  const isSuccess = transformResult?.status === "success"
  const isError = transformResult?.status === "error"
  const isTimedOut = isError && transformResult.timedOut

  const statusColor = isRunning ? "bg-primary animate-pulse"
    : isSuccess ? "bg-primary"
    : isTimedOut ? "bg-accent-foreground"
    : isError ? "bg-destructive"
    : "bg-muted-foreground"

  const durationMs = transformResult && "durationMs" in transformResult ? transformResult.durationMs : undefined

  const header = (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
        Transform
      </span>
      {durationMs !== undefined && (
        <span className="text-[10px] text-muted-foreground">{formatDuration(durationMs)}</span>
      )}
      <div className="ml-auto flex items-center gap-1">
        <select
          value={timeoutMs}
          onChange={(e) => onTimeoutChange(nodeId, Number(e.target.value))}
          onPointerDown={(e) => e.stopPropagation()}
          className="text-[10px] bg-transparent text-muted-foreground border-none outline-none cursor-pointer"
        >
          {TIMEOUT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          className="text-[10px] text-muted-foreground hover:text-foreground"
          onClick={() => onRerun(nodeId)}
          title="Re-run transform"
        >
          run
        </button>
        <button
          className="text-[10px] text-muted-foreground hover:text-foreground"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "done" : "edit"}
        </button>
      </div>
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

        {isError && (
          <div className="border-t border-border pt-1 overflow-auto max-h-24">
            <div className="text-destructive text-[10px] font-mono whitespace-pre-wrap">
              {isTimedOut && "⏱ "}{transformResult.message}
            </div>
          </div>
        )}

        {isSuccess && transformResult.output && (
          <div className="border-t border-border pt-1">
            <button
              className="text-[10px] text-muted-foreground hover:text-foreground"
              onClick={() => setShowOutput(!showOutput)}
            >
              {showOutput ? "hide output" : "show output"}
            </button>
            {showOutput && (
              <pre className="text-[10px] font-mono text-foreground mt-1 overflow-auto max-h-32 whitespace-pre-wrap">
                {transformResult.output.length > 500
                  ? transformResult.output.substring(0, 500) + "…"
                  : transformResult.output}
              </pre>
            )}
          </div>
        )}
      </div>
    </NodeShell>
  )
}

export const TransformNode = memo(TransformNodeInner)
