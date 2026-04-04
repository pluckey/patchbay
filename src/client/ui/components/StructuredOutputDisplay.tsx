"use client"

import type { SchemaField } from "@/kernel/entities"

type StructuredOutputDisplayProps = {
  data: Record<string, unknown>
  schema: SchemaField[]
}

function renderValue(value: unknown, type: string) {
  if (type === "boolean") {
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded ${value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
        {String(value)}
      </span>
    )
  }
  if (type === "number") {
    return <span className="text-sm font-mono text-foreground">{String(value)}</span>
  }
  return <span className="text-sm text-foreground">{String(value)}</span>
}

export function StructuredOutputDisplay({ data, schema }: StructuredOutputDisplayProps) {
  return (
    <div className="flex flex-col gap-2">
      {schema.map((field) => (
        <div key={field.name} className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {field.name}
            <span className="ml-1 opacity-50">{field.type}</span>
          </span>
          {renderValue(data[field.name], field.type)}
        </div>
      ))}
    </div>
  )
}
