import type { Cell, CellOutput } from "@/kernel/entities/cell"
import type { Connection } from "@/kernel/entities/connection"
import type { WorkspaceNode } from "@/kernel/entities/workspace-node"
import type { AiExecutorPort } from "@/client/domain/ports/ai-executor-port"
import type { CellExecutorPort, CellExecutorInput } from "@/client/domain/ports/cell-executor-port"
import type { BlobStoragePort } from "@/client/domain/ports/blob-storage-port"
import { sourceKindRegistry } from "@/kernel/source-kinds"
// Side-effect import to populate the registry on the main thread.
import "@/client/source-kinds"
import { buildExecutionSchedule } from "@/kernel/transforms/build-execution-schedule"
import { hashCellInputs } from "@/kernel/transforms/hash-cell-inputs"

export type ExecuteCascadeResult = {
  outputs: Map<string, CellOutput>
  updatedCells: Cell[]
}

/**
 * Builds the registry-shaped input record for a cell by walking its
 * incoming connections and dispatching each upstream source through the
 * source kind registry. Returns `Record<connectionLabel, CellExecutorInput>`.
 *
 * For cell sources: kind = "derived", rawArtifact = the upstream cell's
 * output text. The cascade builds these directly because cells have no
 * WorkspaceNode shape — they live in the cells array.
 *
 * For legacy node sources: kind = node.type, rawArtifact = whatever the
 * contribution's `extractFromNode` returns (PDF bytes for pdf, content
 * string for markdown, etc.). Contributions for unknown kinds throw via
 * the registry's loud-failure path.
 *
 * Skips connections whose source has not produced a successful output yet.
 */
async function buildCellInputs(
  cellId: string,
  cells: Cell[],
  connections: Connection[],
  nodes: WorkspaceNode[],
  outputs: Map<string, CellOutput>,
  blobStorage: BlobStoragePort,
): Promise<Record<string, CellExecutorInput>> {
  const cellMap = new Map(cells.map((c) => [c.id, c]))
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  const result: Record<string, CellExecutorInput> = {}

  for (const conn of connections) {
    if (conn.targetId !== cellId) continue
    if (conn.gate === "latched") continue

    const sourceCell = cellMap.get(conn.sourceId)
    if (sourceCell) {
      const out = outputs.get(conn.sourceId) ?? sourceCell.output
      if (!out || out.status !== "success") continue
      result[conn.label] = {
        kind: "derived",
        rawArtifact: out.text,
      }
      continue
    }

    const sourceNode = nodeMap.get(conn.sourceId)
    if (sourceNode) {
      // Look up the contribution by node.type — the registry's loud-failure
      // path throws if no contribution claims this kind, naming it. We catch
      // here so the cascade doesn't die on a single bad input; the affected
      // input is skipped and the cell will execute without it. Truly fatal
      // errors (e.g., the cell needs that input and the user code crashes
      // on missing binding) surface as cell execution errors downstream.
      let contribution
      try {
        contribution = sourceKindRegistry.get(sourceNode.type)
      } catch (err) {
        // Loud-fail at the cascade level: log so the developer sees the
        // missing registration immediately, then skip this input. The
        // SourceKindRegistryError message already names the missing kind.
        console.error(`[executeCascade] ${(err as Error).message}`)
        continue
      }
      if (!contribution.extractFromNode) {
        // Contribution exists but doesn't know how to extract from a
        // legacy node — skip this input.
        continue
      }
      try {
        const rawArtifact = await contribution.extractFromNode(sourceNode, { blobStorage })
        result[conn.label] = {
          kind: contribution.kind,
          rawArtifact,
        }
      } catch (err) {
        // Skip on extraction failure (e.g., missing blob); the cell will
        // execute without this input. Log for visibility.
        console.error(`[executeCascade] failed to extract input "${conn.label}" from ${sourceNode.type} node:`, err)
      }
    }
  }

  return result
}

export async function executeCascade(
  triggeredCellId: string,
  cells: Cell[],
  connections: Connection[],
  nodes: WorkspaceNode[],
  ports: {
    aiExecutor: AiExecutorPort
    cellExecutor: CellExecutorPort
    blobStorage: BlobStoragePort
  },
  // Optional progress callback fired after each cell in the schedule completes.
  // Lets the UI render incremental cell outputs (a fast Code cell's result
  // appears immediately rather than waiting for a slow downstream AI cell).
  onProgress?: (cells: Cell[]) => void,
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

    const cellInputs = await buildCellInputs(
      step.cellId,
      cells,
      connections,
      nodes,
      outputs,
      ports.blobStorage,
    )
    const inputHash = hashCellInputs(step.cellId, cells, connections, nodes)
    const start = Date.now()

    let output: CellOutput

    if (cell.type === "ai") {
      // AI cells receive each input as text. For cell-sourced inputs the
      // raw artifact IS already a string; for node-sourced inputs we use
      // the contribution's parser to get a primary text projection. To
      // keep this kind-agnostic, we serialize the rawArtifact when it's a
      // string and otherwise call the contribution's parse to get a value
      // and stringify that. AI cells aren't the focus of this spec — the
      // emphasis is on Code cells using real library objects — so this
      // simple serialization is sufficient.
      const userMessageParts: string[] = []
      for (const [label, entry] of Object.entries(cellInputs)) {
        if (typeof entry.rawArtifact === "string") {
          userMessageParts.push(`${label}: ${entry.rawArtifact}`)
        } else {
          // For non-string raw artifacts (e.g., PDF bytes) the AI cell
          // gets a placeholder. AI cells are not the right surface for
          // structured library objects; if you need PDF text in an AI
          // prompt, route through a Code cell first.
          userMessageParts.push(`${label}: [${entry.kind} input — use a Code cell to project this into text first]`)
        }
      }
      const userMessage = userMessageParts.join("\n\n")

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
        const result = await ports.cellExecutor.execute(
          cell.code,
          cellInputs,
          cell.timeoutMs,
        )
        if (result.status === "success") {
          output = {
            status: "success",
            text: result.output ?? "",
            durationMs: result.durationMs,
          }
        } else if (result.status === "error" || result.status === "timed-out") {
          output = {
            status: "error",
            error: result.message ?? "Unknown error",
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

    // Stream incremental progress so the UI can render this cell's output
    // before downstream cells (which may be slow AI calls) complete.
    if (onProgress) {
      onProgress(cells.map((c) => cellMap.get(c.id) ?? c))
    }
  }

  const updatedCells = cells.map((c) => cellMap.get(c.id) ?? c)

  return { outputs, updatedCells }
}
