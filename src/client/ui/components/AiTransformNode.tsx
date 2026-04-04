"use client"

import { memo, useState, useCallback, useMemo } from "react"
import type { NodeProps } from "@xyflow/react"
import { NodeShell } from "./NodeShell"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { SchemaBuilder } from "./SchemaBuilder"
import { StructuredOutputDisplay } from "./StructuredOutputDisplay"
import type { AiTransformFlowNodeData } from "@/client/adapters/canvas/flow-node-mapper"
import type { ModelRosterEntry, SchemaField } from "@/kernel/entities"

function AiTransformNodeInner({ data }: NodeProps) {
  const {
    nodeId, instruction, provider, model, autoExecute, inputMode,
    outputMode, schemaMode, schema, roster, inputLegend, result,
    onInstructionChange, onModelChange, onInputModeChange,
    onAutoExecuteToggle, onOutputModeChange, onSchemaChange,
    onSchemaModeChange, onExecute, onDelete, onResizeEnd,
  } = data as unknown as AiTransformFlowNodeData

  const [pickerOpen, setPickerOpen] = useState(false)

  const handleSelectModel = (entry: ModelRosterEntry) => {
    onModelChange(nodeId, entry.provider, entry.model)
    setPickerOpen(false)
  }

  const handleInstructionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onInstructionChange(nodeId, e.target.value)
    },
    [nodeId, onInstructionChange]
  )

  const handleSchemaChange = useCallback(
    (newSchema: SchemaField[]) => {
      onSchemaChange(nodeId, newSchema)
    },
    [nodeId, onSchemaChange]
  )

  const parsedStructuredData = useMemo(() => {
    if (outputMode !== "structured" || result?.status !== "success" || !result.output) return null
    try {
      return JSON.parse(result.output) as Record<string, unknown> | Record<string, unknown>[]
    } catch {
      return null
    }
  }, [outputMode, result])

  const currentDisplay = roster.find((e) => e.provider === provider && e.model === model)
  const modelShort = currentDisplay?.displayName ?? model.split("/").pop()?.split("-").slice(0, 2).join(" ") ?? model

  const grouped = roster.reduce<Record<string, ModelRosterEntry[]>>((acc, entry) => {
    if (!acc[entry.provider]) acc[entry.provider] = []
    acc[entry.provider].push(entry)
    return acc
  }, {})

  const statusColor = !result ? "bg-muted-foreground"
    : result.status === "running" ? "bg-indicator animate-pulse"
    : result.status === "success" ? "bg-primary"
    : "bg-destructive"

  const header = (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${statusColor}`} />
      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AI Transform</span>

      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <button
            disabled={result?.status === "running"}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50 flex items-center gap-0.5 nodrag"
          >
            {modelShort}
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-50">
              <path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 p-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {Object.entries(grouped).map(([providerName, entries]) => (
            <div key={providerName} className="mb-2 last:mb-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1">{providerName}</div>
              {entries.map((entry) => (
                <button
                  key={`${entry.provider}-${entry.model}`}
                  onClick={() => handleSelectModel(entry)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted flex items-center justify-between"
                >
                  {entry.displayName}
                  {entry.provider === provider && entry.model === model && (
                    <span className="text-primary text-xs">&#10003;</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </PopoverContent>
      </Popover>

      <div className="flex-1" />

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onOutputModeChange(nodeId, outputMode === "text" ? "structured" : "text")}
        disabled={result?.status === "running"}
        className={`text-[10px] px-1.5 py-0.5 rounded nodrag ${outputMode === "structured" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {outputMode === "structured" ? "json" : "text"}
      </button>

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onAutoExecuteToggle(nodeId)}
        className={`text-[10px] px-1.5 py-0.5 rounded nodrag ${autoExecute ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {autoExecute ? "auto" : "manual"}
      </button>

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onExecute(nodeId)}
        disabled={result?.status === "running"}
        className="text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-50 nodrag"
      >
        &#9654;
      </button>
    </div>
  )

  return (
    <NodeShell nodeId={nodeId} onDelete={onDelete} onResizeEnd={onResizeEnd} header={header}>
      <div className="flex flex-col gap-0 h-full">
        {/* Input legend */}
        {inputLegend.length > 0 && (
          <div className="px-3 py-1.5 border-b border-border">
            <div className="text-[10px] text-muted-foreground">
              {inputLegend.map((entry) => (
                <span key={entry.label} className="mr-2">
                  <span className="font-medium">{entry.label}</span>
                  <span className="opacity-50"> ({entry.sourceName})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instruction */}
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Instruction</span>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onInputModeChange(nodeId, inputMode === "concat" ? "named" : "concat")}
              className="text-[10px] text-muted-foreground hover:text-foreground nodrag"
            >
              {inputMode === "concat" ? "concat" : "named"}
            </button>
          </div>
          <textarea
            value={instruction}
            onChange={handleInstructionChange}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder={inputMode === "named" ? "Use {{label}} to reference inputs..." : "Describe how to process the inputs..."}
            className="w-full bg-transparent text-sm resize-none outline-none min-h-[60px] nodrag nowheel"
            rows={3}
          />
        </div>

        {/* Schema builder (structured mode only) */}
        {outputMode === "structured" && (
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Schema</span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onSchemaModeChange(nodeId, schemaMode === "single" ? "collection" : "single")}
                className={`text-[10px] px-1.5 py-0.5 rounded nodrag ${schemaMode === "collection" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {schemaMode === "collection" ? "collection" : "single"}
              </button>
            </div>
            <SchemaBuilder schema={schema} onChange={handleSchemaChange} />
          </div>
        )}

        {/* Output */}
        <div className="flex-1 overflow-auto px-3 py-2">
          {result?.status === "running" && (
            <div className="text-[10px] text-muted-foreground animate-pulse">Running...</div>
          )}
          {result?.status === "success" && result.output ? (
            outputMode === "structured" && parsedStructuredData ? (
              <StructuredOutputDisplay data={parsedStructuredData} schema={schema} />
            ) : (
              <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground">{result.output}</pre>
            )
          ) : result?.status === "success" ? (
            <div className="text-[10px] text-muted-foreground">Completed with empty output.</div>
          ) : null}
          {result?.status === "error" && (
            <div className="text-sm text-destructive">{result.message}</div>
          )}
          {!result && (
            <div className="text-[10px] text-muted-foreground">No output yet. Connect inputs and run.</div>
          )}
        </div>
      </div>
    </NodeShell>
  )
}

export const AiTransformNode = memo(AiTransformNodeInner)
