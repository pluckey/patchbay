"use client"

import { memo, Suspense, lazy } from "react"
import type { NodeProps } from "@xyflow/react"
import { NodeShell } from "./NodeShell"
import type { PdfFlowNodeData } from "@/client/adapters/canvas/flow-node-mapper"

const PdfContent = lazy(() =>
  import("./PdfContent").then((m) => ({ default: m.PdfContent }))
)

function PdfNodeInner({ data }: NodeProps) {
  const { nodeId, blobId, filename, currentPage, totalPages, onNavigatePage, onDelete, onResizeEnd } =
    data as unknown as PdfFlowNodeData

  return (
    <NodeShell
      nodeId={nodeId}
      onDelete={onDelete}
      onResizeEnd={onResizeEnd}
      header={
        <div className="px-3 py-2 text-xs text-muted-foreground truncate">
          {filename}
        </div>
      }
    >
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-3">
            <div className="text-sm text-muted-foreground">Loading PDF viewer...</div>
          </div>
        }
      >
        <PdfContent
          blobId={blobId}
          filename={filename}
          currentPage={currentPage}
          totalPages={totalPages}
          onNavigatePage={(page) => onNavigatePage(nodeId, page)}
        />
      </Suspense>
    </NodeShell>
  )
}

export const PdfNode = memo(PdfNodeInner)
