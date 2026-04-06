"use client"

import type { CellOutput, SchemaField } from "@/kernel/entities"
import { Button } from "@/client/ui/components/ui/button"
import { StructuredOutputDisplay } from "@/client/ui/components/StructuredOutputDisplay"

type CellType = 'source' | 'ai' | 'code'

type ScopeOutputColumnProps = {
  output?: CellOutput
  health?: 'current' | 'stale' | 'error'
  cellType: CellType
  onTrigger?: () => void
  structuredData?: {
    data: Record<string, unknown> | Record<string, unknown>[]
    schema: SchemaField[]
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

const healthConfig = {
  current: { color: 'bg-primary', label: 'Current' },
  stale: { color: 'bg-muted-foreground', label: 'Stale' },
  error: { color: 'bg-destructive', label: 'Error' },
}

export function ScopeOutputColumn({
  output,
  health,
  cellType,
  onTrigger,
  structuredData,
}: ScopeOutputColumnProps) {
  const showTrigger = cellType === 'ai' || cellType === 'code'
  const isRunning = output?.status === 'running'

  return (
    <div className="flex flex-col gap-3 overflow-y-auto h-full">
      {showTrigger && (
        <Button
          size="sm"
          variant="outline"
          onClick={onTrigger}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full animate-spin border-2 border-muted-foreground border-t-foreground" />
              Running…
            </span>
          ) : (
            cellType === 'ai' ? 'Run AI' : 'Run Code'
          )}
        </Button>
      )}

      {health && (
        <div className="flex items-center gap-1.5">
          <span className={`inline-block w-2 h-2 rounded-full ${healthConfig[health].color}`} />
          <span className="text-[11px] text-muted-foreground">{healthConfig[health].label}</span>
        </div>
      )}

      {output && output.status !== 'running' && 'durationMs' in output && (
        <div className="text-[11px] text-muted-foreground">
          Duration: {formatDuration(output.durationMs)}
        </div>
      )}

      {isRunning && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-full animate-spin border-2 border-muted-foreground border-t-foreground" />
          Running…
        </div>
      )}

      {output?.status === 'success' && (
        <div className="flex flex-col gap-2">
          {structuredData ? (
            <StructuredOutputDisplay data={structuredData.data} schema={structuredData.schema} />
          ) : (
            <pre className="text-sm text-foreground whitespace-pre-wrap overflow-y-auto font-mono">
              {output.text}
            </pre>
          )}
        </div>
      )}

      {output?.status === 'error' && (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Error</span>
          <pre className="text-sm text-destructive whitespace-pre-wrap font-mono">
            {output.error}
          </pre>
        </div>
      )}
    </div>
  )
}
