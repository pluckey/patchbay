"use client"

import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import { MermaidDiagram } from "./MermaidDiagram"

/**
 * ReactMarkdown component overrides: intercept fenced code blocks whose
 * language is `mermaid` and render them as SVG diagrams. All other code blocks
 * (inline or fenced) fall through to the default `<code>` rendering so the
 * `prose` typography styles still apply.
 *
 * Defined at module scope so the object reference is stable across renders —
 * preventing ReactMarkdown from re-mounting children on every render.
 */
const markdownComponents: Components = {
  code(props) {
    const { className, children, ...rest } = props
    const match = /language-(\w+)/.exec(className ?? "")
    if (match?.[1] === "mermaid") {
      // Strip the trailing newline that fenced code blocks always carry.
      const source = String(children).replace(/\n$/, "")
      return <MermaidDiagram source={source} />
    }
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    )
  },
}

// GFM enables tables, strikethrough, task lists, and autolinks. AI output
// frequently uses these — especially tables — so without this plugin the
// markdown silently degrades to plain text runs.
const markdownRemarkPlugins = [remarkGfm]

type MarkdownViewProps = {
  content: string
}

/**
 * Single source of truth for rendering markdown across the app: cell output,
 * chat messages, markdown nodes, and source-cell previews. Wraps ReactMarkdown
 * with `remark-gfm` and the mermaid `code` override so every markdown surface
 * supports tables, task lists, and fenced ```mermaid diagrams uniformly.
 *
 * Bare component — no wrapper div or className. Each call site already wraps
 * it in its own `prose` container with site-specific spacing modifiers.
 */
export function MarkdownView({ content }: MarkdownViewProps) {
  return (
    <ReactMarkdown components={markdownComponents} remarkPlugins={markdownRemarkPlugins}>
      {content}
    </ReactMarkdown>
  )
}
