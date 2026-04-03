---
feature: client-architecture
center: "Client and server are distinct applications with independent Clean Architecture boundaries, sharing a kernel of pure entity types and port-free transforms."
stage: tasks
intensity: focused
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

# Tasks: Client Architecture

## Phase 0 — Cleanup

### t-delete-dead-code: Remove content-resolver.ts and empty directory | delete
> **Center:** Dead code in the kernel or client violates boundary clarity — remove before restructuring
> **Traces:** ac-behavioral-equivalence
> **Depends:** (none)
> **Status:** complete

- **Implements**: da-23
- **Done when**: `src/adapters/content/` does not exist. `tsc --noEmit` and `npm run build` pass.

## Phase 1 — Kernel Extraction

### t-extract-kernel: Move entities and 13 pure transforms into src/kernel/ | move + rewrite imports
> **Center:** Establishes the shared kernel — the innermost layer with zero port imports, zero framework imports, genuinely shareable by any application
> **Traces:** ac-kernel-port-freedom, ac-kernel-framework-freedom, ac-kernel-completeness, ac-no-cross-boundary-imports
> **Depends:** t-delete-dead-code
> **Status:** complete

- **Implements**: da-01, da-02, da-03
- **Done when**:
  - `src/kernel/entities/` contains workspace-node.ts, workspace.ts, connection.ts, index.ts
  - `src/kernel/transforms/` contains 13 pure use case files + index.ts barrel
  - `src/kernel/index.ts` barrel exports all entities and transforms
  - PdfOutlineItem moved to kernel entities (currently in pdf-renderer-port.ts)
  - Old `src/domain/entities/` and pure use case files in `src/domain/use-cases/` cleaned up
  - All consumer imports updated from `@/domain/entities` to `@/kernel`
  - `grep -r "from.*@/domain/entities" src/` returns zero results
  - No imports of React, Next.js, @xyflow, or any port inside src/kernel/
  - `tsc --noEmit` and `npm run build` pass

## Phase 2 — Client Domain

### t-create-client-domain: Move ports and port-dependent use cases into src/client/domain/ | move + rewrite imports
> **Center:** Establishes the client's inner ring — port interfaces it depends on and use cases that coordinate those ports, distinct from the shared kernel
> **Traces:** ac-client-boundary, ac-no-cross-boundary-imports
> **Depends:** t-extract-kernel
> **Status:** complete

- **Implements**: da-04, da-05
- **Done when**:
  - `src/client/domain/ports/` contains all 4 port files
  - `src/client/domain/use-cases/` contains loadWorkspace, saveWorkspace, uploadPdf, removeNodeWithCleanup, executePipeline
  - All consumer imports updated from `@/domain/ports/*` to `@/client/domain/ports/*`
  - All consumer imports updated from `@/adapters/orchestration/*` to `@/client/domain/use-cases/*`
  - `src/domain/` directory fully cleaned up
  - `src/adapters/orchestration/` directory fully cleaned up
  - `grep -r "@/domain/" src/` returns zero results
  - Client domain never imports from client adapters
  - `tsc --noEmit` and `npm run build` pass

## Phase 3 — DI Infrastructure

### t-create-adapters-context: Create AdaptersContext, CanvasProvider, wire into composition root | create + modify
> **Center:** Introduces dependency injection infrastructure — the composition root becomes the single place that knows about concrete adapter types
> **Traces:** ac-single-composition-root
> **Depends:** t-create-client-domain
> **Status:** complete

- **Implements**: da-13, da-14
- **Done when**:
  - `src/client/ui/app/adapters-context.ts` exists with Adapters type, AdaptersContext, AdaptersProvider, useAdapters hook
  - `src/client/ui/components/CanvasProvider.tsx` exists wrapping ReactFlowProvider
  - `src/app/page.tsx` wraps content with AdaptersProvider (outer) and CanvasProvider (inner)
  - Provider ordering: AdaptersProvider wraps CanvasProvider
  - No existing consumers changed yet — additive only
  - `tsc --noEmit` and `npm run build` pass
  - Smoke test: app loads and renders

## Phase 4 — Adapter Migration

### t-move-adapters: Move adapter directories into src/client/adapters/, relocate use-canvas-binding | move + rewrite imports
> **Center:** Completes the client adapter layer — adapters implement port interfaces defined in client/domain/, xyflow is contained to its designated files
> **Traces:** ac-xyflow-containment, ac-client-boundary
> **Depends:** t-create-adapters-context
> **Status:** complete

- **Implements**: da-06, da-07, da-08, da-09
- **Done when**:
  - `src/client/adapters/storage/` contains local-storage-adapter.ts, indexeddb-blob-adapter.ts
  - `src/client/adapters/canvas/` contains flow-node-mapper.ts, use-canvas-binding.ts
  - `src/client/adapters/pdf/` contains pdf-renderer.ts
  - `src/client/adapters/execution/` contains js-evaluator.ts
  - `src/adapters/` directory fully cleaned up
  - use-canvas-binding.ts moved from hooks/ to client/adapters/canvas/
  - `grep -r "@/adapters/" src/` returns zero results
  - `tsc --noEmit` and `npm run build` pass

## Phase 5 — UI Layer + DI Migration

### t-move-ui-layer: Move hooks and components to src/client/ui/, switch to useAdapters() | move + DI + rewrite imports
> **Center:** Completes the outer ring — hooks consume ports via DI context instead of importing concrete adapters, components receive data via props
> **Traces:** ac-hooks-no-concrete-adapters, ac-single-composition-root, ac-client-boundary, ac-behavioral-equivalence
> **Depends:** t-move-adapters
> **Status:** complete

- **Implements**: da-10, da-11, da-12, da-18, da-19, da-20, da-21
- **Done when**:
  - `src/client/ui/hooks/` contains use-workspace.ts, use-pipeline-execution.ts, use-pdf-viewer.ts
  - `src/client/ui/components/` contains all 15 component files
  - `src/client/lib/` contains utils.ts
  - `src/hooks/` and `src/components/` and `src/lib/` fully cleaned up
  - Hooks use `useAdapters()` — no direct adapter imports in any hook
  - PdfContent uses `useAdapters()` — no direct adapter imports
  - Concrete adapter imports appear ONLY in page.tsx and adapters-context.ts
  - `components.json` updated with new alias paths
  - `grep -r "@/hooks/" src/` returns zero results
  - `grep -r "@/components/" src/` returns zero results
  - `tsc --noEmit` and `npm run build` pass
  - Smoke test: full behavioral verification

## Phase 6 — Hook Decomposition + Documentation

### t-decompose-god-hook: Split useWorkspace into focused hooks, update CLAUDE.md | extract + create + document
> **Center:** The god hook violated Single Responsibility — decomposition makes each concern independently changeable. CLAUDE.md update ensures the next session follows the new architecture.
> **Traces:** ac-god-hook-decomposed, ac-claude-md-updated, ac-behavioral-equivalence
> **Depends:** t-move-ui-layer
> **Status:** complete

- **Implements**: da-15, da-16, da-17, da-22, da-24
- **Done when**:
  - `src/client/ui/hooks/use-workspace-persistence.ts` exists: owns state, load, save, debounce, beforeunload
  - `src/client/ui/hooks/use-pdf-operations.ts` exists: owns handleUploadPdf
  - `use-workspace.ts` is a slim coordinator composing the above, same public API
  - No consumer of useWorkspace needs to change
  - No single hook file exceeds ~100 lines
  - All old empty directories under src/ cleaned up (only kernel/, client/, app/ remain)
  - CLAUDE.md updated: new directory tree, updated dependency rules, updated containment rules, updated "When adding a new feature" table
  - `tsc --noEmit` and `npm run build` pass
  - Full smoke test: create/edit/move/resize/delete nodes, PDF upload/navigation, pipeline transforms, persistence across reload, beforeunload flush
