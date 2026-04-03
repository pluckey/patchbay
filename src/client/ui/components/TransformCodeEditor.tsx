"use client"

import { useRef, useEffect, useCallback } from "react"
import { EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view"
import { EditorState } from "@codemirror/state"
import { javascript } from "@codemirror/lang-javascript"
import { autocompletion, type CompletionContext, type Completion } from "@codemirror/autocomplete"
import { oneDark } from "@codemirror/theme-one-dark"

type TransformCodeEditorProps = {
  value: string
  sourceNodeType: "markdown" | "pdf"
  onChange: (value: string) => void
  onClose: () => void
}

const MARKDOWN_COMPLETIONS: Completion[] = [
  { label: "input.text", type: "property", detail: "string", info: "The markdown content" },
  { label: "input.type", type: "property", detail: '"markdown"', info: "Source node type" },
]

const PDF_COMPLETIONS: Completion[] = [
  { label: "input.text", type: "property", detail: "string", info: "Text content of the current page" },
  { label: "input.pages", type: "property", detail: "string[]", info: "All page texts, 0-indexed — pages[0] is page 1" },
  { label: "input.type", type: "property", detail: '"pdf"', info: "Source node type" },
  { label: "input.currentPage", type: "property", detail: "number", info: "Currently viewed page number (1-based)" },
  { label: "input.totalPages", type: "property", detail: "number", info: "Total page count" },
  { label: "input.filename", type: "property", detail: "string", info: "PDF filename" },
]

function buildCompletionSource(sourceNodeType: "markdown" | "pdf") {
  return (context: CompletionContext) => {
    // Match "input." or deeper property access
    const match = context.matchBefore(/input\.[\w.]*/)
    if (!match) {
      // Check for bare "input" at word boundary
      const bareMatch = context.matchBefore(/\binput\b/)
      if (bareMatch) {
        return {
          from: bareMatch.from,
          options: [{ label: "input", type: "variable", detail: sourceNodeType === "pdf" ? "{text, pages, currentPage, ...}" : "{text, type}" }],
        }
      }
      return null
    }

    // "input." → top-level properties
    const completions = sourceNodeType === "pdf" ? PDF_COMPLETIONS : MARKDOWN_COMPLETIONS
    return { from: match.from, options: completions }
  }
}

export function TransformCodeEditor({ value, sourceNodeType, onChange, onClose }: TransformCodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onCloseRef = useRef(onClose)
  onChangeRef.current = onChange
  onCloseRef.current = onClose

  const completionSource = useCallback(
    (context: CompletionContext) => buildCompletionSource(sourceNodeType)(context),
    [sourceNodeType]
  )

  useEffect(() => {
    if (!containerRef.current) return

    const state = EditorState.create({
      doc: value,
      extensions: [
        javascript(),
        autocompletion({
          override: [completionSource],
          activateOnTyping: true,
        }),
        oneDark,
        placeholderExt("return input.text"),
        keymap.of([
          {
            key: "Escape",
            run: () => {
              onCloseRef.current()
              return true
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString())
          }
        }),
        EditorView.theme({
          "&": { fontSize: "12px", height: "100%" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { padding: "4px 0" },
          ".cm-gutters": { display: "none" },
        }),
        EditorState.tabSize.of(2),
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })
    viewRef.current = view

    // Focus after mount
    requestAnimationFrame(() => view.focus())

    return () => {
      view.destroy()
      viewRef.current = null
    }
  // Only create once per mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      className="rounded overflow-hidden border border-input cursor-text nodrag nowheel"
      style={{ flex: "1 1 0", minHeight: 0 }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    />
  )
}
