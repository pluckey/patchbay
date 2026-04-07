"use client"

import { useCallback, useMemo } from "react"
import type { Node, NodeProps } from "@xyflow/react"
import { Play, Loader2 } from "lucide-react"
import { CellShell } from "./CellShell"
import { StructuredViewSwitcher } from "./StructuredViewSwitcher"
import { parseStructuredOutput } from "./structured-output"
import { MarkdownView } from "./MarkdownView"
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
  const { output, cellType, code, instruction, outputMode, schema } = data

  // For AI cells in structured mode, parse the JSON text once and reuse below.
  // Falls back to markdown rendering if parsing fails (e.g. mid-migration cell with stale text output).
  const parsedStructuredData = useMemo(() => {
    if (cellType !== "ai" || outputMode !== "structured") return null
    if (output?.status !== "success") return null
    return parseStructuredOutput(output.text)
  }, [cellType, outputMode, output])

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

  // AI cells: structured output via StructuredOutputDisplay if schema present
  // (with table/json toggle), otherwise markdown. Instruction collapsed below for context.
  if (cellType === "ai") {
    return (
      <div className="flex flex-col gap-2">
        {output?.status === "success" ? (
          output.text ? (
            parsedStructuredData && schema ? (
              <StructuredViewSwitcher data={parsedStructuredData} schema={schema} />
            ) : (
              <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-pre:my-1 prose-blockquote:my-1 prose-table:my-2 text-foreground">
                <MarkdownView content={output.text} />
              </div>
            )
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
  const isRunning = output?.status === "running"
  const canRun = cellType === "ai" || cellType === "code"

  const handleTrigger = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      callbacks.onTrigger(cellId)
    },
    [cellId, callbacks]
  )

  const runButton = canRun ? (
    <button
      type="button"
      onClick={handleTrigger}
      onPointerDown={(e) => e.stopPropagation()}
      disabled={isRunning}
      className="nodrag flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
      title={isRunning ? "Running…" : `Run ${cellType} cell`}
      aria-label={`Run ${cellType} cell`}
    >
      {isRunning ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <Play size={12} fill="currentColor" />
      )}
    </button>
  ) : undefined

  return (
    <div className="h-full">
      <CellShell
        cellId={cellId}
        title={title}
        hasInput={hasInput}
        health={health}
        onDelete={callbacks.onDelete}
        onDuplicate={callbacks.onDuplicate}
        onResizeEnd={callbacks.onResizeEnd}
        headerActions={runButton}
      >
        <div className="px-3 py-2 h-full">
          <CellBody data={data} />
        </div>
      </CellShell>
    </div>
  )
}
