/**
 * Pure helper functions for working with PDF inputs in Transform nodes.
 * These operate on ResolvedPdfInput data — no side effects, no ports.
 *
 * NOTE: The runtime versions of these helpers are defined in
 * public/transform-worker.js as plain JS (the worker can't import TS).
 * This file is the documented, type-safe source of truth.
 * Keep both in sync.
 */

import type { ResolvedPdfInput } from "../entities/resolved-input"

function isPdf(input: unknown): input is ResolvedPdfInput {
  return typeof input === "object" && input !== null && (input as Record<string, unknown>).type === "pdf"
}

/** Pages from `from` to `to` (1-indexed, inclusive) as an array of { page, text }. */
export function pageRange(input: unknown, from: number, to: number): { page: number; text: string }[] {
  if (!isPdf(input)) return []
  return input.pages.slice(from - 1, to).map((text, i) => ({ page: from + i, text }))
}

/** Pages surrounding currentPage within `radius` as an array of { page, text }. */
export function surrounding(input: unknown, radius: number): { page: number; text: string }[] {
  if (!isPdf(input)) return []
  const start = Math.max(1, input.currentPage - radius)
  const end = Math.min(input.totalPages, input.currentPage + radius)
  return pageRange(input, start, end)
}

/** All pages joined. */
export function allText(input: unknown): string {
  if (!isPdf(input)) return ""
  return input.pages.join("\n\n")
}

/** All annotation texts as an array. */
export function annotationTexts(input: unknown): string[] {
  if (!isPdf(input)) return []
  return input.annotations.map((a) => a.text)
}

/** Total page count. */
export function pageCount(input: unknown): number {
  if (!isPdf(input)) return 0
  return input.totalPages
}

/** Text of the current page. */
export function currentPageText(input: unknown): string {
  if (!isPdf(input)) return ""
  return input.pages[input.currentPage - 1] ?? ""
}
