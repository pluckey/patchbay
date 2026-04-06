---
feature: source-kind-registry
center: "Each source kind self-contains the four things a downstream cell needs to consume it — library loading, parser from raw artifact to in-memory object, Monaco type-def fragment, and (optional) ingestion gesture — registered in a single place; the cell worker, the cell executor, the type-def generator, and the cascade contain ZERO source-kind-specific code; adding a new source kind is one new file plus one registry entry."
stage: tasks
intensity: focused
execution_mode: sequential
loop_iterations: 1
last_modified: 2026-04-06T00:00:00Z
---

# Source Kind Registry — Tasks

> **Focused-intensity note**: This task list is generated in the Intent phase (Focused skips Mechanism). Tasks are sequential — most depend on the previous step's output. The execution order matches the dependency order.

## Tasks

### t-kernel-registry: Define the registry abstraction in kernel
> **Center:** Establishes "registered in a single place" — without a kernel-side registry there is no single place for contributions to land.
> **Traces:** ac-registry-locus, ac-zero-kind-code-in-consumers
> **Status:** complete

Create the pure-types contribution shape and a small registry container in the kernel layer. The contribution type has fields `kind`, `bindingName`, `loadLibrary`, `parse`, `typeDefFragment`, optional `gesture`, optional `presentation` per Design Note D2. The registry container exposes `register(contribution)`, `get(kind)`, `list()`, and detects binding-name collisions at registration time. Zero framework dependencies; only kernel-internal types may be imported. Lives at `src/kernel/source-kinds/`.

- **Done when**: the kernel exports a `SourceKindRegistry` and a `SourceKindContribution` type; a unit test exercises `register` (success), `register` (binding-name collision rejection), `get` (hit), and `get` (miss).

### t-registration-module: Shared registration entrypoint
> **Center:** Establishes the "one new registry entry" half of the center — a single place every contribution is wired into, importable from both worker and main thread.
> **Traces:** ac-registry-locus
> **Status:** complete

Create a single client-side module that imports each contribution and calls `registry.register(...)` for each as a side effect on import. This is the file the main thread and the cell worker both import to populate the registry. Lives at `src/client/source-kinds/index.ts`. Initially empty (no contributions yet); subsequent tasks add the contributions and append registration lines here.

- **Done when**: the module exists, exports nothing, and is importable from both main thread and worker contexts. Importing it twice does not double-register (idempotent guard inside `register` or here).

### t-markdown-contribution: Markdown source kind
> **Center:** Concretely instantiates the "library loading + parser + type-def fragment + (optional) gesture" four-tuple for the simplest existing kind, proving the contract is sufficient for trivial cases.
> **Traces:** ac-real-library-objects, ac-monaco-reflects-registry-only
> **Status:** complete

Create the markdown contribution at `src/client/source-kinds/markdown-source-kind.ts`. `loadLibrary` is a no-op. `parse` takes the raw markdown text and returns whatever shape the kind chooses to expose to cells (the raw text string is acceptable; a richer object is also acceptable as long as it is the actual library-native type, not a wrapper). `typeDefFragment` is the TypeScript declaration string typing the binding name. `bindingName` is `markdown`. Append a `register(markdownContribution)` line to `src/client/source-kinds/index.ts`.

- **Done when**: a cell connected to a Markdown source receives the markdown content under `markdown` (the binding name), and Monaco autocomplete reflects the typeDefFragment when only this contribution is registered.

### t-pdf-contribution-worker-loaded: PDF source kind with pdf.js inside the worker
> **Center:** Operationalizes "library loading" for the non-trivial case (a real library that must run inside the worker to expose real objects to cell code), proving the contract handles the hard case.
> **Traces:** ac-real-library-objects, ac-worker-loads-its-own-libraries
> **Status:** complete

Create the PDF contribution at `src/client/source-kinds/pdf-source-kind.ts`. `loadLibrary` uses `importScripts` (inside the cell worker context) to load pdf.js with `disableWorker: true` so pdf.js parses inline in the cell worker. The function is async; it returns a handle the parser can use. `parse` takes blob bytes (transferred from main thread to worker) and returns the actual pdf.js Document object — no wrapping, no helper functions added. `typeDefFragment` declares the pdf.js Document type for Monaco (sufficient surface area for `getPage`, `numPages`, `getMetadata`, `destroy`, etc.). `bindingName` is `pdf`. Append `register(pdfContribution)` to `src/client/source-kinds/index.ts`.

- **Done when**: a cell connected to a PdfNode receives a real pdf.js Document under `pdf`; the cell author can call `await pdf.getPage(1).then(p => p.getTextContent())` and get back the actual pdf.js text content; pdf.js loads inside the worker (verifiable by checking that no main-thread fetch of `pdf.worker.min.mjs` happens for cell execution); the existing 5s terminate-on-timeout still kills runaway code.

### t-cell-worker-registry-driven: Refactor cell worker to consume registry only
> **Center:** Removes the first of four named consumers (the cell worker) from the kind-specific-code list — without this, the center's "ZERO source-kind-specific code" claim is false at the worker.
> **Traces:** ac-zero-kind-code-in-consumers, ac-cell-worker-has-only-the-registry
> **Status:** complete

Rewrite `public/transform-worker.js` so it imports the registration module (via `importScripts`), and on each cell execution: (a) reads the list of incoming source kinds from the message, (b) calls `registry.get(kind).loadLibrary()` for each (memoized per worker lifetime), (c) calls `registry.get(kind).parse(rawArtifact)` for each, (d) builds a bindings object keyed by `bindingName`, (e) executes the user code via `new AsyncFunction(...bindingNames, code)`. Remove ALL hardcoded `pdf.*` helper functions. Remove the `pdf` parameter to `AsyncFunction`. The worker file contains zero references to `"pdf"`, `"markdown"`, or any specific kind identifier.

- **Done when**: a static grep of `transform-worker.js` finds zero kind-name string literals; cell execution still works for both markdown and PDF inputs end-to-end via the registry path; the existing 5s timeout still terminates runaway code.

### t-cell-executor-registry-shaped-input: Update jsEvaluator to send raw artifacts
> **Center:** Removes the second of four named consumers (the cell executor) from the kind-specific-code list — required for the center's "ZERO" claim to hold across the executor.
> **Traces:** ac-zero-kind-code-in-consumers
> **Status:** complete

Update `src/client/adapters/execution/js-evaluator.ts` to package per-input as `{ kind, bindingName, rawArtifact }` (where `rawArtifact` is the bytes/string the kind's parser will consume) instead of pre-resolving and serializing per-kind shapes. Use `Transferable` to send blob bytes zero-copy where applicable. Drop `makeSerializable`'s kind-specific filtering. The executor knows nothing about pdf or markdown specifically; it just iterates whatever `Record<string, RawSourceArtifact>` the cascade hands it and forwards via postMessage.

- **Done when**: a static grep of `js-evaluator.ts` finds zero kind-name string literals; PDF and markdown inputs both reach the worker with their raw bytes/text intact; transferred bytes do not appear in the main thread after transfer (proven by ArrayBuffer.byteLength === 0 post-transfer).

### t-typedef-generator-registry-driven: Concatenate type-def fragments from registry
> **Center:** Removes the third of four named consumers (the type-def generator) from the kind-specific-code list and proves the contribution's `typeDefFragment` slot is sufficient for Monaco's needs.
> **Traces:** ac-monaco-reflects-registry-only, ac-multi-kind-monaco-composition
> **Status:** complete

Refactor `src/client/ui/components/transform-input-types.ts`. Delete the hardcoded `MARKDOWN_INTERFACE`, `PDF_INTERFACE`, `DERIVED_INTERFACE`, `PDF_HELPERS_INTERFACE` constants. `buildInputTypeDefs` becomes: iterate the legend, look up each entry's contribution in the registry, concatenate `typeDefFragment` strings, build the `declare const` lines using each contribution's `bindingName`. The file no longer mentions `pdf` or `markdown` or any kind name. A cell wired to two different kinds gets two type-def fragments concatenated correctly; the binding-name uniqueness invariant from t-kernel-registry guarantees no collisions.

- **Done when**: removing a kind's registration causes its hover/autocomplete in Monaco to disappear; wiring one cell to two distinct source kinds shows correct types for each in the editor; static grep of `transform-input-types.ts` finds zero kind-name string literals.

### t-cascade-and-resolve-registry-driven: Cascade pre-resolution via registry
> **Center:** Removes the fourth and final named consumer (the cascade) from the kind-specific-code list, completing the "ZERO source-kind-specific code" claim across all four consumers.
> **Traces:** ac-zero-kind-code-in-consumers, ac-real-library-objects
> **Status:** complete

Refactor `src/client/domain/use-cases/resolve-source-content.ts` and the legacy-pre-resolution loop in `src/client/domain/use-cases/execute-cascade.ts`. The cascade no longer branches on `sourceNode.type === "pdf"` or `"markdown"`. Instead, it asks the registry for the contribution matching each upstream node's kind, and uses the contribution's parser-input convention to package the raw artifact (e.g., a fetched blob for PDFs, the content string for markdown) into the form the worker expects. The pageTextCache from the prior session goes away — the new design ships raw bytes to the worker, and pdf.js inside the worker is responsible for any caching of parsed documents. The worker-side library/document cache replaces the main-thread page-text cache.

- **Done when**: static grep of `execute-cascade.ts` and `resolve-source-content.ts` finds zero kind-name string literals; existing PDF-in-cell workspaces still work (Scenario 1); the per-blob caching that made warm-cache fast still happens, but inside the worker (via pdf.js doc cache or contribution-internal cache).

### t-unregistered-kind-error: Loud failure for missing registrations
> **Center:** Closes Jacobi's inversion: the center is satisfied when the registry exists, but only if absent registrations fail loud rather than silently breaking the abstraction.
> **Traces:** ac-unregistered-kind-fails-loudly
> **Status:** complete

Add the loud-failure error path. When `registry.get(kind)` is called for a kind that isn't registered, throw with a message that names the missing kind. Surface this at the earliest possible point: on workspace load (when scanning nodes), and on cell wiring (when validating connections). Do not let an unregistered kind silently reach the worker — if it does, the worker also throws with the same named error rather than passing `undefined` to user code.

- **Done when**: a synthetic test that loads a workspace containing a node of an unregistered kind triggers a thrown error at load time with the kind name in the message; a cell that somehow receives an unregistered-kind input fails with the same shape of error rather than an unhelpful runtime error inside user code.

### t-csv-dry-run-test: Third-kind contribution as test fixture
> **Center:** Empirically proves the center's "adding a new source kind is one new file plus one registry entry" clause by exercising it on a kind that did not exist when the contract was designed.
> **Traces:** ac-csv-dry-run, ac-registry-locus
> **Status:** complete

Add a test fixture that registers a third source kind (CSV) as proof of the open-closed property. The fixture lives in a test file (or under `src/client/source-kinds/__tests__/`) and:
1. Defines a CSV contribution: `loadLibrary` does `importScripts` for a small CSV parser (papaparse or a hand-rolled minimal parser is acceptable; this is a dry-run, not a productionized kind), `parse` returns the parsed array, `typeDefFragment` types it.
2. Registers the contribution.
3. Asserts that with the contribution registered, a fixture cell wired to a CSV-typed source receives the parsed array as `csv`, the type-def generator emits the CSV fragment, and the cascade resolves the source via the registry.
4. The test asserts that NO file under `public/transform-worker.js`, `src/client/adapters/execution/js-evaluator.ts`, `src/client/ui/components/transform-input-types.ts`, or `src/client/domain/use-cases/execute-cascade.ts` was modified by adding CSV — i.e., the diff is exactly two files: the new contribution file + one line in the registration module.

- **Done when**: the test passes. **(E)** A code reviewer reading the CSV contribution file alone (without docs) can identify the contribution contract from this single example.

### t-legacy-transforms-preserved: Verify legacy Transform path still works during migration
> **Center:** Validates that the registry refactor in tasks 1–10 has not broken the helper-injection point that legacy Transform nodes rely on, so the codebase has no broken legacy users at the moment phase 2 begins.
> **Traces:** ac-legacy-pdf-cells-untouched
> **Status:** complete

After tasks 1–10 land, smoke-test that any in-the-wild legacy Transform node calling `pdf.allText(input.input)` (or any other helper) against a PdfNode source still executes and returns the same text it returned before this spec landed. The phase-1 worker refactor (t-cell-worker-registry-driven) is required to keep the helper-injection point operational as a transitional measure: the worker becomes registry-driven for new cells AND continues to expose the legacy `pdf` global to legacy Transform code. This task is verification, not modification — it confirms the transitional coexistence is intact and unblocks phase 2.

- **Done when**: a manual smoke test confirms a legacy Transform node with `return pdf.allText(input.input)` produces identical output before and after this spec's phase 1; the helper-injection point in the worker is still functional; the verification result is captured in writing so phase 2 has a clear "go" signal.

### t-helper-purge: Phase 2 — purge the legacy helpers and migrate any in-the-wild Transforms
> **Center:** Closes Deming's two-implementations dissent and enforces the center's "ZERO source-kind-specific code" claim across the entire codebase, not just the four named consumers. After this task, "how a cell consumes a PDF" has exactly one answer.
> **Traces:** ac-single-pdf-code-path
> **Status:** complete

Final task. Runs only after the preceding verification task confirms phase 1 is intact. Steps in order:

1. **Validate the registry-driven pipeline.** Run the full test suite + manual smoke tests covering: (a) a signal-field Code cell wired to a PdfNode using the registry path produces correct output for `pdf.getPage`, `pdf.numPages`, and `pdf.getMetadata` calls; (b) a signal-field Code cell wired to a MarkdownNode produces correct output; (c) the CSV dry-run from the third-kind test passes. Document the validation results in writing.
2. **Inventory in-the-wild legacy Transforms.** Scan all active workspaces (including any persisted `.context-canvas/workspaces/*.json` files) for legacy Transform nodes whose `transformCode` references any of the helper names. Report the count.
3. **Rewrite each in-the-wild Transform** identified in step 2 to use the registry's pdf.js Document API directly. Example: `return pdf.allText(input.paper)` becomes the equivalent loop over `await input.paper.getPage(n).then(p => p.getTextContent())` for each page. Verify each rewritten cell produces equivalent output to the original.
4. **Get rid of `src/kernel/transforms/pdf-helpers.ts`** and any imports of it.
5. **Strip the legacy helper-injection point** from `public/transform-worker.js`. After this step the worker has zero hardcoded `pdf.*` helper functions. The `new AsyncFunction` call no longer accepts a `pdf` parameter.
6. **Static grep verification**: search the entire codebase for any of the helper function names. Expected match count: zero (excluding historical commit messages and this spec file).
7. **Final smoke test**: re-run the full test suite + the validation checks from step 1 to confirm nothing has regressed.

- **Done when**: the helper file no longer exists; the worker contains no hardcoded helper functions; static grep returns zero matches for any helper name in the live codebase; all in-the-wild legacy Transforms have been rewritten and produce equivalent output to before; the test suite is green; one final smoke test confirms a legacy Transform that was rewritten still works as expected.
