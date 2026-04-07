"use client"

import type { CSSProperties } from "react"
import JsonView, { ValueQuote } from "@uiw/react-json-view"

type JsonTreeViewProps = {
  data: unknown
  /** `true` collapses everything; an integer collapses below that depth. @default false */
  collapsed?: boolean | number
}

/**
 * Geist-aligned JSON tree view. All colors derive from shadcn semantic tokens
 * via CSS variables consumed by `@uiw/react-json-view`, so it tracks light/dark
 * mode automatically and stays monochromatic (no rainbow syntax highlighting).
 */
const geistTheme = {
  backgroundColor: "transparent",
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  // Structural elements: muted, recede into the background
  "--w-rjv-line-color": "var(--border)",
  "--w-rjv-arrow-color": "var(--muted-foreground)",
  "--w-rjv-curlybraces-color": "var(--muted-foreground)",
  "--w-rjv-colon-color": "var(--muted-foreground)",
  "--w-rjv-brackets-color": "var(--muted-foreground)",
  "--w-rjv-ellipsis-color": "var(--muted-foreground)",
  "--w-rjv-quotes-color": "var(--muted-foreground)",
  "--w-rjv-quotes-string-color": "var(--muted-foreground)",
  "--w-rjv-info-color": "var(--muted-foreground)",
  // Keys + values: primary foreground
  "--w-rjv-color": "var(--foreground)",
  "--w-rjv-key-string": "var(--foreground)",
  "--w-rjv-type-string-color": "var(--foreground)",
  "--w-rjv-type-int-color": "var(--foreground)",
  "--w-rjv-type-float-color": "var(--foreground)",
  "--w-rjv-type-bigint-color": "var(--foreground)",
  "--w-rjv-type-boolean-color": "var(--foreground)",
  "--w-rjv-type-date-color": "var(--foreground)",
  "--w-rjv-type-url-color": "var(--foreground)",
  // Nullish/special: muted, signals "absent"
  "--w-rjv-type-null-color": "var(--muted-foreground)",
  "--w-rjv-type-nan-color": "var(--muted-foreground)",
  "--w-rjv-type-undefined-color": "var(--muted-foreground)",
  // Copy feedback
  "--w-rjv-copied-color": "var(--muted-foreground)",
  "--w-rjv-copied-success-color": "var(--primary)",
  // Update flash (when highlightUpdates fires)
  "--w-rjv-update-color": "var(--primary)",
  "--w-rjv-edit-color": "var(--foreground)",
} as CSSProperties

export function JsonTreeView({ data, collapsed = false }: JsonTreeViewProps) {
  // JsonView requires an object/array at the root. Primitives get wrapped so the
  // toggle never crashes on edge cases (e.g. structured output that's just a string).
  const value = (typeof data === "object" && data !== null
    ? data
    : { value: data }) as object

  return (
    <JsonView
      value={value}
      style={geistTheme}
      collapsed={collapsed}
      displayDataTypes={false}
      displayObjectSize={false}
      enableClipboard={true}
      indentWidth={16}
      shortenTextAfterLength={0}
    >
      {/*
        Wrap long string values so prose content (e.g. extracted first principles)
        breaks inside its row instead of overflowing horizontally. The package
        defaults to single-line rendering, which makes long-string schemas
        unusable on a fixed-width canvas card.

        IMPORTANT: when overriding `<JsonView.String>` with a `render` for
        `type === 'value'`, the returned JSX replaces the package's entire
        default fragment — *including* the surrounding `<ValueQuote />`
        components (see the package's `cjs/types/index.js` TypeString render).
        We must re-emit ValueQuote ourselves to preserve string-vs-key
        distinction. The structured output is piped downstream, so quotes are
        part of map-territory truth and must not be silently dropped.
      */}
      <JsonView.String
        render={({ children, style, ...rest }, { type }) => {
          if (type === 'value') {
            return (
              <>
                <ValueQuote />
                <span
                  {...rest}
                  style={{
                    ...style,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    display: 'inline',
                  }}
                >
                  {children}
                </span>
                <ValueQuote />
              </>
            )
          }
        }}
      />
    </JsonView>
  )
}
