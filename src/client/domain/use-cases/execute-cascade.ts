import type { Cell, CellOutput } from "@/kernel/entities/cell"
import type { Connection } from "@/kernel/entities/connection"
import type { AiExecutorPort } from "@/client/domain/ports/ai-executor-port"
import type { TransformExecutorPort } from "@/client/domain/ports/transform-executor-port"
import { buildExecutionSchedule } from "@/kernel/transforms/build-execution-schedule"
import { resolveCellInputs } from "@/kernel/transforms/resolve-cell-inputs"

export type ExecuteCascadeResult = {
  outputs: Map<string, CellOutput>
  updatedCells: Cell[]
}

/**
 * Deterministic hash of resolved inputs.
 * Sorts entries by key before serialising to ensure stability across insertion orders.
 */
function hashInputs(inputs: Record<string, string>): string {
  const sorted = Object.entries(inputs).sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(sorted)
}

export async function executeCascade(
  triggeredCellId: string,
  cells: Cell[],
  connections: Connection[],
  ports: {
    aiExecutor: AiExecutorPort
    transformExecutor: TransformExecutorPort
  },
): Promise<ExecuteCascadeResult> {
  const schedule = buildExecutionSchedule(triggeredCellId, cells, connections)

  const outputs = new Map<string, CellOutput>()
  const cellMap = new Map<string, Cell>(cells.map((c) => [c.id, c]))

  // Source cells that are the triggered cell (or upstream) produce output from content.
  // Seed source cell outputs so downstream cells can resolve them as inputs.
  for (const cell of cells) {
    if (cell.type === "source") {
      outputs.set(cell.id, {
        status: "success",
        text: cell.content,
        durationMs: 0,
      })
    }
  }

  for (const step of schedule) {
    const cell = cellMap.get(step.cellId)
    if (!cell) continue

    const resolvedInputs = resolveCellInputs(step.cellId, cells, connections, outputs)
    const inputHash = hashInputs(resolvedInputs)
    const start = Date.now()

    let output: CellOutput

    if (cell.type === "ai") {
      const userMessage = Object.entries(resolvedInputs)
        .map(([label, content]) => `${label}: ${content}`)
        .join("\n\n")

      try {
        const result = await ports.aiExecutor.execute({
          instruction: cell.instruction,
          userMessage,
          provider: cell.provider,
          model: cell.model,
          schema: cell.outputMode === "structured" ? cell.schema : undefined,
          schemaMode: cell.outputMode === "structured" ? cell.schemaMode : undefined,
        })
        output = {
          status: "success",
          text: result,
          durationMs: Date.now() - start,
        }
      } catch (err) {
        output = {
          status: "error",
          error: err instanceof Error ? err.message : String(err),
          durationMs: Date.now() - start,
        }
      }
    } else if (cell.type === "code") {
      try {
        const result = await ports.transformExecutor.execute(
          cell.code,
          resolvedInputs,
          cell.timeoutMs,
        )
        if (result.status === "success") {
          output = {
            status: "success",
            text: result.output,
            durationMs: result.durationMs,
          }
        } else if (result.status === "error") {
          output = {
            status: "error",
            error: result.message,
            durationMs: result.durationMs,
          }
        } else {
          output = { status: "running" }
        }
      } catch (err) {
        output = {
          status: "error",
          error: err instanceof Error ? err.message : String(err),
          durationMs: Date.now() - start,
        }
      }
    } else {
      // Source cells are excluded from the schedule; this branch is a safety fallback.
      continue
    }

    outputs.set(step.cellId, output)
    cellMap.set(step.cellId, { ...cell, output, lastInputHash: inputHash })
  }

  const updatedCells = cells.map((c) => cellMap.get(c.id) ?? c)

  return { outputs, updatedCells }
}
