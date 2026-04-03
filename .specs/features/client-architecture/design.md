---
feature: client-architecture
center: "Client and server are distinct applications with independent Clean Architecture boundaries, sharing a kernel of pure entity types and port-free transforms."
stage: design
intensity: focused
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

# Design: Client Architecture

## System Decomposition

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|---------------|---------------|
| da-01 | kernel/entities | Directory | Create | All entity types: WorkspaceNode, Connection, Position, Dimensions, Viewport, Workspace, TransformResult | ac-kernel-framework-freedom, ac-kernel-port-freedom |
| da-02 | kernel/transforms | Directory | Create | All 13 pure use cases: createNode, moveNode, removeNode, updateNodeContent, resizeNode, navigatePdfPage, createPdfNode, createTransformNode, createConnection, removeConnection, removeNodeConnections, validateConnection, validatePdfUpload | ac-kernel-completeness, ac-kernel-port-freedom |
| da-03 | kernel barrel exports | File | Create | `kernel/entities/index.ts`, `kernel/transforms/index.ts`, `kernel/index.ts` | ac-kernel-completeness, ac-no-cross-boundary-imports |
| da-04 | client/domain/ports | Directory | Create | Move StoragePort, BlobStoragePort, PdfRendererPort, TransformExecutorPort from domain/ports/ | ac-client-boundary |
| da-05 | client/domain/use-cases | Directory | Create | Move loadWorkspace, saveWorkspace; promote uploadPdf, removeNodeWithCleanup, executePipeline from adapters/orchestration/ | ac-client-boundary |
| da-06 | client/adapters/storage | Directory | Move | localStorageAdapter, indexedDbBlobAdapter | ac-client-boundary |
| da-07 | client/adapters/canvas | Directory | Move | flow-node-mapper.ts; move use-canvas-binding.ts from hooks/ to here | ac-xyflow-containment, ac-client-boundary |
| da-08 | client/adapters/pdf | Directory | Move | pdf-renderer.ts | ac-client-boundary |
| da-09 | client/adapters/execution | Directory | Move | js-evaluator.ts | ac-client-boundary |
| da-10 | client/ui/hooks | Directory | Move | useWorkspace, usePipelineExecution, usePdfViewer | ac-client-boundary |
| da-11 | client/ui/components | Directory | Move | All component .tsx files + ui/ subdirectory | ac-client-boundary |
| da-12 | client/lib | Directory | Move | utils.ts | ac-client-boundary |
| da-13 | AdaptersContext | File | Create | React Context providing concrete adapters; useAdapters hook; AdaptersProvider component in `client/ui/app/adapters-context.ts` | ac-single-composition-root, ac-hooks-no-concrete-adapters |
| da-14 | CanvasProvider | File | Create | Thin wrapper around ReactFlowProvider in `client/ui/components/CanvasProvider.tsx` | ac-xyflow-containment |
| da-15 | useWorkspacePersistence | File | Create | Extracted from useWorkspace: load, save, debounce, beforeunload flush | ac-god-hook-decomposed |
| da-16 | usePdfOperations | File | Create | Extracted from useWorkspace: uploadPdf, navigatePage | ac-god-hook-decomposed |
| da-17 | useWorkspace decomposed | File | Modify | Composes useWorkspacePersistence + usePdfOperations; node CRUD + connection CRUD remain | ac-god-hook-decomposed |
| da-18 | Import rewrites | Edit | Modify | All consumers updated from `@/domain/` to `@/kernel/` or `@/client/` | ac-no-cross-boundary-imports |
| da-19 | DI in hooks | Edit | Modify | Remove concrete adapter imports from hooks; use AdaptersContext | ac-hooks-no-concrete-adapters |
| da-20 | DI in PdfContent | Edit | Modify | Remove concrete adapter imports; receive via props from parent | ac-hooks-no-concrete-adapters |
| da-21 | components.json | Edit | Modify | Update alias paths to `@/client/...` | ac-behavioral-equivalence |
| da-22 | CLAUDE.md | Edit | Modify | Update architecture documentation to kernel/ + client/ | ac-claude-md-updated |
| da-23 | Dead code deletion | Delete | Delete | `src/adapters/content/content-resolver.ts` | -- |
| da-24 | Old directory cleanup | Delete | Delete | Empty `src/domain/`, `src/adapters/`, `src/components/`, `src/hooks/`, `src/lib/` | ac-client-boundary |

## Relationship Map

```
kernel/entities  <--  kernel/transforms
      ^                      ^
      |                      |
client/domain/ports    client/domain/use-cases
      ^                (imports kernel + ports)
      |
client/adapters   (implements ports)
      ^
      |
client/ui/hooks   (receives adapters via context)
      ^
      |
client/ui/components  (receives data via props)
      ^
      |
src/app/          (composition root: AdaptersProvider + CanvasProvider)
```

All dependencies point inward. xyflow contained to `client/adapters/canvas/` + `client/ui/components/`.

## Behavior Plan

| Behavior | Current Path | New Path | Risk |
|----------|-------------|----------|------|
| Node CRUD | hook imports createNode from domain/ | hook imports createNode from kernel/ | None (import path only) |
| Persistence load | hook imports localStorageAdapter directly | hook gets storage from AdaptersContext | Medium (DI introduction) |
| Persistence save | scheduleSave captures concrete adapter | captures adapter from context | Medium (ref stability) |
| beforeunload flush | calls saveWorkspace(localStorageAdapter) | calls saveWorkspace(storage from context) | Low (adapter is stable singleton) |
| PDF upload | hook calls uploadPdf with concrete adapters inline | adapters from context | Low (already takes ports as args) |
| PDF rendering | PdfContent imports concrete adapters | receives via props | Medium (component interface change) |
| Pipeline execution | WorkspaceView creates deps inline | deps from AdaptersContext | Low (already structured as injection) |
| Canvas binding | use-canvas-binding in hooks/ imports @xyflow | same file in client/adapters/canvas/ | None (file move) |

## Data Plan

**tsconfig.json:** No changes needed. Existing `@/*` -> `./src/*` resolves `@/kernel/` and `@/client/` naturally.

**components.json:** Update after migration:
```json
{
  "aliases": {
    "components": "@/client/ui/components",
    "utils": "@/client/lib/utils",
    "ui": "@/client/ui/components/ui",
    "lib": "@/client/lib",
    "hooks": "@/client/ui/hooks"
  }
}
```

**Barrel exports:** kernel/entities/index.ts, kernel/transforms/index.ts, kernel/index.ts. NO barrels for client/ui/components/ (conflicts with 'use client' in Next.js App Router).

**`src/app/` stays at `src/app/`.** Next.js App Router requires this location. It serves as the composition root.

## Verification Strategy

| AC | Method | When |
|----|--------|------|
| ac-kernel-port-freedom | `grep -r "Port" src/kernel/` returns zero | After Phase 1 |
| ac-kernel-framework-freedom | `grep -rE "from.*(react\|@xyflow\|next)" src/kernel/` returns zero | After Phase 1 |
| ac-kernel-completeness | All 13 pure transforms in kernel/transforms/index.ts | After Phase 1 |
| ac-client-boundary | `ls src/client/` shows domain/, adapters/, ui/ | After Phase 4 |
| ac-no-cross-boundary-imports | `grep -r "from.*client" src/kernel/` returns zero | After Phase 4 |
| ac-hooks-no-concrete-adapters | `grep -r "from.*adapters/" src/client/ui/hooks/` returns zero | After Phase 5 |
| ac-single-composition-root | adapters-context.ts exists, layout.tsx wraps in AdaptersProvider | After Phase 5 |
| ac-xyflow-containment | `grep -r "@xyflow" src/` only in client/adapters/canvas/ and client/ui/components/ | After Phase 4 |
| ac-god-hook-decomposed | useWorkspace composes sub-hooks, no file exceeds ~100 lines | After Phase 5 |
| ac-claude-md-updated | CLAUDE.md paths match `ls -R src/` | After Phase 6 |
| ac-behavioral-equivalence | `tsc --noEmit` + `npm run build` + manual smoke test | Every phase |

## Known Tech Debt

**HTMLCanvasElement in PdfRendererPort:** `renderPage()` returns `Promise<HTMLCanvasElement>`. A port interface with a DOM type in its signature. Pragmatically harmless (only runs in browsers), but violates strict Clean Architecture within the client domain layer. Documented, not fixed in this refactor.
