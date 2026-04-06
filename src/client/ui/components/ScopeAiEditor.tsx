"use client"

import { useState, useCallback } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { SchemaBuilder } from "./SchemaBuilder"
import type { ModelRosterEntry, SchemaField } from "@/kernel/entities"

type OutputMode = "text" | "structured"
type SchemaMode = "single" | "collection"

type ScopeAiEditorProps = {
  instruction: string
  provider: string
  model: string
  outputMode: OutputMode
  schemaMode: SchemaMode
  schema: SchemaField[]
  roster: ModelRosterEntry[]
  onInstructionChange: (value: string) => void
  onModelChange: (provider: string, model: string) => void
  onOutputModeChange: (mode: OutputMode) => void
  onSchemaChange: (schema: SchemaField[]) => void
  onSchemaModeChange: (mode: SchemaMode) => void
}

export function ScopeAiEditor({
  instruction,
  provider,
  model,
  outputMode,
  schemaMode,
  schema,
  roster,
  onInstructionChange,
  onModelChange,
  onOutputModeChange,
  onSchemaChange,
  onSchemaModeChange,
}: ScopeAiEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleSelectModel = useCallback(
    (entry: ModelRosterEntry) => {
      onModelChange(entry.provider, entry.model)
      setPickerOpen(false)
    },
    [onModelChange]
  )

  const handleInstructionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onInstructionChange(e.target.value)
    },
    [onInstructionChange]
  )

  const handleSchemaChange = useCallback(
    (newSchema: SchemaField[]) => {
      onSchemaChange(newSchema)
    },
    [onSchemaChange]
  )

  const currentDisplay = roster.find((e) => e.provider === provider && e.model === model)
  const modelShort =
    currentDisplay?.displayName ??
    model.split("/").pop()?.split("-").slice(0, 2).join(" ") ??
    model

  const grouped = roster.reduce<Record<string, ModelRosterEntry[]>>((acc, entry) => {
    if (!acc[entry.provider]) acc[entry.provider] = []
    acc[entry.provider].push(entry)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Instruction */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Instruction
        </label>
        <textarea
          value={instruction}
          onChange={handleInstructionChange}
          placeholder="Enter instruction for the AI..."
          className="w-full bg-transparent text-sm resize-none outline-none border border-input rounded-md px-2.5 py-2 focus:border-foreground min-h-[80px]"
          rows={4}
        />
      </div>

      {/* Model selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Model
        </label>
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button className="w-full flex items-center justify-between text-sm border border-input rounded-md px-2.5 py-1.5 hover:bg-muted text-foreground">
              <span>{modelShort}</span>
              <svg width="10" height="10" viewBox="0 0 8 8" fill="none" className="opacity-50 shrink-0">
                <path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            {Object.entries(grouped).map(([providerName, entries]) => (
              <div key={providerName} className="mb-2 last:mb-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1">
                  {providerName}
                </div>
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
      </div>

      {/* Output mode toggle */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
          Output
        </label>
        <div className="flex rounded-md border border-input overflow-hidden w-fit">
          <button
            onClick={() => onOutputModeChange("text")}
            className={`px-3 py-1.5 text-xs transition-colors ${
              outputMode === "text"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            text
          </button>
          <button
            onClick={() => onOutputModeChange("structured")}
            className={`px-3 py-1.5 text-xs transition-colors ${
              outputMode === "structured"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            structured
          </button>
        </div>
      </div>

      {/* Schema section (structured mode only) */}
      {outputMode === "structured" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Schema
            </label>
            <div className="flex rounded-md border border-input overflow-hidden">
              <button
                onClick={() => onSchemaModeChange("single")}
                className={`px-2.5 py-1 text-[10px] transition-colors ${
                  schemaMode === "single"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                single
              </button>
              <button
                onClick={() => onSchemaModeChange("collection")}
                className={`px-2.5 py-1 text-[10px] transition-colors ${
                  schemaMode === "collection"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                collection
              </button>
            </div>
          </div>
          <SchemaBuilder schema={schema} onChange={handleSchemaChange} />
        </div>
      )}
    </div>
  )
}
