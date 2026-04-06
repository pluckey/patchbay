"use client"

import { lazy, Suspense } from "react"
import type { InputLegendEntry } from "@/kernel/entities"

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

type ScopeCodeEditorProps = {
  code: string
  timeoutMs: number
  inputLegend: InputLegendEntry[]
  onCodeChange: (code: string) => void
  onTimeoutChange: (timeoutMs: number) => void
}

export function ScopeCodeEditor({
  code,
  timeoutMs,
  inputLegend,
  onCodeChange,
  onTimeoutChange,
}: ScopeCodeEditorProps) {
  return (
    <div className="w-full flex flex-col gap-1">
      {/* Timeout selector */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          Code
        </span>
        <select
          value={timeoutMs}
          onChange={(e) => onTimeoutChange(Number(e.target.value))}
          className="text-[10px] bg-transparent text-muted-foreground border-none outline-none cursor-pointer"
        >
          {TIMEOUT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Input legend */}
      {inputLegend.length > 0 && (
        <div className="border border-border rounded px-2 py-1 mb-1">
          {inputLegend.map((entry) => (
            <div key={entry.label} className="text-[10px] text-muted-foreground font-mono">
              <span className="text-foreground">input.{entry.label}</span>
              <span className="mx-1">&larr;</span>
              <span>{entry.sourceName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Code editor — flex container with explicit height so Monaco's
          internal sizing (TransformCodeEditor uses flex: 1 1 0) resolves
          correctly. Block parent + flex:1 child gives Monaco no dimensions
          and it collapses to a thin strip. */}
      <div className="w-full flex" style={{ height: 480 }}>
        <Suspense
          fallback={
            <div className="flex items-center justify-center text-xs text-muted-foreground border border-input rounded w-full">
              Loading editor...
            </div>
          }
        >
          <TransformCodeEditor
            value={code}
            inputLegend={inputLegend}
            onChange={onCodeChange}
            onClose={() => {}}
          />
        </Suspense>
      </div>
    </div>
  )
}
