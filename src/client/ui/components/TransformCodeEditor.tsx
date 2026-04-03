"use client"

import { useRef, useEffect, useCallback } from "react"
import Editor, { type OnMount, type Monaco } from "@monaco-editor/react"
import { MARKDOWN_INPUT_DEFS, PDF_INPUT_DEFS } from "./transform-input-types"

type TransformCodeEditorProps = {
  value: string
  sourceNodeType: "markdown" | "pdf"
  onChange: (value: string) => void
  onClose: () => void
}

export function TransformCodeEditor({ value, sourceNodeType, onChange, onClose }: TransformCodeEditorProps) {
  const onChangeRef = useRef(onChange)
  const onCloseRef = useRef(onClose)
  const monacoRef = useRef<Monaco | null>(null)
  onChangeRef.current = onChange
  onCloseRef.current = onClose

  const handleMount: OnMount = useCallback((editor, monaco) => {
    monacoRef.current = monaco

    // Inject input type definitions
    const typeDefs = sourceNodeType === "pdf" ? PDF_INPUT_DEFS : MARKDOWN_INPUT_DEFS
    monaco.languages.typescript.javascriptDefaults.setExtraLibs([
      { content: typeDefs, filePath: "file:///input-types.d.ts" },
    ])

    // Configure JS defaults for a function body context
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: true,
    })

    // Escape to close
    editor.addCommand(monaco.KeyCode.Escape, () => {
      onCloseRef.current()
    })

    editor.focus()
  }, [sourceNodeType])

  // Update extra libs when source type changes after initial mount
  useEffect(() => {
    if (!monacoRef.current) return
    const typeDefs = sourceNodeType === "pdf" ? PDF_INPUT_DEFS : MARKDOWN_INPUT_DEFS
    monacoRef.current.languages.typescript.javascriptDefaults.setExtraLibs([
      { content: typeDefs, filePath: "file:///input-types.d.ts" },
    ])
  }, [sourceNodeType])

  return (
    <div
      className="rounded overflow-hidden border border-input cursor-text nodrag nowheel"
      style={{ flex: "1 1 0", minHeight: 0 }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Editor
        defaultLanguage="javascript"
        defaultValue={value}
        theme="vs-dark"
        onChange={(val) => onChangeRef.current(val ?? "")}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          lineNumbers: "off",
          glyphMargin: false,
          folding: false,
          scrollBeyondLastLine: false,
          fontSize: 12,
          fontFamily: "var(--font-geist-mono), monospace",
          tabSize: 2,
          wordWrap: "on",
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          padding: { top: 8, bottom: 8 },
          renderLineHighlight: "none",
          contextmenu: false,
        }}
      />
    </div>
  )
}
