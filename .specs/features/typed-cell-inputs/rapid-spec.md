---
feature: typed-cell-inputs
center: "Signal-field Code and AI cells accept legacy PdfNode and MarkdownNode as upstream inputs with full structured ResolvedInput payloads, and Code cell Monaco editors show typed autocomplete synthesized from each cell's actual incoming connections."
center_test:
  excludes: "Add PDF support inside the signal-field Source cell — closes the same parity gap but requires architectural decisions (source-kind union, ingestion ritual, migration) that are explicitly shelved."
  boundary: "Show recent-sample values in Monaco hover — structurally adjacent to type hints but requires runtime execution and a freshness model; this spec is strictly structural (types from declared shapes, no sampling)."
archetypes: [integration-wiring, surface-redesign]
mode: express
analogues: [cell-parity-increment, pdf-viewer-node, transform-node-polish]
---

# Typed Cell Inputs (Rapid Spec)

## Context

Tactical alternative to `cell-parity-increment`, which deliberated three roundtable passes without converging on a committable architecture for PDF-inside-Source-cell. The user chose to shelve the architectural question and ship a smaller, honest change: let the existing legacy PdfNode (which already has rendering, page nav, and annotations) feed its full structured payload into signal-field Code and AI cells, and teach the Code cell's Monaco editor to show the resulting input shapes as typed autocomplete.

The strangler-fig boundary between legacy nodes and cells is intentionally narrower than it appears — connection creation, flow edge rendering, xyflow handles, the transform worker, the `pdf.*` helper namespace, and the `ResolvedPdfInput` entity are all already free of partition. The only intentional wall is `validateConnection` rejecting cross-type connections, and `executeCascade` resolving only cell-sourced inputs (flat strings, no typed payloads).

This spec bridges that wall for the specific pair of directions that unblock the user's work: **legacy PdfNode and MarkdownNode → signal-field Code and AI cells**. The reverse direction (cell → legacy) stays rejected. Cell → Cell is unchanged. Legacy → legacy is unchanged.

## Acceptance Criteria

### ac-cross-type-validation: validateConnection permits legacy → cell for PDF and markdown sources
`validateConnection` returns `valid: true` for the following cross-type pairs: PdfNode → CodeCell, PdfNode → AiCell, MarkdownNode → CodeCell, MarkdownNode → AiCell. Every other cell↔legacy cross-type combination remains rejected with an informative reason. Source-cell-as-target is still rejected. Self-connections and cycles still rejected.

### ac-cascade-resolves-legacy-inputs: Cascade passes structured ResolvedInput for legacy upstream nodes
When a Code or AI cell is triggered and has an incoming connection from a legacy PdfNode or MarkdownNode, the cascade resolves that upstream node via the shared `resolveSourceContent` use case and passes the full `ResolvedInput` payload (with `type: "pdf"` or `type: "markdown"` discriminant) into the cell's inputs map under the connection's label.

### ac-pdf-helpers-on-code-cell: Code cell can use pdf.* helpers on legacy PDF inputs
A Code cell wired to a legacy PdfNode can execute `pdf.allText(inputs.my_pdf_label)`, `pdf.pageRange(inputs.my_pdf_label, 1, 5)`, `pdf.pageCount(inputs.my_pdf_label)`, and all other helpers from `kernel/transforms/pdf-helpers.ts`, with the same behavior a legacy Transform node gets.

### ac-ai-cell-concat-fix: AI cell extracts text from structured inputs
The AI cell's user-message builder in `executeCascade` extracts `.text` from each resolved input rather than string-coercing the object, so AI prompts receive readable text for markdown, PDF, and derived cell-output inputs. (This is a bug fix required by the shape change — the current `${label}: ${content}` concatenation would produce `[object Object]` after the input shape is bumped.)

### ac-staleness-tracks-legacy: lastInputHash reflects legacy input state changes
The cascade's `lastInputHash` computation is stable and deterministic across the richer input shape. If a legacy PdfNode's page, annotations, or blob changes upstream of a cell, the cell's input hash differs from its prior hash on the next cascade trigger — signaling staleness honestly.

### ac-scope-inputs-show-legacy: Scope Inputs column displays legacy sources with type badges
Opening the Scope on a cell with legacy PdfNode or MarkdownNode as an upstream connection displays those inputs in the Inputs column, labeled by the connection label, with a type badge distinguishing markdown from PDF from derived (cell-sourced). PDF inputs show metadata (filename, page count, annotation count) rather than raw extracted text — the text projection is available at execution time but the Scope preview is synchronous and does not await blob fetches.

### ac-monaco-inputs-type: Monaco declares typed inputs global per cell's connections
Opening a Code cell in the Scope renders a Monaco editor that, via `monaco.languages.typescript.javascriptDefaults.addExtraLib`, declares an `inputs` global whose type is an object literal keyed by each incoming connection's label, with each value typed as `ResolvedPdfInput`, `ResolvedMarkdownInput`, or `ResolvedDerivedInput` matching the source kind of that connection. Typing `inputs.` inside the editor shows autocomplete for each label; typing `inputs.my_pdf_label.` shows `text | pages | currentPage | totalPages | filename | annotations | type`.

### ac-monaco-pdf-namespace: Monaco declares pdf.* helper namespace with signatures
The same injected type lib declares a `pdf` namespace with signatures copied verbatim from `kernel/transforms/pdf-helpers.ts`, so `pdf.` shows autocomplete for all helper functions and their return types flow through chained expressions (`pdf.pageRange(inputs.x, 1, 3).map(p => p.text).` shows string methods).

### ac-type-hints-refresh: Monaco type lib regenerates on connection changes
When the author adds, removes, relabels, or replaces an incoming connection to a Code cell, the Monaco type lib is regenerated and reinjected within the same Scope session. The editor's IntelliSense reflects the new shape without closing and reopening the Scope or triggering a cascade.

### ac-legacy-pipeline-unchanged: Legacy-only pipelines continue to work identically
Existing legacy-only pipelines (PdfNode → TransformNode, MarkdownNode → TransformNode, PdfNode → AiTransformNode, etc.) execute exactly as before. The extraction of `resolveSourceContent` into a shared use case is a pure refactor with no behavior change for the legacy path.

### ac-strangler-fig-intact: All other cross-type connections remain rejected
Cell → legacy node connections remain rejected. Cell → ChatNode, Cell → TransformNode, Cell → AiTransformNode remain rejected. MarkdownNode → SourceCell, PdfNode → SourceCell remain rejected (source cells cannot receive input). The strangler-fig boundary stays intact for every pair not explicitly enabled by `ac-cross-type-validation`.

## Tasks

### t-relax-validation: Permit targeted legacy→cell cross-type connections
> **Traces:** ac-cross-type-validation, ac-strangler-fig-intact
> **Status:** pending

Update `src/kernel/transforms/validate-connection.ts` so the cross-type rejection at lines 28-30 becomes a conditional allow. Permit only the four pairs: `(pdf|markdown) node → (code|ai) cell`. Every other cross-type combination keeps its current rejection with an informative reason. Source-cell-as-target rejection remains.

- **Done when**: Unit tests (to be added in `src/kernel/transforms/__tests__/signal-field.test.ts`) cover: (a) each of the four permitted pairs returns `valid: true`; (b) `pdf → source-cell` returns invalid; (c) `cell → pdf-node` returns invalid; (d) `pdf → chat-node` returns invalid (unchanged legacy behavior); (e) `markdown → code-cell` valid; (f) cycle detection and self-connection still work across cross-type graphs.

### t-share-resolver: Extract resolveSourceContent into shared use case
> **Traces:** ac-cascade-resolves-legacy-inputs, ac-legacy-pipeline-unchanged
> **Status:** pending

Extract the `resolveSourceContent` function from `src/client/domain/use-cases/execute-pipeline.ts` (lines 15-74) into a new standalone use case at `src/client/domain/use-cases/resolve-source-content.ts`. The new module exports `resolveSourceContent(sourceNode, deps, priorResults?)` with the same signature and behavior. `execute-pipeline.ts` imports from the new location and keeps no behavior differences.

- **Done when**: legacy pipeline regression — a PdfNode wired to a TransformNode with code `return pdf.allText(input.input_label)` produces identical output before and after the refactor. No public API changes. No new dependencies added to the function body.

### t-cascade-legacy: Teach cascade to resolve legacy upstream nodes into cells
> **Traces:** ac-cascade-resolves-legacy-inputs, ac-pdf-helpers-on-code-cell, ac-ai-cell-concat-fix, ac-staleness-tracks-legacy
> **Status:** pending

Coordinated change across `src/client/domain/use-cases/execute-cascade.ts` and `src/kernel/transforms/resolve-cell-inputs.ts`:

1. Add `nodes: WorkspaceNode[]` to `executeCascade`'s parameter list and `blobStorage: BlobStoragePort`, `pdfRenderer: PdfRendererPort` to its `ports` object.
2. Before iterating the schedule, pre-resolve any legacy node that is the source of any connection whose target is a cell in the schedule. Call `resolveSourceContent(node, { blobStorage, pdfRenderer })` for each. Store results in a `Map<nodeId, ResolvedInput>`.
3. Bump `resolve-cell-inputs.ts` signature to `resolveCellInputs(cellId, cells, connections, nodes, outputs?, legacyOutputs?) => Record<string, ResolvedInput>`. For each incoming connection: if source is a cell, wrap its output as `{ text, type: "derived" }`; if source is a legacy node, look up `legacyOutputs.get(sourceId)`; skip if neither found or cell output not successful.
4. Update `hashInputs` in `execute-cascade.ts` to accept `Record<string, ResolvedInput>`. Still JSON.stringify the sorted entries — the richer shape serializes deterministically.
5. Fix the AI cell user-message builder at `execute-cascade.ts:59-62`: use `${label}: ${input.text}` instead of string-coercing the object.
6. Update `useCascade` in `src/client/ui/hooks/use-cascade.ts` to read `blobStorage` and `pdfRenderer` from `useAdapters()`, and pass `nodesRef.current` as the new `nodes` argument into `executeCascade`.
7. Update the one existing test `resolveCellInputs: keys by source title` in `src/kernel/transforms/__tests__/signal-field.test.ts` to pass `[]` for `nodes` and assert the `{ text, type: "derived" }` shape. Add new tests: (a) a cell with an upstream markdown-node returns a `ResolvedMarkdownInput`; (b) a cell with an upstream pdf-node (mocked via the legacyOutputs map) returns a `ResolvedPdfInput`.
8. Also update `src/client/ui/hooks/use-scope-data.ts` — the other caller of `resolveCellInputs` — see task `t-scope-inputs-display-legacy-sources`.

- **Done when**: (a) a Code cell wired to a PdfNode and containing `return pdf.allText(inputs.my_pdf_label)` executes and produces the PDF text; (b) a Code cell wired to a MarkdownNode and containing `return inputs.notes.text` produces the markdown content; (c) an AI cell wired to a PdfNode receives a readable user message (no `[object Object]`); (d) `lastInputHash` changes when the upstream PdfNode's `currentPage` changes; (e) all pre-existing cell→cell cascade tests still pass; (f) legacy `executePipeline` path still works.

### t-scope-inputs-display: Scope Inputs column renders legacy sources with type badges
> **Traces:** ac-scope-inputs-show-legacy
> **Status:** pending

Update `src/client/ui/hooks/use-scope-data.ts` to accept `nodes: WorkspaceNode[]` as a new parameter, and build the `ScopeInput[]` list by dispatching on the source kind of each incoming connection: cell source uses the cell's current output text preview (unchanged), markdown-node source uses `node.content`, pdf-node source shows a metadata string like `"{filename} · {totalPages} pages · {annotations.length} annotations"`. Add a `kind: 'cell' | 'markdown' | 'pdf'` field to the `ScopeInput` type so the UI can render a type badge.

Update the Scope caller of `useScopeData` to pass `nodes` (likely in `ScopeView.tsx` or `use-workspace-view-model.ts`).

Update `src/client/ui/components/ScopeInputsColumn.tsx` to render the new `kind` field as a small type badge alongside each input's label (`md`, `pdf`, or `cell`).

The Scope Inputs column is strictly synchronous — no async blob fetching. PDF text is available at execution time via the cascade; the Scope preview is intentionally metadata-only.

- **Done when**: opening Scope on a Code cell wired to (PdfNode "paper.pdf" + MarkdownNode "notes" + another cell "summary") shows three input rows with badges `pdf`, `md`, `cell`; the PDF row shows filename/pages/annotations; the markdown row shows content preview; the cell row shows cell output preview.

### t-type-lib-synthesizer: Pure transform builds .d.ts from incoming connections
> **Traces:** ac-monaco-inputs-type, ac-monaco-pdf-namespace
> **Status:** pending

Add a new pure transform at `src/kernel/transforms/synthesize-code-cell-type-lib.ts` exporting `synthesizeCodeCellTypeLib(cellId, cells, connections, nodes) => string`. The function walks the cell's incoming connections and builds a `.d.ts` source string containing:

1. Copies of `ResolvedMarkdownInput`, `ResolvedPdfInput`, `ResolvedDerivedInput` type aliases (verbatim from `resolved-input.ts`), plus the `PdfRegion` type they depend on.
2. An `inputs` global declaration: `declare const inputs: { [label: string]: <specific-type> }`, where each property's type is the specific `Resolved*Input` variant determined by the source kind of the connection that produced that label.
3. A `pdf` namespace declaration with all function signatures from `pdf-helpers.ts` (verbatim — the function bodies are not included, only signatures).

The function is pure — given the same graph inputs, produces the same string. No side effects, no async.

Add it to `src/kernel/transforms/index.ts` barrel exports.

Add a unit test in `src/kernel/transforms/__tests__/signal-field.test.ts` covering: (a) a cell with one PDF incoming produces a string containing `declare const inputs: {` and `ResolvedPdfInput`; (b) the `pdf` namespace appears in the output; (c) a cell with mixed markdown + cell inputs produces the correct per-label types.

- **Done when**: given a test cell wired to one PdfNode (labeled `paper`) and one Code cell (labeled `helper`), the synthesized output contains `paper: ResolvedPdfInput` and `helper: ResolvedDerivedInput`, and the full `pdf` namespace.

### t-wire-monaco-lib: ScopeCodeEditor injects synthesized type lib, refreshes on connection change
> **Traces:** ac-monaco-inputs-type, ac-monaco-pdf-namespace, ac-type-hints-refresh
> **Status:** pending

Update `src/client/ui/components/ScopeCodeEditor.tsx` to call `synthesizeCodeCellTypeLib(cellId, cells, connections, nodes)` and inject the result via Monaco's `monaco.languages.typescript.javascriptDefaults.addExtraLib(source, 'ts:cell-inputs.d.ts')`. Use a stable path like `ts:cell-inputs.d.ts` so re-injection replaces rather than duplicates.

Regenerate and re-inject whenever the cell's incoming connections change (add, remove, relabel, source replaced) — wire this via a `useEffect` whose dependencies include the incoming connections and the relevant source nodes/cells. On Scope close or cell change, remove the extra lib to avoid polluting other editors.

- **Done when**: (a) opening a Code cell's Scope with a PdfNode upstream shows full autocomplete for `inputs.paper.` including `pages`, `currentPage`, `annotations`; (b) chained calls like `pdf.pageRange(inputs.paper, 1, 5).map(p => p.text).` show string methods; (c) adding a new incoming connection (drag a MarkdownNode to the cell) while the Scope is open updates the Monaco IntelliSense to include the new label without reopening the Scope.

## Out of scope (explicit)

- **PDF support inside signal-field Source cells** — the shelved architectural question from `cell-parity-increment`. The whiteboard there is preserved for when the conversation resumes.
- **Sample-value hover** in Monaco. Hints are strictly structural. If the user wants to see actual values flowing through, they can trigger a cascade and inspect the Scope Output column.
- **Cell → legacy-node connections.** Only legacy → cell is enabled; reverse stays blocked.
- **Inference of Code cell return types** from the cell's code text. Every cell output remains `ResolvedDerivedInput` regardless of what the code returns. Rabbit hole.
- **Automatic cascade re-execution** when a legacy PdfNode's state changes. The cell becomes stale via `lastInputHash` but the user still triggers the cascade manually. Matches today's trigger model.
- **Type hints for AI cells.** AI cells have no code editor; only the concatenation bug fix applies.
- **Scope Inputs column showing PDF text asynchronously.** Metadata only in the preview; full text is available at execution time via the cascade.
