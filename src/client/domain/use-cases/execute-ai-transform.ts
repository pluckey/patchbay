import type { WorkspaceNode, Connection, TransformResult } from "@/kernel/entities"
import type { AiExecutorPort } from "@/client/domain/ports/ai-executor-port"
import { resolveAiTransformPrompt } from "@/kernel/transforms/resolve-ai-transform-prompt"
import { validateStructuredOutput } from "@/kernel/transforms/validate-structured-output"

export type AiTransformUpdate =
  | { type: "complete"; nodeId: string; result: TransformResult }
  | { type: "error"; nodeId: string; result: TransformResult }

type ExecuteAiTransformParams = {
  nodeId: string
  nodes: WorkspaceNode[]
  connections: Connection[]
  aiExecutor: AiExecutorPort
  pipelineResults?: Map<string, TransformResult>
}

export async function executeAiTransform(
  params: ExecuteAiTransformParams
): Promise<AiTransformUpdate> {
  const { nodeId, nodes, connections, aiExecutor } = params

  const node = nodes.find((n) => n.id === nodeId)
  if (!node || node.type !== "ai-transform") {
    return { type: "error", nodeId, result: { status: "error", message: "AI Transform node not found.", durationMs: 0 } }
  }

  if (!node.instruction.trim()) {
    return { type: "error", nodeId, result: { status: "error", message: "No instruction set.", durationMs: 0 } }
  }

  if (node.outputMode === "structured" && node.schema.length === 0) {
    return { type: "error", nodeId, result: { status: "error", message: "Define at least one schema field before executing in structured mode.", durationMs: 0 } }
  }

  const incomingConns = connections.filter((c) => c.targetId === nodeId)
  if (incomingConns.length === 0) {
    return { type: "error", nodeId, result: { status: "error", message: "No inputs connected.", durationMs: 0 } }
  }

  const inputs: Record<string, string> = {}
  for (const conn of incomingConns) {
    const sourceNode = nodes.find((n) => n.id === conn.sourceId)
    if (!sourceNode) {
      inputs[conn.label] = ""
      continue
    }

    if (sourceNode.type === "transform") {
      const upstreamResult = params.pipelineResults?.get(sourceNode.id)
      if (upstreamResult && upstreamResult.status === "error") {
        return { type: "error", nodeId, result: { status: "error", message: `Upstream "${conn.label}" is in error state.`, durationMs: 0 } }
      }
    }
    if (sourceNode.type === "ai-transform" && sourceNode.result?.status === "error") {
      return { type: "error", nodeId, result: { status: "error", message: `Upstream "${conn.label}" is in error state.`, durationMs: 0 } }
    }

    if (sourceNode.type === "markdown") {
      inputs[conn.label] = sourceNode.content
    } else if (sourceNode.type === "ai-transform" && sourceNode.result?.status === "success") {
      inputs[conn.label] = sourceNode.result.output
    } else if (sourceNode.type === "transform") {
      const result = params.pipelineResults?.get(sourceNode.id)
      inputs[conn.label] = result?.status === "success" ? result.output : ""
    } else {
      inputs[conn.label] = ""
    }
  }

  const promptResult = resolveAiTransformPrompt(node.instruction, inputs, node.inputMode)
  if ("error" in promptResult) {
    return { type: "error", nodeId, result: { status: "error", message: promptResult.error, durationMs: 0 } }
  }

  const isStructured = node.outputMode === "structured" && node.schema.length > 0
  const startTime = performance.now()

  try {
    const output = await aiExecutor.execute({
      instruction: promptResult.systemPrompt,
      userMessage: promptResult.userMessage,
      provider: node.provider,
      model: node.model,
      ...(isStructured ? { schema: node.schema, schemaMode: node.schemaMode } : {}),
    })

    const durationMs = Math.round(performance.now() - startTime)

    if (isStructured) {
      const validation = validateStructuredOutput(output, node.schema, node.schemaMode)
      if (!validation.ok) {
        return { type: "error", nodeId, result: { status: "error", message: `Schema validation failed: ${validation.message}`, durationMs } }
      }
      return { type: "complete", nodeId, result: { status: "success", output, durationMs } }
    }

    return { type: "complete", nodeId, result: { status: "success", output, durationMs } }
  } catch (e) {
    const durationMs = Math.round(performance.now() - startTime)
    return { type: "error", nodeId, result: { status: "error", message: e instanceof Error ? e.message : String(e), durationMs } }
  }
}
