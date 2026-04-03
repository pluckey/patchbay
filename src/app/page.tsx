"use client"

import { ReactFlowProvider } from "@xyflow/react"
import { WorkspaceView } from "@/components/WorkspaceView"

export default function Home() {
  return (
    <div className="w-screen h-screen">
      <ReactFlowProvider>
        <WorkspaceView />
      </ReactFlowProvider>
    </div>
  )
}
