"use client"

import { memo, Suspense, lazy } from "react"
import type { NodeProps } from "@xyflow/react"
import { NodeShell } from "./NodeShell"
import type { PdfFlowNodeData } from "@/client/adapters/canvas/flow-node-mapper"

const PdfContent = lazy(() =>
  import("./PdfContent").then((m) => ({ default: m.PdfContent }))
)

function PdfNodeInner({ data }: NodeProps) {
  const {
    nodeId, blobId, filename, currentPage, totalPages, zoomLevel, darkMode,
    annotations, onNavigatePage, onZoomChange, onDarkModeToggle,
    onAnnotationCreate, onAnnotationDelete, onAnnotationEdit, onDelete, onDuplicate, onResizeEnd,
  } = data as unknown as PdfFlowNodeData

  return (
    <NodeShell
      nodeId={nodeId}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
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
          zoomLevel={zoomLevel}
          darkMode={darkMode}
          annotations={annotations}
          onNavigatePage={(page) => onNavigatePage(nodeId, page)}
          onZoomChange={(zoom) => onZoomChange(nodeId, zoom)}
          onDarkModeToggle={() => onDarkModeToggle(nodeId)}
          onAnnotationCreate={(page, region, label, text) => onAnnotationCreate(nodeId, page, region, label, text)}
          onAnnotationDelete={(annotationId) => onAnnotationDelete(nodeId, annotationId)}
          onAnnotationEdit={(annotationId, label, region) => onAnnotationEdit(nodeId, annotationId, label, region)}
        />
      </Suspense>
    </NodeShell>
  )
}

export const PdfNode = memo(PdfNodeInner)
