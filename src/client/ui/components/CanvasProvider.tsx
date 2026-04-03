"use client"

import { ReactFlowProvider } from "@xyflow/react"

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>
}
