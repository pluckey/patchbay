"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useWorkspaceManagerContext } from "@/client/ui/app/workspace-manager-context"
import { Button } from "@/client/ui/components/ui/button"

export function WorkspaceSidepanel() {
  const { workspaces, activeId, switchTo, create, remove, rename } = useWorkspaceManagerContext()
  const [collapsed, setCollapsed] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Persist collapsed state
  useEffect(() => {
    try {
      const saved = localStorage.getItem("context-canvas:sidepanel-collapsed")
      if (saved === "true") setCollapsed(true)
    } catch { /* ignore */ }
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem("context-canvas:sidepanel-collapsed", String(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const startEditing = useCallback((id: string, currentName: string) => {
    setEditingId(id)
    setEditValue(currentName)
  }, [])

  const commitRename = useCallback(async () => {
    if (editingId && editValue.trim()) {
      await rename(editingId, editValue.trim())
    }
    setEditingId(null)
  }, [editingId, editValue, rename])

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

  const handleDelete = useCallback(async (id: string) => {
    const result = await remove(id)
    if (!result.ok && result.reason) {
      alert(result.reason)
    }
    setConfirmDeleteId(null)
  }, [remove])

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-r border-border bg-background py-2 px-1">
        <Button variant="ghost" size="icon-xs" onClick={toggleCollapsed} title="Expand workspaces">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </Button>
        <span className="text-[10px] text-muted-foreground [writing-mode:vertical-lr] select-none">
          {workspaces.find((w) => w.id === activeId)?.name ?? ""}
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-52 border-r border-border bg-background shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground select-none">Workspaces</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-xs" onClick={() => create()} title="New workspace">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={toggleCollapsed} title="Collapse">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
        </div>
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto py-1">
        {workspaces.map((ws) => (
          <div
            key={ws.id}
            className={`group flex items-center gap-1 px-2 py-1.5 mx-1 rounded-md cursor-pointer ${
              ws.id === activeId
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
            onClick={() => { if (ws.id !== activeId) switchTo(ws.id) }}
          >
            {/* Active indicator */}
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              ws.id === activeId ? "bg-indicator" : "bg-transparent"
            }`} />

            {/* Name (editable) */}
            {editingId === ws.id ? (
              <input
                ref={inputRef}
                className="flex-1 min-w-0 bg-transparent text-sm text-foreground outline-none border-b border-border"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename()
                  if (e.key === "Escape") setEditingId(null)
                }}
              />
            ) : (
              <span
                className="flex-1 min-w-0 text-sm truncate"
                onDoubleClick={() => startEditing(ws.id, ws.name)}
              >
                {ws.name}
              </span>
            )}

            {/* Delete button */}
            {confirmDeleteId === ws.id ? (
              <div className="flex items-center gap-0.5">
                <Button
                  variant="destructive"
                  size="icon-xs"
                  onClick={(e) => { e.stopPropagation(); handleDelete(ws.id) }}
                  title="Confirm delete"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}
                  title="Cancel"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon-xs"
                className="opacity-0 group-hover:opacity-100"
                disabled={workspaces.length <= 1}
                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(ws.id) }}
                title="Delete workspace"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
