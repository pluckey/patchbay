"use client"

import type { SchemaField } from "@/kernel/entities"

type StructuredOutputDisplayProps = {
  data: Record<string, unknown> | Record<string, unknown>[]
  schema: SchemaField[]
}

function renderValue(value: unknown, type: string) {
  if (type.endsWith("[]") && Array.isArray(value)) {
    if (value.length === 0) return <span className="text-[10px] text-muted-foreground">empty</span>
    const itemType = type.slice(0, -2)
    return (
      <span className="text-sm text-foreground">
        {value.map((item, i) => (
          <span key={i}>
            {i > 0 && <span className="text-muted-foreground">, </span>}
            {renderValue(item, itemType)}
          </span>
        ))}
      </span>
    )
  }
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

function SingleDisplay({ data, schema }: { data: Record<string, unknown>; schema: SchemaField[] }) {
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

function CollectionDisplay({ data, schema }: { data: Record<string, unknown>[]; schema: SchemaField[] }) {
  if (data.length === 0) {
    return <div className="text-[10px] text-muted-foreground">Empty collection.</div>
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {schema.map((field) => (
              <th
                key={field.name}
                className="text-left text-[10px] text-muted-foreground uppercase tracking-wider px-2 py-1 border-b border-border font-medium"
              >
                {field.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-border last:border-b-0">
              {schema.map((field) => (
                <td key={field.name} className="px-2 py-1 align-top">
                  {renderValue(row[field.name], field.type)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-[10px] text-muted-foreground mt-1">{data.length} {data.length === 1 ? "item" : "items"}</div>
    </div>
  )
}

export function StructuredOutputDisplay({ data, schema }: StructuredOutputDisplayProps) {
  if (Array.isArray(data)) {
    return <CollectionDisplay data={data} schema={schema} />
  }
  return <SingleDisplay data={data} schema={schema} />
}
