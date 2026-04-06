"use client"

import { useCallback, useState } from "react"
import type { Node, NodeProps } from "@xyflow/react"
import ReactMarkdown from "react-markdown"
import { CellShell } from "./CellShell"
import type { CellFlowNodeData } from "@/client/adapters/canvas/flow-node-mapper"

type CellNodeProps = NodeProps<Node<CellFlowNodeData>>

/**
 * Renders the cell's full content on the canvas card so the user can read it
 * directly without opening Scope. The cell card scrolls vertically when the
 * content overflows (CellShell already provides `flex-1 overflow-auto`).
 *
 * - Source cells: their content (already seeded into output)
 * - Code cells: the JS source above the output, both monospace
 * - AI cells: the instruction above the output, output rendered as markdown
 */
function CellBody({ data }: { data: CellFlowNodeData }) {
  const { output, cellType, code, instruction } = data

  if (output?.status === "running") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full bg-indicator animate-pulse shrink-0" />
        <span className="text-xs text-muted-foreground">Running…</span>
      </div>
    )
  }

  if (output?.status === "error") {
    return (
      <div className="flex flex-col gap-2">
        <pre className="text-xs text-destructive whitespace-pre-wrap break-words font-mono">
          {output.error}
        </pre>
        {cellType === "code" && code && <CodeSourceBlock code={code} defaultOpen={false} />}
        {cellType === "ai" && instruction && <InstructionBlock instruction={instruction} defaultOpen={false} />}
      </div>
    )
  }

  // Code cells: output prominent, code source as a collapsible reference below
  if (cellType === "code") {
    return (
      <div className="flex flex-col gap-2">
        {output?.status === "success" ? (
          output.text ? (
            <pre className="text-xs text-foreground whitespace-pre-wrap break-words font-mono">
              {output.text}
            </pre>
          ) : (
            <p className="text-xs text-muted-foreground italic">Empty output.</p>
          )
        ) : (
          <p className="text-xs text-muted-foreground italic">No output yet.</p>
        )}
        {code && <CodeSourceBlock code={code} defaultOpen={false} />}
      </div>
    )
  }

  // AI cells: markdown output prominent, instruction collapsed below for context
  if (cellType === "ai") {
    return (
      <div className="flex flex-col gap-2">
        {output?.status === "success" ? (
          output.text ? (
            <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-pre:my-1 prose-blockquote:my-1 prose-table:my-2 text-foreground">
              <ReactMarkdown>{output.text}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">Empty output.</p>
          )
        ) : (
          <p className="text-xs text-muted-foreground italic">No output yet.</p>
        )}
        {instruction && <InstructionBlock instruction={instruction} defaultOpen={false} />}
      </div>
    )
  }

  // Source cells: their content lives in output.text (cascade seeds it)
  if (output?.status === "success" && output.text) {
    return (
      <p className="text-xs text-foreground whitespace-pre-wrap break-words">
        {output.text}
      </p>
    )
  }

  return (
    <p className="text-xs text-muted-foreground italic">
      No content.
    </p>
  )
}

function CodeSourceBlock({ code, defaultOpen = false }: { code: string; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="text-[10px] border-t border-border pt-2">
      <summary className="cursor-pointer text-muted-foreground uppercase tracking-wider select-none">
        code
      </summary>
      <pre className="mt-1 px-2 py-1.5 bg-muted rounded text-xs text-foreground whitespace-pre-wrap break-words font-mono">
        {code}
      </pre>
    </details>
  )
}

function InstructionBlock({ instruction, defaultOpen = false }: { instruction: string; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="text-[10px] border-t border-border pt-2">
      <summary className="cursor-pointer text-muted-foreground uppercase tracking-wider select-none">
        instruction
      </summary>
      <p className="mt-1 px-2 py-1.5 bg-muted rounded text-xs text-foreground whitespace-pre-wrap break-words">
        {instruction}
      </p>
    </details>
  )
}

export function CellNode({ data }: CellNodeProps) {
  const { cellId, cellType, title, output, health, hasInput, callbacks } = data
  const [isHovered, setIsHovered] = useState(false)

  const showTrigger = (cellType === "ai" || cellType === "code") && isHovered
  const isRunning = output?.status === "running"

  const handleTrigger = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      callbacks.onTrigger(cellId)
    },
    [cellId, callbacks]
  )

  return (
    <div
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CellShell
        cellId={cellId}
        title={title}
        hasInput={hasInput}
        health={health}
        onDelete={callbacks.onDelete}
        onDuplicate={callbacks.onDuplicate}
        onResizeEnd={callbacks.onResizeEnd}
      >
        <div className="relative px-3 py-2 h-full">
          <CellBody data={data} />

          {showTrigger && !isRunning && (
            <div className="absolute bottom-2 right-2">
              <button
                className="nodrag px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
                onClick={handleTrigger}
                title={`Run ${cellType} cell`}
              >
                Run
              </button>
            </div>
          )}
        </div>
      </CellShell>
    </div>
  )
}
