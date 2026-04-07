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
    nodeId, transformCode, timeoutMs, transformResult, inputLegend,
    onTransformCodeChange, onTimeoutChange, onRerun, onDelete, onDuplicate, onResizeEnd,
  } = data as unknown as TransformFlowNodeData

  const [isEditing, setIsEditing] = useState(false)

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

  const title = (
    <>
      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
      <span className="text-xs font-medium text-foreground truncate">Transform</span>
      {durationMs !== undefined && (
        <span className="text-[10px] text-muted-foreground">{formatDuration(durationMs)}</span>
      )}
    </>
  )

  const headerActions = (
    <>
      <select
        value={timeoutMs}
        onChange={(e) => onTimeoutChange(nodeId, Number(e.target.value))}
        onPointerDown={(e) => e.stopPropagation()}
        className="nodrag text-[10px] bg-transparent text-muted-foreground border-none outline-none cursor-pointer"
      >
        {TIMEOUT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button
        type="button"
        className="nodrag text-[10px] text-muted-foreground hover:text-foreground px-1"
        onClick={() => onRerun(nodeId)}
        onPointerDown={(e) => e.stopPropagation()}
        title="Re-run transform"
      >
        run
      </button>
      <button
        type="button"
        className="nodrag text-[10px] text-muted-foreground hover:text-foreground px-1"
        onClick={() => setIsEditing(!isEditing)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {isEditing ? "done" : "edit"}
      </button>
    </>
  )

  return (
    <NodeShell
      nodeId={nodeId}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onResizeEnd={onResizeEnd}
      title={title}
      headerActions={headerActions}
    >
      <div className="p-2 gap-1 h-full" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Input legend */}
        {inputLegend.length > 0 && (
          <div className="border-b border-border pb-1 mb-1 shrink-0">
            {inputLegend.map((entry) => (
              <div key={entry.label} className="text-[10px] text-muted-foreground font-mono">
                <span className="text-foreground">input.{entry.label}</span>
                <span className="mx-1">&larr;</span>
                <span>{entry.sourceName} ({entry.sourceType})</span>
              </div>
            ))}
          </div>
        )}

        {isEditing ? (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">Loading editor...</div>}>
            <TransformCodeEditor
              value={transformCode}
              inputLegend={inputLegend}
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
            <div className="text-[10px] text-muted-foreground mb-0.5">output</div>
            <pre className="text-[10px] font-mono text-foreground overflow-auto max-h-40 whitespace-pre-wrap bg-muted rounded p-1.5">
              {transformResult.output}
            </pre>
          </div>
        )}

        {isRunning && (
          <div className="border-t border-border pt-1">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indicator animate-pulse" />
              <span className="text-[10px] text-muted-foreground">running...</span>
            </div>
          </div>
        )}
      </div>
    </NodeShell>
  )
}

export const TransformNode = memo(TransformNodeInner)
