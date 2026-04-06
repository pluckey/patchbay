import type { Cell, CellOutput } from "@/kernel/entities/cell"
import type { Connection } from "@/kernel/entities/connection"
import type { ResolvedInput } from "@/kernel/entities/resolved-input"
import type { WorkspaceNode } from "@/kernel/entities/workspace-node"
import type { AiExecutorPort } from "@/client/domain/ports/ai-executor-port"
import type { TransformExecutorPort } from "@/client/domain/ports/transform-executor-port"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import type { PdfRendererPort } from "@/client/domain/ports/pdf-renderer-port"
import { buildExecutionSchedule } from "@/kernel/transforms/build-execution-schedule"
import { resolveCellInputs } from "@/kernel/transforms/resolve-cell-inputs"
import { hashCellInputs } from "@/kernel/transforms/hash-cell-inputs"
import { resolveSourceContent } from "./resolve-source-content"

export type ExecuteCascadeResult = {
  outputs: Map<string, CellOutput>
  updatedCells: Cell[]
}

export async function executeCascade(
  triggeredCellId: string,
  cells: Cell[],
  connections: Connection[],
  nodes: WorkspaceNode[],
  ports: {
    aiExecutor: AiExecutorPort
    transformExecutor: TransformExecutorPort
    blobStorage: BlobStoragePort
    pdfRenderer: PdfRendererPort
  },
): Promise<ExecuteCascadeResult> {
  const schedule = buildExecutionSchedule(triggeredCellId, cells, connections)

  const outputs = new Map<string, CellOutput>()
  const cellMap = new Map<string, Cell>(cells.map((c) => [c.id, c]))
  const nodeMap = new Map<string, WorkspaceNode>(nodes.map((n) => [n.id, n]))

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

  // Pre-resolve any legacy WorkspaceNode that is the source of an incoming
  // connection to ANY cell in the schedule. The signal-field cascade only
  // executes Cells, but Cells may now consume legacy PdfNode/MarkdownNode
  // outputs through the cross-type bridge enabled by validateConnection.
  const legacyOutputs = new Map<string, ResolvedInput>()
  const scheduleIds = new Set(schedule.map((s) => s.cellId))
  const legacySourceIds = new Set<string>()
  for (const conn of connections) {
    if (!scheduleIds.has(conn.targetId)) continue
    if (cellMap.has(conn.sourceId)) continue
    if (nodeMap.has(conn.sourceId)) {
      legacySourceIds.add(conn.sourceId)
    }
  }
  for (const nodeId of legacySourceIds) {
    const node = nodeMap.get(nodeId)
    if (!node) continue
    try {
      const resolved = await resolveSourceContent(node, {
        blobStorage: ports.blobStorage,
        pdfRenderer: ports.pdfRenderer,
      })
      legacyOutputs.set(nodeId, resolved)
    } catch {
      // Skip on resolution failure — resolveCellInputs will treat the source
      // as missing, and the cell will execute without that input.
    }
  }

  for (const step of schedule) {
    const cell = cellMap.get(step.cellId)
    if (!cell) continue

    const resolvedInputs = resolveCellInputs(
      step.cellId,
      cells,
      connections,
      nodes,
      outputs,
      legacyOutputs,
    )
    const inputHash = hashCellInputs(step.cellId, cells, connections, nodes)
    const start = Date.now()

    let output: CellOutput

    if (cell.type === "ai") {
      const userMessage = Object.entries(resolvedInputs)
        .map(([label, input]) => `${label}: ${input.text}`)
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
