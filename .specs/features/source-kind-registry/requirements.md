---
feature: source-kind-registry
center: "Each source kind self-contains the four things a downstream cell needs to consume it — library loading, parser from raw artifact to in-memory object, Monaco type-def fragment, and (optional) ingestion gesture — registered in a single place; the cell worker, the cell executor, the type-def generator, and the cascade contain ZERO source-kind-specific code; adding a new source kind is one new file plus one registry entry."
stage: requirements
intensity: focused
loop_iterations: 1
last_modified: 2026-04-06T00:00:00Z
prior_art: cell-parity-increment
---

> **Focused-intensity note.** This spec skips the whiteboard phase per the protocol's Focused intensity (`intent.md` → requirements only → execution). The whiteboard work was done in `.specs/features/cell-parity-increment/whiteboard.md` (three roundtable passes that established the four-surface decomposition, the trenchcoat test, and Option η with its "third acquisition mechanism" revisit trigger). This spec is the architectural follow-up the user explicitly asked for: graduating from "ad-hoc variant" to the registration framework Pass 3 deferred. The Mechanism phase is also skipped per Focused intensity; the **Design Notes** section at the end carries the design specificity that would normally live in `design.md`.

# Source Kind Registry — Requirements

## Center

> "Each source kind self-contains the four things a downstream cell needs to consume it — library loading, parser from raw artifact to in-memory object, Monaco type-def fragment, and (optional) ingestion gesture — registered in a single place; the cell worker, the cell executor, the type-def generator, and the cascade contain ZERO source-kind-specific code; adding a new source kind is one new file plus one registry entry."

UNCHANGED from the executor's proposal. The panel stress-tested the center across seven rounds and found it sound. The user's question ("can the source node just pass all the stuff the code node will need without the code having to do anything special / domain-specific?") is answered affirmatively if and only if this center holds.

## Center Test

- **Exclusion test**: A rich PDF inspection viewer in the canvas — page-by-page navigation, annotation rendering, search, thumbnails. Excellent feature, totally orthogonal. The center is about what *downstream cells* need to consume a source. Inspection is what *humans* need to inspect a source. Pass 2 of the prior whiteboard already named this as S3 (inspection affordance) where variation is *legitimate*. Out of this spec.
- **Boundary discrimination**: A near-miss is "add a `pdf.searchByText(query)` convenience helper because cell authors keep writing it themselves." Tempting and useful, but the user has explicitly rejected helper APIs as obfuscating the map-territory story. The boundary is sharp: contributions expose **real library objects**, not custom helpers. If `searchByText` is widely useful, it lives in a userland snippet library or a cell template, NOT in the source kind contribution.

## Acceptance Criteria

### ac-registry-locus: One file, one entry, one registry
> **Center:** Directly tests the center's "one new file plus one registry entry" clause. Falsifiable by counting modified files when adding a new kind: any number greater than two (the new file + the registry registration line) fails.

Adding a new source kind to the system requires creating exactly one new file describing the kind and adding exactly one entry to a single shared registry. No other file in the codebase is modified — not the cell worker, not the cell executor, not the type-def generator, not the cascade, not the Scope panel, not any consumer. The single shared registry is observable from both the worker context and the main thread context; there is not one registry for the worker and a separate one for the main thread.

### ac-zero-kind-code-in-consumers: Consumers contain no kind names
> **Center:** Directly tests the center's "ZERO source-kind-specific code" clause in the four named consumers. Falsifiable by static inspection.

The cell worker, the cell executor, the type-def generator, and the cascade contain no string literals, type names, imports, or branches keyed on a specific source kind identifier (such as `"pdf"`, `"markdown"`, `PdfInput`, `MarkdownInput`, or any kind-named symbol). They dispatch entirely through the registry. Polymorphism over a registry-derived shape is allowed; named or imported kind-specific identifiers are not.

### ac-real-library-objects: Cells receive the real library object
> **Center:** Operationalizes the user's non-negotiable "expose the pdf object provided by pdf.js" requirement, which the center honors via the parser contribution. Falsifiable by inspecting what the cell author binds to in code.

When a cell consumes a source of kind K, the variable available in user code IS the library-native in-memory object for K — not a wrapper, not a helper-decorated proxy, not an object with a `.raw` property exposing it. For PDF, the cell author writes `pdf.getPage(1)` against an actual pdf.js document. For markdown, the cell author writes against the actual markdown content as the kind defines it. No custom helper functions are added by the registry contribution to the shape the cell sees.

### ac-monaco-reflects-registry-only: Type hints come from the registry
> **Center:** Tests that the type-def generator (one of the four named consumers) is fully driven by the registry, with no kind-specific fallback path. Falsifiable by removing a kind from the registry and observing whether its type hints disappear.

When a cell is connected to a source of kind K, autocomplete and type hints in the cell editor reflect K's contributed type-def fragment. No type-def fragment is hardcoded outside the registry — there is no file anywhere in the codebase that contains a hardcoded `MarkdownInput` or `PdfInput` type-def string the editor would fall back to. Removing a kind's registration causes its type hints to vanish without leaving stale fragments behind.

### ac-multi-kind-monaco-composition: Mixed connections compose without collision
> **Center:** Tests an emergent property of the registry contract — that fragments from independent kinds compose by simple concatenation rather than requiring kind-aware merging logic. Falsifiable by wiring a cell with two different source kinds and inspecting editor behavior.

When a cell has incoming connections from two or more different source kinds simultaneously, the editor shows correct, distinct type hints for each kind's binding. Type-def fragments contributed by different kinds compose without collision when the kinds use distinct binding names. Two kinds attempting to claim the same binding name are detected and rejected at registration time, not silently overwriting one another.

### ac-worker-loads-its-own-libraries: Library loading lives in the worker
> **Center:** Tests the center's "library loading" contribution, sharpened by the user's UI-isolation concern. Falsifiable by inspecting where library code (e.g., pdf.js for cell execution) is fetched and instantiated.

Library code used by cell execution is loaded from inside the cell worker context, not on the main thread. The main thread does not fetch, parse, or initialize libraries on behalf of the worker for the purposes of cell execution. The UI thread remains responsive while a cell loads a library for the first time. The existing terminate-on-timeout safety net continues to apply to library loading just as it applies to user code execution. (Independent main-thread uses of the same library — for example, canvas-side preview rendering — are a separate concern and not affected by this AC.)

### ac-csv-dry-run: A third kind plugs in by registration alone
> **Center:** This is the open-closed proof. The center claims the registry makes adding a kind a one-file operation; this AC exercises that claim with a kind that does not exist today, ensuring the contract was actually designed for extension and not just for the two kinds we already had. Falsifiable by trying.

A test fixture registers a third source kind (CSV is the canonical example) by adding exactly one new contribution file and one registry registration line. No file under the cell worker, cell executor, type-def generator, or cascade is touched. With this contribution registered, a cell connected to a CSV source receives the parsed object as its binding, autocomplete in the cell editor reflects the CSV contribution's type-def fragment, and execution returns the parsed value. **(E)** The contribution file is short enough and obviously-shaped enough that a developer reading it for the first time can infer the contract from this single example without consulting documentation.

### ac-legacy-pdf-cells-untouched: Old workspaces keep working
> **Center:** Bounds the migration story so the center can be met without breaking user data. Falsifiable by opening a workspace authored before this spec.

Existing legacy Transform nodes that use `pdf.allText`, `pdf.pageRange`, `pdf.surrounding`, `pdf.pageCount`, `pdf.currentPageText`, and `pdf.annotationTexts` continue to execute and produce identical results to today, given the same pdf.js version. Users do not see error messages, broken cells, or missing data when opening workspaces authored before this spec.

### ac-cell-worker-has-only-the-registry: No back doors into the worker
> **Center:** Tests that the legacy compatibility (ac-legacy-pdf-cells-untouched) does not undermine the center by routing kind-specific code into the cell worker through a side channel. Falsifiable by static inspection of what the signal-field cell worker imports and contains.

The signal-field cell worker file does not contain hardcoded helper functions like `pdf.allText`. Legacy Transform helpers, if they remain in the codebase, live entirely in the legacy Transform execution path and not in the signal-field cell worker. The signal-field cell worker's only source of kind-specific behavior is the registry; no other module contributes kind-specific behavior to it.

### ac-unregistered-kind-fails-loudly: No silent kind misses
> **Center:** Closes the inversion Jacobi raised — what happens when the system encounters a kind the registry doesn't know about. Falsifiable by simulating a missing registration.

When the system encounters a source kind that is not present in the registry — whether because of a workspace authored on a system with an extra kind installed, or because of a programming error in registration order — the failure is loud, identifiable, and surfaces at the earliest possible point (workspace load or cell wiring), not silently inside a worker invocation. The error message names the missing kind. The system does not fall back to "unknown" rendering or silently drop the input.

### ac-single-pdf-code-path: Exactly one PDF code path exists in the codebase
> **Center:** Resolves Deming's two-implementations dissent and enforces "ZERO source-kind-specific code" globally — not just in the four named consumers, but everywhere in the codebase. After this AC passes, "how a cell consumes a PDF" has exactly one answer.

After validation of the registry-driven pipeline (passing all other ACs and a smoke test of the typical PDF-in-cell scenarios), the file containing the `pdf.*` helper functions no longer exists, the helper injection point in the cell worker is gone, and any in-the-wild legacy Transform nodes that referenced `pdf.allText`, `pdf.pageRange`, `pdf.surrounding`, `pdf.pageCount`, `pdf.currentPageText`, or `pdf.annotationTexts` have been rewritten to use the registry's pdf.js Document API. After this AC passes, a static grep of the entire codebase for any of those helper function names returns zero matches outside of historical commit messages. There is exactly one path for cell code to consume a PDF: through the registry.

## Scope

**IN (building this spec):**
- The kernel-side registry abstraction: types describing a contribution and a registration mechanism, with no framework dependencies.
- Two registered source kind contributions: markdown and pdf, contributing loaders, parsers, type-def fragments, and (where appropriate) gestures.
- Refactoring of the cell worker, cell executor, type-def generator, and cascade so they consume only the registry and contain no kind-specific code.
- A test-only third kind (CSV) registered to exercise the open-closed property.
- Documentation, in prose within the spec, of the new revisit trigger for this registry (when kind-specific code starts reappearing in the four consumers).
- The error path for unregistered kinds.
- **Final cleanup**: after the registry-driven pipeline is validated by all preceding ACs and a smoke test, the legacy `pdf.*` helper namespace goes away — the `pdf-helpers.ts` file is gone, helper-injection sites are gone, and any in-the-wild legacy Transform nodes that depend on those helpers are rewritten to use the registry's pdf.js Document API directly. (Promoted from DEFERRED on user request.)

**OUT (explicitly not — and why):**
- *Inspection affordances (canvas-side viewers) for any source kind* — orthogonal; lives in S3 territory per Pass 2 of the prior whiteboard, where variation is explicitly allowed.
- *New ingestion gestures beyond what markdown and pdf already support* — the gesture contribution slot exists in the contract, but expanding what gestures can do (drag-drop, paste, API-fetch, etc.) is not part of this spec. Pass 3's "third acquisition mechanism" trigger guards that question separately.
- *Any modification to the legacy Transform execution path or its helper functions* — frozen. They continue to work; they are not migrated.
- *Persistence of registry state in workspace JSON* — module-time registration is sufficient; workspaces store nodes, not kinds.
- *Shipping CSV (or any other third kind) as a real, user-facing feature* — the dry-run test exists to prove the contract; productionizing CSV is a deferred follow-up.
- *Migration of cells that currently call `pdf.allText` etc.* — those cells are legacy Transforms and remain on the legacy path. No automated rewriting, no shimming the helpers into the new worker.
- *Custom helper APIs of any kind in any registered contribution* — the user has explicitly rejected helpers; contributions expose real library objects only.

**DEFERRED (future, with reopening trigger):**
- *Real CSV, JSON, image, audio, or git-repo source kinds* — **trigger:** a user actually needs one and the registry contract is exercised against a real-world use case.
- *ESM-aware or nested-worker library loading* — **trigger:** a candidate kind requires a library that cannot load via the worker's current dynamic-import mechanism.
- *Workspace-level declaration of which kinds a workspace depends on* — **trigger:** cross-machine workspace sharing becomes a real use case and the receiving machine might not have all kinds registered.
- *Per-kind presentation hints (labels, icons, colors) beyond fallback to the kind name* — **trigger:** the Scope panel or another consumer needs richer per-kind visuals than the kind name string.

> *Amendment note: the previously-deferred entry "deletion of the legacy `pdf.*` helpers" has been promoted into the IN scope list above. The user explicitly fired the deferred trigger. Deming's monitoring concern is resolved by the new acceptance criterion and task introduced by this amendment.*

## Dependencies

- **`typed-cell-inputs`** (just landed in this session): the shared `resolveSourceContent` use case, the shared `hashCellInputs` kernel transform, validation that permits legacy nodes to feed signal-field cells, the `executeCascade` pre-resolution path that threads legacy nodes through cells, and the Scope inputs panel with per-kind previews. This spec assumes all of that is in place and refactors the kind-specific bits of it to consume the registry instead.
- The existing cell worker (`public/transform-worker.js`), including its 5-second terminate-on-timeout safety net, which must be preserved.
- The existing Monaco type-def injection mechanism (`buildInputTypeDefs` plus `addExtraLib`), which will be re-pointed at the registry instead of containing hardcoded fragments.
- pdf.js, including its `disableWorker: true` mode that allows it to run inside another Web Worker without nested-worker support.
- The blob storage adapter and the page-text cache by blobId from the same recent session.

## User Scenarios

**Scenario 1 — An existing PDF-in-cell workspace still works.**
A user opens a workspace they authored last week. It contains a PDF source feeding a Code cell that calls `await pdf.getPage(1).then(p => p.getTextContent())`. They open the cell. It executes. The cell receives the same pdf.js document object it received before this spec landed; the output is identical. Autocomplete in the cell editor still shows the pdf.js API. The user notices nothing changed about the cell experience. Internally, the worker is now loading pdf.js via the registry's contributed loader, the parser is the registry's contributed parser, and the type-def fragment is the registry's contributed string — but the user sees none of that. (Exercises ac-real-library-objects, ac-monaco-reflects-registry-only, ac-worker-loads-its-own-libraries.)

**Scenario 2 — A developer adds CSV in one file.**
A developer wants CSV support. They create one new file describing the CSV kind: how to load papaparse (or whichever CSV library) into the worker, how to parse a raw CSV string into an array of records, the TypeScript fragment that types the parsed array, and an ingestion gesture for picking a CSV file from disk. They add the new contribution to the single registry registration list. They reload the app. They drag a CSV file onto the canvas, it appears as a Source node, they wire it into a Code cell, they type `csv.` in the editor and Monaco autocompletes the array's properties and methods. Execution returns the parsed array. They have not modified the cell worker, the executor, the type-def generator, or the cascade. (Exercises ac-csv-dry-run, ac-registry-locus, ac-zero-kind-code-in-consumers.)

**Scenario 3 — A cell consumes both markdown and PDF.**
A user has a Code cell connected to one Markdown source and one PDF source. In the editor, typing `markdown.` shows markdown's API; typing `pdf.` shows pdf.js's document API. Both bindings are present in the editor's type context simultaneously, contributed by their respective registry entries. Execution receives both bindings under their respective names. The type-def generator concatenated the two fragments without knowing what either kind was. (Exercises ac-multi-kind-monaco-composition.)

**Scenario 4 — A frozen legacy Transform sits next to a fresh signal-field cell.**
A user has an old Transform node from before signal-field that calls `pdf.allText`. They double-click it; it runs and returns the same text it returned yesterday. Next to it on the canvas, a new signal-field Code cell connects to the same PDF source. In the new cell, the user types `pdf.` and the autocomplete does NOT show `allText` — it shows the actual pdf.js document API, because the registry's pdf contribution exposes the real document object and not the legacy helpers. The user understands from the autocomplete that the new path is different from the old path; the map matches the territory. The legacy node continues to work; the new cell uses the registry. (Exercises ac-legacy-pdf-cells-untouched, ac-cell-worker-has-only-the-registry.)

## Design Notes (Focused-intensity addendum)

These resolve the executor's design uncertainties D1–D8 with concrete answers. They are not ACs and are not separately tested, but they are the design decisions that the execution phase should not relitigate.

**D1 — Where does the registry live in Clean Architecture?**
The *registry abstraction* (the contribution shape as a type, the registry container, the registration function) lives in the **kernel** as pure types and a pure registration mechanism with zero framework dependencies. The *concrete contributions* (markdown contribution, pdf contribution) live in **client adapters** because they touch framework code (pdf.js, markdown libraries). A shared module — imported at startup by both the main thread and the cell worker — performs the registration calls, populating the kernel registry as a side effect. The four consumers (worker, executor, type-def generator, cascade) talk only to the kernel registry and never to specific contribution files. This preserves the Dependency Rule: kernel knows nothing about pdf.js; adapters depend on kernel; the worker and main thread both depend on adapters and kernel via the same registration module.

**D2 — Contribution shape.**
A contribution is plain data plus functions, answering exactly these questions:
- `kind`: a unique string identifier; also the discriminator on `ResolvedInput`.
- `bindingName`: the variable name the cell author writes (e.g., `pdf`, `markdown`, `csv`). Two contributions claiming the same binding name is a registration error.
- `loadLibrary`: an `async` function executed inside the cell worker context. It makes any library code available (e.g., `importScripts` for pdf.js) and may return a handle the parser uses, or void. Always async, even if the work is trivial — uniform contract beats sync/async branching. May be a no-op for kinds that need no library.
- `parse`: an `async` function from a kind-controlled raw artifact (the bytes, blob, or string the source produced) to the in-memory object the cell author will see bound to `bindingName`. The output type is whatever the kind chooses to expose.
- `typeDefFragment`: a string of TypeScript declaration text that types `bindingName`. Strings (not structured ASTs) because Monaco's `addExtraLib` consumes strings; the type-def generator is a concatenator, not a compiler.
- `gesture` (optional): a contribution to the canvas-side ingestion UI describing how a user creates a source of this kind directly (file picker config, drag-drop accept patterns, label). Absent for kinds that exist only via wiring.
- `presentation` (optional): a human-readable label and a glyph hint for places like the Scope inputs panel. Consumers that show kind labels read this from the registry if present and fall back to displaying the kind name verbatim if absent. No consumer ever contains a hardcoded kind→label map.

**D3 — Cell execution context.** *(Amended twice during execution. Final answer: main-thread cell execution.)*

**Attempt 1 (original plan)**: keep the existing classic worker, use `importScripts` to load libraries.
**Discovery during T4**: `pdfjs-dist` 5.x ships only ES modules — no classic-script build. `importScripts` cannot load it. → Switch to module worker.

**Attempt 2 (amendment)**: upgrade to module worker, use dynamic `await import()`.
**Discovery during execution validation**: pdf.js detects it's running inside a Web Worker and tries to spawn its own worker (a nested worker, since the cell worker is itself a worker). Nested worker creation fails in the Next.js dev module-worker context, so pdf.js falls back to its "fake worker" mode, which uses `importScripts` to load worker code into the same thread. **`importScripts` is not available in module workers** (it's a classic-worker-only API). The fake-worker fallback throws, the cell worker thread dies silently, the parent gets `worker.onerror` with no useful message. Verified empirically by tracing debug postMessages from inside the worker: execution dies between `parse: pdf (object)` and the next debug log, immediately after pdf.js logs `Setting up fake worker`.

**Final answer: cell execution runs on the main thread.** No worker. `cell-evaluator.ts` uses `new AsyncFunction` directly in the main-thread context. pdf.js loads via the existing main-thread import (the same one `pdf-renderer.ts` already uses for the canvas viewer), so cell code gets real pdf.js Document objects with zero wrapping. Trade-offs:

- **UI blocking**: a cell that does heavy synchronous CPU work (`for(let i=0; i<1e9; i++) { ... }`) WILL freeze the UI for the duration of that work. This is bounded by the cell's own complexity. pdf.js's own async operations (getPage, getTextContent) don't block because they use pdf.js's internal worker on the main thread.
- **Lost terminate-on-timeout safety net**: JavaScript can't be interrupted from outside its own execution. A runaway cell can't be killed; the user has to reload the tab. Mitigation: the existing 5s timeout becomes a *soft warning logged to console* rather than a hard kill. Cell authors should avoid sync CPU loops; the editor is theirs to manage.
- **Real pdf.js objects**: cell code calls `await input.paper.getPage(1)` on the actual pdf.js Document the canvas viewer uses. No wrapping, no helpers, exactly what the user asked for.

The previously-deferred "ESM-only future libraries" open question is resolved differently than amendment 2 anticipated: future libraries are loaded on the main thread via dynamic `import()`, not in the worker.

**D4 — Monaco multi-kind composition.**
The type-def generator iterates the source kinds present on a cell's incoming connections, asks each contribution for its `typeDefFragment`, and concatenates them into a single string passed to Monaco's `addExtraLib`. Kinds use distinct `bindingName`s so concatenation is safe; collisions are caught at registration time. The generator never sees a kind name and never branches on one — it sees only "for each kind on this cell, fetch a fragment, append."

**D5 — Migration of `pdf.*` helpers.** *(Amended: helper purge now in scope.)*
**Phase 1 (tasks 1–11)**: the legacy Transform execution path is frozen DURING the registry build. Existing helper functions continue to work for any in-the-wild legacy Transform nodes via the existing helper-injection point in the cell worker. The signal-field cell worker refactor (t-cell-worker-registry-driven) preserves this injection as a transitional measure: the worker becomes registry-driven for new cells AND keeps the helper namespace available for legacy Transform code. This is the only place in the codebase where two execution shapes coexist, and only for the duration of phase 1.

**Phase 2 (final task)**: after all phase-1 tasks pass and a smoke test confirms the registry-driven pipeline handles every PDF use case the legacy helpers handled (see the final task below), the helpers go away: the helper file no longer exists, the helper-injection point in the worker is gone, and any remaining in-the-wild legacy Transform nodes that referenced the helpers are rewritten to use the registry's pdf.js Document API directly. After phase 2, the worker has zero hardcoded helpers and the codebase has exactly one PDF code path. (Deming's dissent is resolved by this amendment; see Recorded Dissent below.)

**D6 — Persistence.**
Registry state is **not persisted** in workspace JSON. Module-time registration via the shared registration module is sufficient: when a workspace loads, the registry is already populated by import side effects. A node referencing a kind that isn't registered is a runtime/code error, not a data error, and is caught by the unregistered-kind error path (ac-unregistered-kind-fails-loudly).

**D7 — Pass 3's "third acquisition mechanism" revisit trigger.**
The Pass 3 trigger was about *acquisition mechanisms* (S2 — gestures: file pickers, paste, drag-drop, API-fetch). This spec is operationalizing *kinds* (S4 — the downstream value contract). They are adjacent but distinct. The Pass 3 trigger has not literally fired and remains in force, unchanged, for the gesture/S2 question. **This spec adds a new revisit trigger for the registry itself**: *when source-kind-specific code (string literals, named imports, type names matching specific kinds) starts to appear in any of the four consumers — cell worker, cell executor, type-def generator, or cascade — the registry contract is insufficient for what the system now needs and must be extended.* That is the concrete signal that the registry abstraction has rotted into a switch statement. Both triggers live in prose within their respective specs.

**D8 — Legacy Transform path.**
**Out of scope.** Legacy Transforms are not subject to the center. They run their existing code with their existing helpers in their existing path. The center applies to the signal-field cell pipeline (worker + executor + type-def generator + cascade) only. This boundary is explicit in the scope section.

## Open Questions

- **(D3 residue) ESM-only future libraries.** The classic-worker decision works today. The first kind that requires an ESM-only library will force a worker-type upgrade or some equivalent ESM injection mechanism. The panel chose not to block this spec on it but flags it as a known future revisit.
- **(D6 residue) Cross-machine workspace portability.** If a workspace authored on machine A references a kind not registered on machine B, this spec answers "fail loudly at load time, name the kind." Whether that UX is good enough for a future workspace-sharing feature — versus, say, embedding kind requirements in workspace metadata — is open and deferred.
- **(new — surfaced during deliberation) Presentation hint richness.** The contribution's `presentation` slot exposes a label and a glyph hint. If multiple downstream consumers later need different visual styles per kind (icon vs colored badge vs text), the slot may need to grow. Not a problem today; flagged in case it surfaces.

## Recorded Dissent

**Steve Jobs** dissents on including the new revisit trigger inside the Design Notes rather than as an AC.
> "I cut it because it's not behavior, and ACs should be behavior. I'm fine with Jacobi documenting it. Just keep it short. It's a sentence in a doc, not a process to follow. If we ever need to enforce it, that's a static analysis check, not a paragraph."

(Resolution: documented in Design Notes per Jobs' preference; Jacobi assented because the prior whiteboard's literal requirement was "in the spec in prose," which Design Notes satisfies.)

**W. Edwards Deming** dissents on the legacy migration story. *(Resolved by amendment.)*
> "Two implementations of 'how to parse a PDF' is a special cause. Frozen helpers in the legacy path and registry-driven parsing in the signal-field path means two answers to the same question coexist in this codebase. I accept the panel's resolution because Jobs is right that the helpers obfuscate the user-facing map-territory story and that shimming would extend the obfuscation. But I am on record: the day someone updates pdf.js to a new major version, the legacy helpers will break in a way the registry path will not, and we will be reminded that we kept two answers. Plan for that day."

**(Resolved on amendment.)** The user explicitly fired the trigger Deming was watching for. The helper purge is now in scope as the final-phase work introduced by this amendment, scheduled after all preceding ACs pass and smoke tests confirm the registry-driven pipeline handles every PDF use case the helpers handled. Deming's "two answers" concern is addressed: after phase 2, there is exactly one PDF code path.
