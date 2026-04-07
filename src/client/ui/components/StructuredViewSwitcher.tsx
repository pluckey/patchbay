"use client"

import { useState } from "react"
import type { SchemaField } from "@/kernel/entities"
import { StructuredOutputDisplay } from "./StructuredOutputDisplay"
import { JsonTreeView } from "./JsonTreeView"

type StructuredViewSwitcherProps = {
  data: Record<string, unknown> | Record<string, unknown>[]
  schema: SchemaField[]
}

/**
 * Toggles between schema-aware "table" rendering and a raw "json" tree.
 * State is local to the switcher — not persisted; resets on remount.
 *
 * The toggle row carries `nodrag` + pointerdown stop-propagation so it can be
 * dropped inside a draggable canvas node without triggering a node drag. These
 * are no-ops outside the canvas (e.g. inside the Scope panel).
 */
export function StructuredViewSwitcher({ data, schema }: StructuredViewSwitcherProps) {
  const [view, setView] = useState<'table' | 'json'>('table')

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex items-center gap-1 nodrag"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setView('table')}
          className={`text-[10px] px-1.5 py-0.5 rounded ${view === 'table' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          table
        </button>
        <button
          type="button"
          onClick={() => setView('json')}
          className={`text-[10px] px-1.5 py-0.5 rounded ${view === 'json' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
        >
          json
        </button>
      </div>
      {view === 'table' ? (
        <StructuredOutputDisplay data={data} schema={schema} />
      ) : (
        <JsonTreeView data={data} />
      )}
    </div>
  )
}
