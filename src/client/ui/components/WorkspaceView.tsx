"use client"

import { useWorkspaceViewModel } from "@/client/ui/hooks/use-workspace-view-model"
import { Canvas } from "./Canvas"
import { Toolbar } from "./Toolbar"
import { MixPanel } from "./MixPanel"
import { ScopeView } from "./ScopeView"

export function WorkspaceView() {
  const vm = useWorkspaceViewModel()

  if (!vm.isLoaded) return null

  return (
    <>
      <Toolbar
        onAddNode={vm.toolbar.onAddNode}
        onAddTransform={vm.toolbar.onAddTransform}
        onAddChat={vm.toolbar.onAddChat}
        onAddAiTransform={vm.toolbar.onAddAiTransform}
        onUploadPdf={vm.toolbar.onUploadPdf}
        onAddSource={vm.toolbar.onAddSource}
        onAddAi={vm.toolbar.onAddAi}
        onAddCode={vm.toolbar.onAddCode}
      />
      <div className="flex h-full w-full">
        <div className="flex-1 relative">
          <Canvas
            nodes={vm.canvas.flowNodes}
            edges={vm.canvas.flowEdges}
            onNodesChange={vm.canvas.onNodesChange}
            onEdgesChange={vm.canvas.onEdgesChange}
            onNodeDragStop={vm.canvas.onNodeDragStop}
            onNodeDoubleClick={vm.canvas.onNodeDoubleClick}
            onConnect={vm.canvas.onConnect}
            initialViewport={vm.canvas.initialViewport}
            onDropPdf={vm.canvas.onDropPdf}
          />
        </div>
        <MixPanel entries={vm.mix.entries} />
      </div>
      {vm.scope.focusedCell && (
        <ScopeView
          cell={vm.scope.focusedCell}
          inputs={vm.scope.inputs}
          inputLegend={vm.scope.inputLegend}
          health={vm.scope.health}
          roster={vm.scope.roster}
          onNavigateToCell={vm.scope.onNavigateToCell}
          onTrigger={vm.scope.onTrigger}
          onContentChange={vm.scope.onContentChange}
          onInstructionChange={vm.scope.onInstructionChange}
          onCodeChange={vm.scope.onCodeChange}
          onModelChange={vm.scope.onModelChange}
          onTimeoutChange={vm.scope.onTimeoutChange}
          onOutputModeChange={vm.scope.onOutputModeChange}
          onSchemaChange={vm.scope.onSchemaChange}
          onSchemaModeChange={vm.scope.onSchemaModeChange}
          onClose={vm.scope.onClose}
        />
      )}
    </>
  )
}
