/**
 * A SourceKindContribution describes everything a source kind needs to
 * contribute so that downstream cells can consume it. The four required
 * fields (kind, bindingName, loadLibrary, parse, typeDefFragment) plus the
 * two optional ones (gesture, presentation) are the entire contract.
 *
 * Cell workers, cell executors, type-def generators, and the cascade only
 * ever talk to the registry — they never know about specific kinds. Adding
 * a new source kind is one new file implementing this interface plus one
 * registry registration line.
 *
 * Pure kernel types. No framework dependencies. The concrete contribution
 * implementations live in client/adapters because they touch framework
 * libraries (pdf.js, etc.).
 */

export interface SourceKindContribution {
  /**
   * Unique string identifier for this kind. Doubles as the discriminator
   * matching `WorkspaceNode.type` for legacy node sources, and is used by
   * `extractFromNode` to claim ownership of nodes of that type.
   */
  readonly kind: string

  /**
   * The conventional variable name a cell author writes in code to access
   * this source. For example, `"pdf"` is the convention for the PDF kind,
   * so users typically name their PDF connection `pdf`. The actual binding
   * name in user code is the connection label, not this field — this is
   * just the suggested default and a uniqueness anchor (two contributions
   * claiming the same binding name is a registration error).
   */
  readonly bindingName: string

  /**
   * Loads any library code this kind needs into the cell worker context.
   * Called inside the worker. Always async, even if the work is trivial,
   * to keep the contract uniform. May be a no-op for kinds with no library.
   * The returned handle is opaque and may be used by `parse`.
   */
  readonly loadLibrary: () => Promise<unknown>

  /**
   * Optional. Extracts a raw artifact (bytes, blob, string, JSON, etc.)
   * from a legacy WorkspaceNode of this kind's type. Runs on the main
   * thread (it has access to client-side ports like blob storage). The
   * returned value is shipped to the cell worker via postMessage and then
   * passed to `parse`. Absent for kinds that don't have a corresponding
   * legacy WorkspaceNode (e.g., the "derived" kind for cell-to-cell flow).
   *
   * The deps argument intentionally uses `unknown` to keep the kernel
   * contract framework-free; the client-side cascade casts to the concrete
   * deps shape it provides.
   */
  readonly extractFromNode?: (node: unknown, deps: unknown) => Promise<unknown>

  /**
   * Turns a kind-controlled raw artifact (bytes, blob, string, JSON, etc.)
   * into the in-memory object the cell author will see bound to the
   * connection label. The output type is whatever the kind chooses to
   * expose; by convention kinds expose the library-native object directly
   * without wrapping (no helpers, no proxies, no `.raw` properties).
   */
  readonly parse: (rawArtifact: unknown, libraryHandle: unknown) => Promise<unknown>

  /**
   * A TypeScript declaration string that types the binding for Monaco's
   * intellisense. Strings (not structured ASTs) because Monaco's
   * `addExtraLib` consumes strings; the type-def generator is a
   * concatenator, not a compiler.
   *
   * Should declare types but NOT the binding itself — the type-def
   * generator emits `declare const <bindingName>: <Type>` lines based on
   * the cell's actual incoming connections.
   */
  readonly typeDefFragment: string

  /**
   * Optional. A canonical type expression Monaco should use when emitting
   * `declare const <bindingName>: <Type>`. If absent, the binding is typed
   * as `unknown` and the cell author must rely on the typeDefFragment for
   * any usable types. Most kinds will set this.
   */
  readonly bindingTypeExpression?: string

  /**
   * Optional. A contribution to the canvas-side ingestion UI describing
   * how a user creates a source of this kind directly. Absent for kinds
   * that exist only via wiring from elsewhere.
   */
  readonly gesture?: SourceKindGesture

  /**
   * Optional. Human-readable label and glyph hint for places like the
   * Scope inputs panel. Consumers fall back to the kind name verbatim
   * if absent. No consumer ever contains a hardcoded kind→label map.
   */
  readonly presentation?: SourceKindPresentation
}

export interface SourceKindGesture {
  /** Label for the toolbar / button that creates a source of this kind. */
  readonly label: string
  /** File picker accept patterns, if this kind ingests via file pick. */
  readonly fileAccept?: string
}

export interface SourceKindPresentation {
  /** Short human-readable label (e.g., "PDF", "Markdown", "CSV"). */
  readonly label: string
  /** Optional glyph identifier — interpretation is consumer-defined. */
  readonly glyph?: string
}
