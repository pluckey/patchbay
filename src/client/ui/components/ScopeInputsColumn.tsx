'use client'

import { useState } from "react"

type ScopeInputKind = 'cell' | 'markdown' | 'pdf'

interface ScopeInput {
  cellId: string
  title: string
  text: string
  kind: ScopeInputKind
}

interface ScopeInputsColumnProps {
  inputs: ScopeInput[]
  onNavigateToCell: (cellId: string) => void
}

const KIND_LABEL: Record<ScopeInputKind, string> = {
  cell: 'cell',
  markdown: 'md',
  pdf: 'pdf',
}

function KindBadge({ kind }: { kind: ScopeInputKind }) {
  return (
    <span className="text-[9px] uppercase tracking-wider px-1 py-px rounded bg-muted text-muted-foreground font-mono">
      {KIND_LABEL[kind]}
    </span>
  )
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
  const isCellSource = input.kind === 'cell'

  return (
    <div className="border-b border-border p-3">
      <div className="flex items-center gap-2 mb-1">
        <p
          className={`text-xs font-medium text-muted-foreground ${isCellSource ? 'cursor-pointer hover:underline' : ''}`}
          onClick={isCellSource ? () => onNavigateToCell(input.cellId) : undefined}
        >
          {input.title}
        </p>
        <KindBadge kind={input.kind} />
      </div>
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
