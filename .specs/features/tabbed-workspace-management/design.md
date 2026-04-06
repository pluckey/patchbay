---
feature: tabbed-workspace-management
center: "Allow the user to partition their context-composition work into distinct, persistent scopes so that each scope remains legible and none is lost when attention moves to another."
stage: design
intensity: standard
loop_iterations: 1
last_modified: 2026-04-05T00:00:00Z
---

## System Decomposition

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|----------------|---------------|
| da-1 | Workspace entity | kernel/entity | Extend | Add `id: string`, `name: string` to existing type. `DEFAULT_WORKSPACE` becomes a factory taking `id`. | ac-workspace-identity, ac-scope-isolation |
| da-2 | WorkspaceRef entity | kernel/entity | Create | `{ id: string, name: string, createdAt: number, updatedAt: number }`. Lightweight reference — no nodes/connections. | ac-sidepanel-listing, ac-workspace-identity |
| da-3 | createWorkspaceRef transform | kernel/transform | Create | Pure factory: `(id, name) => WorkspaceRef`. ID generation is caller's responsibility. | ac-workspace-identity, ac-single-action-creation |
| da-4 | WorkspaceRegistryPort | client/domain/port | Create | `list(), getActiveId(), setActiveId(id), create(name), remove(id), rename(id, name)`. Six methods, no generics. | ac-sidepanel-listing, ac-single-action-creation, ac-workspace-deletion, ac-last-workspace-guard |
| da-5 | switchWorkspace use case | client/domain/use-case | Create | Flush current workspace (synchronous localStorage write), call `registry.setActiveId(targetId)`. Returns new Workspace for the caller to load. | ac-instant-switch |
| da-6 | createWorkspace use case | client/domain/use-case | Create | Generate nanoid, auto-name ("Workspace N"), call `registry.create(name)`, switch to new workspace. | ac-single-action-creation, ac-workspace-identity |
| da-7 | deleteWorkspace use case | client/domain/use-case | Create | Guard: `if list.length <= 1, reject`. Confirm, call `registry.remove(id)`. If deleting active, switch to first remaining. | ac-workspace-deletion, ac-last-workspace-guard |
| da-8 | renameWorkspace use case | client/domain/use-case | Create | Call `registry.rename(id, name)`. Propagate name into workspace envelope on next save. | ac-workspace-identity |
| da-9 | createScopedServerStorageAdapter | client/adapter | Create | Factory: `(workspaceId: string) => StoragePort`. Hits `/api/workspaces/{id}`. localStorage cache keyed `context-canvas:workspace:{id}`. **StoragePort interface unchanged.** | ac-scope-isolation, ac-persistence-independence |
| da-10 | serverRegistryAdapter | client/adapter | Create | Implements `WorkspaceRegistryPort`. Hits `GET/POST/DELETE /api/workspaces`. Caches `activeId` in `localStorage`. | ac-sidepanel-listing, ac-single-action-creation, ac-workspace-deletion |
| da-11 | scopedDeletionManifest | client/adapter | Extend | Manifest key becomes workspace-scoped: `context-canvas:…:{workspaceId}`. Factory pattern matching da-9. | ac-scope-isolation |
| da-12 | storageEnvelope v10 | client/adapter | Extend | Migration step: add `id` and `name` fields. `CURRENT_VERSION` bumps to 10. Self-describing envelope. | ac-lossless-migration |
| da-13 | fs-manifest-store | server/storage | Create | `readManifest()`, `writeManifest()`, `withManifestLock()`. File: `.context-canvas/manifest.json`. | ac-sidepanel-listing, ac-persistence-independence |
| da-14 | fs-workspace-store (parameterized) | server/storage | Extend | `readWorkspace(id)`, `writeWorkspace(id, json)`. Path: `.context-canvas/workspaces/{id}.json`. Existing lock scoped per workspace. | ac-scope-isolation, ac-persistence-independence |
| da-15 | server migration | server/storage | Create | Lazy: on first `GET /api/workspaces`, if no manifest but `workspace.json` exists, migrate to `workspaces/{id}.json` + `manifest.json`. Original file preserved as backup. | ac-lossless-migration |
| da-16 | API routes | app/api | Create + Extend | `GET /api/workspaces` (list + lazy migrate), `POST /api/workspaces` (create), `DELETE /api/workspaces/[id]`, `GET/PUT /api/workspaces/[id]` (content), `POST /api/workspaces/[id]/merge`. Old `/api/workspace` preserved as redirect. | ac-sidepanel-listing, ac-single-action-creation, ac-workspace-deletion, ac-scope-isolation |
| da-17 | useWorkspaceManager hook | client/ui/hook | Create | Consumes `WorkspaceRegistryPort` via `useAdapters()`. Exposes `{ workspaces, activeId, switchTo, create, remove, rename }`. | ac-sidepanel-listing, ac-instant-switch, ac-single-action-creation, ac-workspace-deletion |
| da-18 | WorkspaceManagerProvider | client/ui/app | Create | Holds `activeId` state. Creates scoped adapters (da-9, da-11). Provides them via `AdaptersProvider` keyed on `activeId`. Full subtree remount on switch. | ac-instant-switch, ac-active-workspace-unambiguous, ac-scope-isolation |
| da-19 | WorkspaceSidepanel | client/ui/component | Create | Collapsible panel. Flat list of workspaces. Active highlighted. Inline name editing. Create/delete actions. Receives data + callbacks via props. | ac-sidepanel-listing, ac-active-workspace-unambiguous, ac-single-action-creation, ac-workspace-deletion |
| da-20 | Composition root update | app | Extend | Wire `WorkspaceManagerProvider` above `AdaptersProvider`. Remove old migration logic. Key subtree on `activeId`. | ac-lossless-migration, ac-instant-switch |

## Relationship Map

```
KERNEL (innermost, depends on nothing)
  da-1 Workspace {id, name, nodes[], connections[], viewport}
  da-2 WorkspaceRef {id, name, createdAt, updatedAt}
  da-3 createWorkspaceRef(id, name) → WorkspaceRef
       ↑ imported by all outer layers

CLIENT DOMAIN (depends on kernel only)
  da-4 WorkspaceRegistryPort ──references──→ da-2 WorkspaceRef
  StoragePort (UNCHANGED) ──references──→ da-1 Workspace
  da-5 switchWorkspace ──uses──→ da-4 WorkspaceRegistryPort
  da-6 createWorkspace ──uses──→ da-4 WorkspaceRegistryPort, da-3 createWorkspaceRef
  da-7 deleteWorkspace ──uses──→ da-4 WorkspaceRegistryPort
  da-8 renameWorkspace ──uses──→ da-4 WorkspaceRegistryPort

CLIENT ADAPTERS (depends on domain ports + frameworks)
  da-9  createScopedServerStorageAdapter ──implements──→ StoragePort
  da-10 serverRegistryAdapter ──implements──→ da-4 WorkspaceRegistryPort
  da-11 scopedDeletionManifest ──parameterized by──→ workspaceId from da-18
  da-12 storageEnvelope v10 ──serializes──→ da-1 Workspace (with id, name)

CLIENT UI (depends on hooks via DI, never on adapters directly)
  da-17 useWorkspaceManager ──consumes──→ da-4 (via useAdapters)
       ──calls──→ da-5, da-6, da-7, da-8
  da-18 WorkspaceManagerProvider ──creates──→ da-9 (scoped storage)
       ──creates──→ da-11 (scoped deletion manifest)
       ──wraps──→ AdaptersProvider (keyed on activeId)
  da-19 WorkspaceSidepanel ──receives props from──→ da-17
       ──renders──→ da-2 WorkspaceRef[]

SERVER (depends on kernel only, never on client)
  da-13 fs-manifest-store ──reads/writes──→ .context-canvas/manifest.json
  da-14 fs-workspace-store ──reads/writes──→ .context-canvas/workspaces/{id}.json
  da-15 server migration ──uses──→ da-13, da-14, existing workspace.json
  da-16 API routes ──uses──→ da-13, da-14, da-15, merge-workspace (unchanged)

COMPOSITION ROOT (outermost)
  da-20 page.tsx ──wires──→ da-18 → da-10 → AdaptersProvider(da-9, da-11) → WorkspaceView
```

Key invariant: **No arrow points inward-to-outward.** All dependencies point toward the kernel.

## Behavior Plan

| Behavior | Description | Traces to |
|----------|-------------|-----------|
| Auto-migration on first load | `GET /api/workspaces` checks for `manifest.json`. If absent but `workspace.json` exists, server migrates: reads workspace.json, generates nanoid + "Workspace 1", writes `workspaces/{id}.json` + `manifest.json`. Original file preserved. | ac-lossless-migration (da-15) |
| Auto-name generation | `createWorkspace` generates name "Workspace N" where N = `workspaces.length + 1`. User can immediately inline-edit. | ac-single-action-creation (da-6) |
| Flush-before-switch | Before changing `activeId`, the current workspace flushes synchronously to localStorage (same `beforeunload` path). Debounce timer is cancelled. Polling stops. Then `activeId` changes, triggering full subtree remount. | ac-instant-switch (da-5, da-18) |
| Full remount on switch | `AdaptersProvider` is keyed on `activeId`. Changing the key unmounts the entire subtree (xyflow canvas, all hooks, all timers) and remounts with fresh scoped adapters. No stale state possible. | ac-instant-switch, ac-scope-isolation (da-18) |
| Last-workspace guard | `deleteWorkspace` checks `workspaces.length <= 1` before proceeding. If only one workspace remains, the delete action is disabled in the UI and rejected in the use case. | ac-last-workspace-guard (da-7) |
| Active workspace indicator | Sidepanel highlights the active workspace via a distinct visual treatment (indicator color, bold name). The `activeId` is always known from the `WorkspaceManagerProvider` state. | ac-active-workspace-unambiguous (da-19) |
| Confirmation on delete | Workspace deletion shows a confirmation dialog naming the workspace. If deleting the active workspace, after deletion the first remaining workspace becomes active. | ac-workspace-deletion (da-7, da-19) |
| Scoped polling | External node polling (2s interval) runs only for the active workspace. Inactive workspaces are not polled. External writes to them are visible only when the user switches. | ac-scope-isolation (da-9) |
| Scoped merge manifest | Merge-tracking manifest key is workspace-scoped. Cleared on workspace teardown. No cross-workspace leakage. | ac-scope-isolation (da-11) |

## UI Plan

**Layout change**: A collapsible sidepanel on the left edge of the viewport. When collapsed, shows a narrow rail with toggle button and active workspace name. When expanded, shows the workspace list.

**Sidepanel contents** (da-19):
- Header: "Workspaces" label + collapse toggle
- Create button: single action, creates + auto-names + switches (ac-single-action-creation)
- Flat list of workspace entries, each showing:
  - Name (inline-editable on double-click)
  - Active indicator (highlighted with `bg-indicator` / `text-indicator-foreground`)
  - Click to switch
  - Delete action (with confirmation dialog)
- Active workspace has visually distinct treatment (ac-active-workspace-unambiguous)

**What does NOT change**: Canvas layout, Toolbar, all node components, all node interactions, `WorkspaceView` component, all keyboard shortcuts and drag behaviors.

**Sidepanel interaction with canvas**: Sidepanel is positioned outside xyflow canvas bounds. Canvas width adjusts when sidepanel expands/collapses. Sidepanel state (expanded/collapsed) persisted in localStorage separately from workspace data.

## Data Plan

**New server file layout**:
```
.context-canvas/
  manifest.json                ← NEW: { workspaces: WorkspaceRef[], activeId: string }
  workspace.json               ← PRESERVED (read-only after migration, safety net)
  workspaces/                  ← NEW directory
    {id1}.json                 ← StorageEnvelope v10
    {id2}.json
  blobs/                       ← UNCHANGED, global
```

**StorageEnvelope v10** (extends v9):
```typescript
type StorageEnvelope = {
  version: 10
  id: string        // workspace ID (nanoid)
  name: string      // workspace name
  nodes: WorkspaceNode[]
  connections: Connection[]
  viewport: Viewport
}
```

**localStorage key changes**:
| Current key | New key | Purpose |
|-------------|---------|---------|
| `context-canvas:workspace` | `context-canvas:workspace:{id}` | Write-through cache for active workspace |
| `context-canvas:deletedIds` | `context-canvas:deletedIds:{id}` | Scoped deletion manifest |
| (none) | `context-canvas:activeWorkspaceId` | Fast startup: know which workspace to load before server responds |

**API route changes**:
| Method | Current | New | Purpose |
|--------|---------|-----|---------|
| GET | `/api/workspace` | `/api/workspaces` | List all workspaces (returns manifest). Triggers lazy migration. |
| POST | — | `/api/workspaces` | Create new workspace. Body: `{ name }`. Returns `WorkspaceRef`. |
| DELETE | — | `/api/workspaces/[id]` | Delete workspace. Removes file + manifest entry. |
| PATCH | — | `/api/workspaces/[id]` | Rename workspace. Body: `{ name }`. Updates manifest + envelope. |
| GET | `/api/workspace` | `/api/workspaces/[id]` | Load workspace content. |
| PUT | `/api/workspace` | `/api/workspaces/[id]` | Save workspace content (with merge-on-save). |
| POST | `/api/workspace/merge` | `/api/workspaces/[id]/merge` | External agent merge endpoint. |

## Verification Strategy

| AC | Verification Method |
|----|---------------------|
| ac-lossless-migration | Integration test: seed `workspace.json` with known nodes. Hit `GET /api/workspaces`. Verify manifest contains one workspace with all original nodes, connections, viewport intact. Verify original file preserved. |
| ac-workspace-identity | Unit test: `createWorkspaceRef` produces valid structure. Integration test: create 3 workspaces, verify distinct IDs. UI test: inline rename persists after reload. |
| ac-scope-isolation | Integration test: create two workspaces, add nodes to A, switch to B, verify B has zero nodes, switch back to A, verify A intact. Unit test: scoped adapter hits correct API path. |
| ac-persistence-independence | Integration test: corrupt one workspace file. Verify other workspaces load correctly. Verify corrupted workspace returns graceful error. |
| ac-sidepanel-listing | UI test: create 15 workspaces, verify all visible. Collapse sidepanel, verify canvas full-width. Expand, verify list reappears. |
| ac-active-workspace-unambiguous | Visual test: verify active workspace has distinct treatment in sidepanel. Switch workspace, verify indicator moves. |
| ac-instant-switch | Performance test: create workspace with 100 nodes. Switch away and back. Assert < 200ms. Assert no intermediate loading state. |
| ac-single-action-creation | UI test: click create, verify new workspace appears, is active, has auto-name, canvas is empty. One action only. |
| ac-workspace-deletion | UI test: delete workspace, verify confirmation dialog, verify removal from list and disk. If active, verify switch to another. |
| ac-last-workspace-guard | Unit test: `deleteWorkspace` rejects when length === 1. UI test: verify delete action disabled with one workspace. |
| ac-global-identifier-uniqueness | Unit test: verify all ID generators use nanoid. Integration test: create nodes in two workspaces, verify zero ID collisions. |
