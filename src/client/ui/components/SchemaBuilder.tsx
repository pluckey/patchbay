"use client"

import { useCallback } from "react"
import type { SchemaField, SchemaFieldType } from "@/kernel/entities"

type SchemaBuilderProps = {
  schema: SchemaField[]
  onChange: (schema: SchemaField[]) => void
}

const FIELD_TYPES: SchemaFieldType[] = ["string", "number", "boolean"]

export function SchemaBuilder({ schema, onChange }: SchemaBuilderProps) {
  const handleAddField = useCallback(() => {
    onChange([...schema, { name: "", type: "string" }])
  }, [schema, onChange])

  const handleRemoveField = useCallback(
    (index: number) => {
      onChange(schema.filter((_, i) => i !== index))
    },
    [schema, onChange]
  )

  const handleNameChange = useCallback(
    (index: number, name: string) => {
      onChange(schema.map((f, i) => (i === index ? { ...f, name } : f)))
    },
    [schema, onChange]
  )

  const handleTypeChange = useCallback(
    (index: number, type: SchemaFieldType) => {
      onChange(schema.map((f, i) => (i === index ? { ...f, type } : f)))
    },
    [schema, onChange]
  )

  return (
    <div className="flex flex-col gap-1">
      {schema.map((field, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <input
            type="text"
            value={field.name}
            onChange={(e) => handleNameChange(index, e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="field name"
            className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b border-border focus:border-foreground px-0.5 py-0.5 nodrag"
          />
          <select
            value={field.type}
            onChange={(e) => handleTypeChange(index, e.target.value as SchemaFieldType)}
            onPointerDown={(e) => e.stopPropagation()}
            className="bg-transparent text-[10px] text-muted-foreground outline-none border-b border-border cursor-pointer nodrag"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={() => handleRemoveField(index)}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-[10px] text-muted-foreground hover:text-destructive shrink-0 nodrag"
          >
            &times;
          </button>
        </div>
      ))}
      <button
        onClick={handleAddField}
        onPointerDown={(e) => e.stopPropagation()}
        className="text-[10px] text-muted-foreground hover:text-foreground self-start mt-0.5 nodrag"
      >
        + add field
      </button>
    </div>
  )
}
