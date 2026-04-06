"use client"

import { createContext, useContext } from "react"
import type { WorkspaceRef } from "@/kernel/entities"

export type WorkspaceManagerState = {
  workspaces: WorkspaceRef[]
  activeId: string
  switchTo: (id: string) => Promise<void>
  create: (name?: string) => Promise<WorkspaceRef>
  remove: (id: string) => Promise<{ ok: boolean; reason?: string }>
  rename: (id: string, name: string) => Promise<void>
  registerFlush: (fn: () => void) => void
}

export const WorkspaceManagerContext = createContext<WorkspaceManagerState | null>(null)

export function useWorkspaceManagerContext(): WorkspaceManagerState {
  const ctx = useContext(WorkspaceManagerContext)
  if (!ctx) throw new Error("useWorkspaceManagerContext must be used within WorkspaceManagerProvider")
  return ctx
}
