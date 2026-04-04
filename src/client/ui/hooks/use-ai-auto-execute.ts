"use client"

import { useEffect, useRef } from "react"
import type { WorkspaceNode, Connection } from "@/kernel/entities"

type UseAiAutoExecuteArgs = {
  nodes: WorkspaceNode[]
  connections: Connection[]
  onExecute: (nodeId: string) => void
}

/**
 * Watches upstream content changes for ai-transform nodes with autoExecute: true.
 * Triggers re-execution with 1-second debounce.
 */
export function useAiAutoExecute({ nodes, connections, onExecute }: UseAiAutoExecuteArgs) {
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const prevInputHashesRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    const autoNodes = nodes.filter(
      (n) => n.type === "ai-transform" && n.autoExecute
    )

    for (const node of autoNodes) {
      // Skip if currently running
      if (node.type === "ai-transform" && node.result?.status === "running") continue

      const incomingConns = connections.filter((c) => c.targetId === node.id)
      if (incomingConns.length === 0) continue

      const inputParts: string[] = []
      for (const conn of incomingConns) {
        const source = nodes.find((n) => n.id === conn.sourceId)
        if (!source) continue
        if (source.type === "markdown") inputParts.push(source.content)
        else if (source.type === "ai-transform" && source.result?.status === "success") inputParts.push(source.result.output)
        else inputParts.push(source.updatedAt.toString())
      }
      if (node.type === "ai-transform") inputParts.push(node.instruction)

      const inputHash = inputParts.join("|")
      const prevHash = prevInputHashesRef.current.get(node.id)

      if (prevHash !== undefined && prevHash !== inputHash) {
        const existing = timersRef.current.get(node.id)
        if (existing) clearTimeout(existing)

        const timer = setTimeout(() => {
          timersRef.current.delete(node.id)
          onExecute(node.id)
        }, 1000)
        timersRef.current.set(node.id, timer)
      }

      prevInputHashesRef.current.set(node.id, inputHash)
    }

    // Cleanup removed nodes
    for (const nodeId of prevInputHashesRef.current.keys()) {
      if (!autoNodes.some((n) => n.id === nodeId)) {
        prevInputHashesRef.current.delete(nodeId)
        const timer = timersRef.current.get(nodeId)
        if (timer) {
          clearTimeout(timer)
          timersRef.current.delete(nodeId)
        }
      }
    }
  }, [nodes, connections, onExecute])

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer)
      }
    }
  }, [])
}
