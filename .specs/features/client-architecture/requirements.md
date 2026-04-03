---
feature: client-architecture
center: "Client and server are distinct applications with independent Clean Architecture boundaries, sharing a kernel of pure entity types and port-free transforms."
stage: requirements
intensity: focused
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

# Requirements: Client Architecture

## Acceptance Criteria

### ac-kernel-port-freedom: Kernel contains zero port dependencies
> **Center:** The kernel's shareability depends on having no infrastructure contracts — if any file imports a port, the kernel drags application-specific needs with it.

No file under `src/kernel/` imports any type ending in `Port` or any module from a `ports/` directory. Every function in `kernel/transforms/` has a pure signature: data in, data out, no port-typed parameters.

### ac-kernel-framework-freedom: Kernel imports no framework modules
> **Center:** A kernel that imports React, Next.js, xyflow, or any runtime framework cannot be consumed by either application independently.

No file under `src/kernel/` contains an import from `react`, `next`, `@xyflow`, or any other framework package. Only pure TypeScript and pure npm utilities (e.g., `nanoid`) are permitted.

### ac-kernel-completeness: Every pure transform lives in the kernel
> **Center:** If a pure function remains stranded in `client/domain/`, the kernel is incomplete and the port-freedom boundary is drawn inconsistently.

Every current use-case function whose signature takes no port parameter has been migrated to `kernel/transforms/`: `createNode`, `moveNode`, `removeNode`, `updateNodeContent`, `resizeNode`, `navigatePdfPage`, `createPdfNode`, `createTransformNode`, `createConnection`, `removeConnection`, `removeNodeConnections`, `validateConnection`, `validatePdfUpload`. Port-dependent use cases (`loadWorkspace`, `saveWorkspace`) and orchestrations (`uploadPdf`, `removeNodeWithCleanup`, `executePipeline`) remain in `client/domain/use-cases/`.

### ac-client-boundary: Client application has its own root with domain, adapters, and UI
> **Center:** The client being its own application means it has a physically separated directory with its own domain, adapter, and UI layers.

`src/client/` exists and contains `domain/` (use-cases, ports), `adapters/` (storage, canvas, pdf, execution, orchestration), and `ui/` (hooks, components, app). No application source files remain directly under `src/` outside of `kernel/` and `client/`.

### ac-no-cross-boundary-imports: Kernel does not import from client
> **Center:** The dependency rule in concrete form — the kernel is consumed by applications, never the reverse.

No file in `src/kernel/` imports any module from `src/client/`. Files in `src/client/` import from `src/kernel/` only through barrel exports.

### ac-hooks-no-concrete-adapters: No hook imports a concrete adapter
> **Center:** Dependency inversion at the UI boundary — hooks receive port implementations via arguments or React Context, making them testable and adapter-swappable.

No file under `src/client/ui/hooks/` contains an import from `src/client/adapters/` or references a concrete adapter by name (`localStorageAdapter`, `indexedDbBlobAdapter`, `pdfRenderer`, `jsEvaluator`). Hooks receive port implementations via function arguments or React Context.

### ac-single-composition-root: Exactly one file wires adapters to ports
> **Center:** The composition root is the single point where concrete adapters are bound to abstract ports — one place to update when an adapter changes.

Exactly one file imports concrete adapters and provides them to the application. That file lives under `src/client/ui/app/`. It creates or provides concrete adapter instances that hooks consume through ports.

### ac-xyflow-containment: xyflow imports bounded to adapter and component layers
> **Center:** Framework containment makes the canvas library swappable — xyflow types stay within the client's adapter and component boundaries.

`@xyflow/react` is imported only in files under `src/client/adapters/canvas/` and `src/client/ui/components/`. No other file in the codebase imports from `@xyflow`. Node components (MarkdownNode, PdfNode, TransformNode) and NodeShell are allowed xyflow imports as they ARE xyflow components.

### ac-god-hook-decomposed: useWorkspace is replaced by focused hooks
> **Center:** Dependency inversion naturally decomposes the monolith — a hook receiving ports via context cannot also be a 260-line monolith spanning 5+ responsibilities.

No single hook file exceeds approximately 100 lines. Each hook addresses at most two related concerns. The responsibilities currently in `useWorkspace` (node CRUD, connection CRUD, persistence, PDF upload, transform code editing) are distributed across focused hooks.

### ac-claude-md-updated: CLAUDE.md reflects the post-refactor architecture
> **Center:** CLAUDE.md is the architectural enforcement mechanism for AI-assisted development — if it describes the old structure, it actively misleads the next session.

The directory tree, dependency rules, import constraints, and "When adding a new feature" table in CLAUDE.md accurately describe the post-refactor `kernel/` + `client/` structure. All path references and containment rules are documented.

### ac-behavioral-equivalence: Zero user-visible behavior change
> **Center:** This is a structural refactor, not a feature — any behavioral regression means the refactor broke something rather than reorganized it.

The application, after all structural changes, passes this verification: (1) cold start with existing localStorage data renders correctly, (2) node create/edit/move/resize/delete all work, (3) PDF upload and page navigation work, (4) connections and pipeline transforms work, (5) all state persists across page reload, (6) beforeunload flush saves unsaved changes.

## Scope

**IN:**
- Kernel extraction (entities + pure transforms)
- Client application boundary (directory restructure)
- Dependency inversion in hooks (ports via context or arguments)
- Single composition root
- xyflow containment (bounded to adapter + component layers)
- God Hook decomposition
- CLAUDE.md update
- tsconfig path alias updates

**OUT:**
- `server/` directory structure — created when the first server-side feature needs it
- ESLint import restriction rules — separate workstream
- Automated test suite — separate workstream
- TypeScript project references — separate from structural refactor

**DEFERRED:**
- `server/` application boundary — when first server feature arrives
- Automated enforcement via lint rules — next iteration after refactor lands
- Unit tests for kernel transforms — next iteration

## Dependencies

- tsconfig.json `@/` path alias must be updated for new directory structure
- All import paths rewritten to new locations
- `components.json` (shadcn config) path references updated

## User Scenarios

**Scenario 1: Verify architectural boundaries**
Run: `grep -r "@xyflow" src/` — results only in `client/adapters/canvas/` and `client/ui/components/`. Run: `grep -r "from.*adapters/" src/client/ui/hooks/` — zero results. Run: `grep -r "Port" src/kernel/` — zero results. Run: `grep -r "from.*client/" src/kernel/` — zero results.

**Scenario 2: Developer adds a new ImageNode type**
Define `ImageNodeData` in `kernel/entities/`. Add `createImageNode` in `kernel/transforms/`. Image upload (needs BlobStoragePort) goes in `client/domain/use-cases/`. Component in `client/ui/components/`. Wire upload through composition root. Zero ambiguity at each step.

**Scenario 3: Behavioral regression check**
Open the app → create markdown node → edit content → upload PDF → navigate pages → drag nodes → resize → create connections → create pipeline → write transform → reload page → everything persists and works identically to pre-refactor.
