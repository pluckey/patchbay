"use client"

type ToolbarProps = {
  onAddNode: () => void
}

export function Toolbar({ onAddNode }: ToolbarProps) {
  return (
    <div className="absolute top-4 left-4 z-10">
      <button
        onClick={onAddNode}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors font-medium text-sm"
      >
        + Add Node
      </button>
    </div>
  )
}
