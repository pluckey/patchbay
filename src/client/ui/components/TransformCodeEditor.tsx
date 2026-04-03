"use client"

import { useRef, useCallback, useEffect } from "react"
import Editor, { type OnMount, type Monaco } from "@monaco-editor/react"
import type { InputLegendEntry } from "@/kernel/entities"
import { buildInputTypeDefs } from "./transform-input-types"

type TransformCodeEditorProps = {
  value: string
  inputLegend: InputLegendEntry[]
  onChange: (value: string) => void
  onClose: () => void
}

export function TransformCodeEditor({ value, inputLegend, onChange, onClose }: TransformCodeEditorProps) {
  const onChangeRef = useRef(onChange)
  const onCloseRef = useRef(onClose)
  const monacoRef = useRef<Monaco | null>(null)
  const libDisposableRef = useRef<{ dispose: () => void } | null>(null)
  const libVersionRef = useRef(0)
  onChangeRef.current = onChange
  onCloseRef.current = onClose

  const handleMount: OnMount = useCallback((editor, monaco) => {
    monacoRef.current = monaco

    // Configure JS defaults
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: true,
    })

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [1108], // "A 'return' statement can only be used within a function body" — our code IS a function body at runtime
    })

    // Inject type definitions with versioned path to force re-resolution
    const typeDefs = buildInputTypeDefs(inputLegend)
    const version = ++libVersionRef.current
    libDisposableRef.current = monaco.languages.typescript.javascriptDefaults.addExtraLib(
      typeDefs,
      `file:///input-types-${version}.d.ts`
    )

    // Escape to close
    editor.addCommand(monaco.KeyCode.Escape, () => {
      onCloseRef.current()
    })

    editor.focus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update type definitions when input legend changes
  useEffect(() => {
    const monaco = monacoRef.current
    if (!monaco) return

    // Dispose previous lib
    libDisposableRef.current?.dispose()

    // Add updated lib with new path to force Monaco to re-resolve
    const typeDefs = buildInputTypeDefs(inputLegend)
    const version = ++libVersionRef.current
    libDisposableRef.current = monaco.languages.typescript.javascriptDefaults.addExtraLib(
      typeDefs,
      `file:///input-types-${version}.d.ts`
    )
  }, [inputLegend])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      libDisposableRef.current?.dispose()
      libDisposableRef.current = null
    }
  }, [])

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
