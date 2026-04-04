"use client"

import { useCallback, type Dispatch, type SetStateAction, type MutableRefObject } from "react"
import type { WorkspaceNode, Connection, TransformResult } from "@/kernel/entities"
import type { ModelRosterEntry } from "@/kernel/entities"
import type { AiExecutorPort } from "@/client/domain/ports/ai-executor-port"
import type { SchemaField } from "@/kernel/entities"
import { createAiTransformNode } from "@/kernel/transforms/create-ai-transform-node"
import { updateAiInstruction } from "@/kernel/transforms/update-ai-instruction"
import { updateAiTransformModel } from "@/kernel/transforms/update-ai-transform-model"
import { toggleAutoExecute } from "@/kernel/transforms/toggle-auto-execute"
import { updateAiInputMode } from "@/kernel/transforms/update-ai-input-mode"
import { updateOutputMode } from "@/kernel/transforms/update-output-mode"
import { updateSchema } from "@/kernel/transforms/update-schema"
import { updateSchemaMode } from "@/kernel/transforms/update-schema-mode"
import { executeAiTransform } from "@/client/domain/use-cases/execute-ai-transform"

type UseAiTransformHandlersArgs = {
  setNodes: Dispatch<SetStateAction<WorkspaceNode[]>>
  nodesRef: MutableRefObject<WorkspaceNode[]>
  connectionsRef: MutableRefObject<Connection[]>
  scheduleSave: (nodes: WorkspaceNode[], connections?: Connection[]) => void
  aiExecutor: AiExecutorPort
  roster: ModelRosterEntry[]
}

export function useAiTransformHandlers({
  setNodes, nodesRef, connectionsRef, scheduleSave, aiExecutor, roster,
}: UseAiTransformHandlersArgs) {
  const handleAddAiTransformNode = useCallback(
    (position: { x: number; y: number }) => {
      setNodes((prev) => {
        const defaultModel = roster[0]
        const node = defaultModel
          ? createAiTransformNode(position, defaultModel.provider, defaultModel.model)
          : createAiTransformNode(position)
        const updated = [...prev, node]
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave, roster]
  )

  const handleAiInstructionChange = useCallback(
    (nodeId: string, instruction: string) => {
      setNodes((prev) => {
        const updated = updateAiInstruction(prev, nodeId, instruction)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleAiModelChange = useCallback(
    (nodeId: string, provider: string, model: string) => {
      setNodes((prev) => {
        const updated = updateAiTransformModel(prev, nodeId, provider, model)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleAiInputModeChange = useCallback(
    (nodeId: string, inputMode: "concat" | "named") => {
      setNodes((prev) => {
        const updated = updateAiInputMode(prev, nodeId, inputMode)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleAiAutoExecuteToggle = useCallback(
    (nodeId: string) => {
      setNodes((prev) => {
        const updated = toggleAutoExecute(prev, nodeId)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleExecuteAiTransform = useCallback(
    async (nodeId: string, pipelineResults: Map<string, TransformResult>) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId && n.type === "ai-transform"
            ? { ...n, result: { status: "running" as const } }
            : n
        )
      )

      const update = await executeAiTransform({
        nodeId,
        nodes: nodesRef.current,
        connections: connectionsRef.current,
        aiExecutor,
        pipelineResults,
      })

      setNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId && n.type === "ai-transform"
            ? { ...n, result: update.result, updatedAt: Date.now() }
            : n
        )
      )
      scheduleSave(nodesRef.current)
    },
    [setNodes, nodesRef, connectionsRef, scheduleSave, aiExecutor]
  )

  const handleOutputModeChange = useCallback(
    (nodeId: string, mode: "text" | "structured") => {
      setNodes((prev) => {
        const updated = updateOutputMode(prev, nodeId, mode)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleSchemaChange = useCallback(
    (nodeId: string, schema: SchemaField[]) => {
      setNodes((prev) => {
        const updated = updateSchema(prev, nodeId, schema)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  const handleSchemaModeChange = useCallback(
    (nodeId: string, schemaMode: "single" | "collection") => {
      setNodes((prev) => {
        const updated = updateSchemaMode(prev, nodeId, schemaMode)
        scheduleSave(updated)
        return updated
      })
    },
    [setNodes, scheduleSave]
  )

  return {
    handleAddAiTransformNode,
    handleAiInstructionChange,
    handleAiModelChange,
    handleAiInputModeChange,
    handleAiAutoExecuteToggle,
    handleExecuteAiTransform,
    handleOutputModeChange,
    handleSchemaChange,
    handleSchemaModeChange,
  }
}
