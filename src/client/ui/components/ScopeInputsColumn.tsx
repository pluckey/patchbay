'use client'

import { useState } from "react"

interface ScopeInput {
  cellId: string
  title: string
  text: string
}

interface ScopeInputsColumnProps {
  inputs: ScopeInput[]
  onNavigateToCell: (cellId: string) => void
}

function InputEntry({
  input,
  onNavigateToCell,
}: {
  input: ScopeInput
  onNavigateToCell: (cellId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isTruncatable = input.text.length > 0

  return (
    <div className="border-b border-border p-3">
      <p
        className="text-xs font-medium text-muted-foreground mb-1 cursor-pointer hover:underline"
        onClick={() => onNavigateToCell(input.cellId)}
      >
        {input.title}
      </p>
      <p
        className={`text-sm text-foreground whitespace-pre-wrap break-words ${expanded ? "" : "line-clamp-3"}`}
      >
        {input.text}
      </p>
      {isTruncatable && (
        <button
          className="text-xs text-muted-foreground hover:text-foreground mt-1"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}

export function ScopeInputsColumn({ inputs, onNavigateToCell }: ScopeInputsColumnProps) {
  return (
    <div className="w-full h-full overflow-y-auto flex flex-col">
      {inputs.length === 0 ? (
        <div className="p-3">
          <p className="text-sm text-muted-foreground">Source cells have no inputs.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {inputs.map((input) => (
            <InputEntry key={input.cellId} input={input} onNavigateToCell={onNavigateToCell} />
          ))}
        </div>
      )}
    </div>
  )
}
