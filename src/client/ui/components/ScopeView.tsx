'use client'

import { useState, useRef, useCallback } from "react"
import type { Cell, ModelRosterEntry, SchemaField, InputLegendEntry, CellOutput } from "@/kernel/entities"
import type { StalenessStatus } from "@/kernel/transforms"
import { ScopeInputsColumn } from "./ScopeInputsColumn"
import { ScopeOutputColumn } from "./ScopeOutputColumn"
import { ScopeSourceEditor } from "./ScopeSourceEditor"
import { ScopeCodeEditor } from "./ScopeCodeEditor"
import { ScopeAiEditor } from "./ScopeAiEditor"

interface ScopeInput {
  cellId: string
  title: string
  text: string
  kind: 'cell' | 'markdown' | 'pdf'
}

type OutputMode = "text" | "structured"
type SchemaMode = "single" | "collection"

type ScopeViewProps = {
  cell: Cell
  inputs: ScopeInput[]
  inputLegend: InputLegendEntry[]
  health?: StalenessStatus
  onNavigateToCell: (cellId: string) => void
  onTrigger?: () => void
  onContentChange: (content: string) => void
  onInstructionChange: (value: string) => void
  onCodeChange: (code: string) => void
  onModelChange: (provider: string, model: string) => void
  onTimeoutChange: (timeoutMs: number) => void
  onOutputModeChange: (mode: OutputMode) => void
  onSchemaChange: (schema: SchemaField[]) => void
  onSchemaModeChange: (mode: SchemaMode) => void
  roster: ModelRosterEntry[]
  onClose: () => void
}

export function ScopeView({
  cell,
  inputs,
  inputLegend,
  health,
  onNavigateToCell,
  onTrigger,
  onContentChange,
  onInstructionChange,
  onCodeChange,
  onModelChange,
  onTimeoutChange,
  onOutputModeChange,
  onSchemaChange,
  onSchemaModeChange,
  roster,
  onClose,
}: ScopeViewProps) {
  const [panelHeight, setPanelHeight] = useState(40)
  const dragStartY = useRef<number | null>(null)
  const dragStartHeight = useRef<number>(40)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragStartY.current = e.clientY
    dragStartHeight.current = panelHeight

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (dragStartY.current === null) return
      const deltaY = dragStartY.current - moveEvent.clientY
      const viewportHeight = window.innerHeight
      const deltaPct = (deltaY / viewportHeight) * 100
      const newHeight = Math.max(15, Math.min(80, dragStartHeight.current + deltaPct))
      setPanelHeight(newHeight)
    }

    const onMouseUp = () => {
      dragStartY.current = null
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
  }, [panelHeight])

  const structuredData =
    cell.type === "ai" &&
    cell.outputMode === "structured" &&
    cell.output?.status === "success"
      ? {
          data: (() => {
            try {
              return JSON.parse(cell.output.text) as Record<string, unknown> | Record<string, unknown>[]
            } catch {
              return {}
            }
          })(),
          schema: cell.schema,
        }
      : undefined

  return (
    <div
      className="fixed bottom-0 left-0 right-0 border-t border-border bg-background flex flex-col z-50"
      style={{ height: `${panelHeight}%` }}
    >
      {/* Drag handle */}
      <div
        className="h-1.5 w-full cursor-row-resize shrink-0 hover:bg-muted transition-colors"
        onMouseDown={handleDragStart}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
        <span className="text-sm font-medium text-foreground truncate">{cell.title}</span>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors ml-3 shrink-0"
          aria-label="Close scope view"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1 1L13 13M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Body: three-column grid */}
      <div
        className="flex-1 overflow-hidden grid"
        style={{ gridTemplateColumns: "20% 50% 30%" }}
      >
        {/* Left: Inputs */}
        <div className="border-r border-border overflow-hidden">
          <ScopeInputsColumn
            inputs={cell.type === "source" ? [] : inputs}
            onNavigateToCell={onNavigateToCell}
          />
        </div>

        {/* Center: Editor */}
        <div className="border-r border-border overflow-y-auto p-3">
          {cell.type === "source" && (
            <ScopeSourceEditor
              content={cell.content}
              onContentChange={onContentChange}
            />
          )}
          {cell.type === "code" && (
            <ScopeCodeEditor
              code={cell.code}
              timeoutMs={cell.timeoutMs}
              inputLegend={inputLegend}
              onCodeChange={onCodeChange}
              onTimeoutChange={onTimeoutChange}
            />
          )}
          {cell.type === "ai" && (
            <ScopeAiEditor
              instruction={cell.instruction}
              provider={cell.provider}
              model={cell.model}
              outputMode={cell.outputMode}
              schemaMode={cell.schemaMode}
              schema={cell.schema}
              roster={roster}
              onInstructionChange={onInstructionChange}
              onModelChange={onModelChange}
              onOutputModeChange={onOutputModeChange}
              onSchemaChange={onSchemaChange}
              onSchemaModeChange={onSchemaModeChange}
            />
          )}
        </div>

        {/* Right: Output */}
        <div className="overflow-hidden p-3">
          <ScopeOutputColumn
            output={cell.output as CellOutput | undefined}
            health={health}
            cellType={cell.type}
            onTrigger={onTrigger}
            structuredData={structuredData || undefined}
          />
        </div>
      </div>
    </div>
  )
}
