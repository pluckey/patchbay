---
feature: tabbed-workspace-management
center: "Allow the user to partition their context-composition work into distinct, persistent scopes so that each scope remains legible and none is lost when attention moves to another."
stage: requirements
intensity: standard
loop_iterations: 1
last_modified: 2026-04-05T00:00:00Z
---

## Acceptance Criteria

### ac-lossless-migration: Existing canvas becomes the first workspace without data loss
> **Center:** If existing work is lost or altered during the transition to multi-workspace, "none is lost" is violated before the feature begins — this is the trust prerequisite for all subsequent partitioning.

When the application is opened for the first time after multi-workspace support is introduced, the user's existing canvas — all nodes, connections, and viewport position — appears as a workspace in the sidepanel. No data is lost. No node positions shift. No connections break. The experience is indistinguishable from the prior single-workspace behavior except for the presence of the workspace sidepanel. The migrated workspace receives an auto-generated name.

### ac-workspace-identity: Each workspace has a unique stable identifier and a human-readable name
> **Center:** Distinct scopes require distinct identity — without a stable identifier, persistence and switching have no anchor; without a human name, scopes cannot be recognized in the sidepanel listing.

Every workspace possesses a globally unique identifier that is stable across sessions and application restarts. Each workspace has a human-readable name displayed in the sidepanel. New workspaces receive an automatically generated name that is distinguishable from other auto-generated names. Names are editable inline within the sidepanel — no modal dialog, no navigation away from the current view.

### ac-scope-isolation: Each workspace is an independent scope of nodes, connections, and viewport
> **Center:** "Distinct scopes" requires that work in one workspace does not appear in or interfere with another — this is the partitioning mechanism itself.

Each workspace contains its own set of nodes, connections, and viewport state. Adding, editing, moving, or deleting nodes in workspace A has no effect on the contents of workspace B. Switching away from a workspace and returning preserves all content exactly as it was, including node positions, connection topology, and viewport coordinates.

### ac-persistence-independence: Persistence failure in one workspace does not cascade to others
> **Center:** "None is lost when attention moves to another" requires that a failure affecting one scope does not silently destroy other scopes — failure isolation is what makes the "none is lost" promise credible across multiple workspaces.

All workspace state persists to durable storage. A workspace that fails to load or save surfaces an error scoped to that workspace alone. Other workspaces remain loadable, savable, and switchable. The application never enters a state where all workspaces are inaccessible due to a single workspace's data corruption.

### ac-sidepanel-listing: Workspaces are listed in a visible, collapsible sidepanel
> **Center:** The sidepanel is the mechanism by which the user maintains awareness of all partitioned scopes — without it, scopes become invisible and therefore functionally lost.

A sidepanel lists all workspaces by name. The sidepanel is visible by default. The sidepanel is collapsible to reclaim canvas space. When collapsed, the active workspace's name remains visible as a minimal indicator. The panel accommodates the realistic range of 2-15 workspaces without requiring scrolling for the common case.

### ac-active-workspace-unambiguous: The active workspace is always visually unambiguous (E)
> **Center:** Editing the wrong workspace silently corrupts a scope — unambiguous active-state indication is the information feedback that prevents cross-scope contamination.

At all times, the active workspace is visually distinguished in the sidepanel from all inactive workspaces. The active workspace's identity is visible in the canvas area. When the sidepanel is collapsed, the active workspace identity remains visible. A user glancing at the screen can identify the active workspace within one second.

### ac-instant-switch: Switching workspaces is perceptually instantaneous
> **Center:** Slow switching disrupts spatial memory and discourages partitioning — if moving between scopes is cognitively expensive, the user will avoid creating them, making the feature inert.

Clicking a workspace name in the sidepanel displays the target workspace's nodes and viewport within 200ms for workspaces containing up to 100 nodes. No blank canvas, loading spinner, or layout reflow is visible during the transition. (E) The transition feels continuous — the user does not perceive a "loading" intermediate state between the source and target workspace.

### ac-single-action-creation: Creating a new workspace requires exactly one action
> **Center:** If creation has friction, users will not partition their work, and the feature remains inert — low-friction creation is the mechanism that activates partitioning behavior.

A single user action from the sidepanel (one click or one keyboard shortcut) creates a new empty workspace with an auto-generated name and switches to it immediately. No modal, form, or wizard precedes creation. The previous workspace's state is fully preserved and accessible via the sidepanel.

### ac-workspace-deletion: Workspaces can be permanently removed with confirmation
> **Center:** Without an outflow mechanism, the workspace list grows without bound, eventually recreating the original legibility problem at the meta-level — deletion is the balancing force.

A workspace can be deleted via an explicit action in the sidepanel. A confirmation step names the workspace being deleted and warns that the action is permanent. Upon deletion, the workspace's data is removed from persistence, its entry disappears from the sidepanel, and the application switches to another workspace.

### ac-last-workspace-guard: The application always contains at least one workspace
> **Center:** A state with zero workspaces means zero scopes — the tool would have no canvas, violating both "legible" and "persistent" in the center statement.

When only one workspace exists, the delete action is unavailable or prevented. The user can never reach a state with zero workspaces.

### ac-global-identifier-uniqueness: All identifiers are globally unique across all workspaces
> **Center:** Global uniqueness ensures distinct scopes can coexist in a shared persistence layer without collision and preserves the structural precondition for cross-workspace features without requiring the feature itself.

Workspace IDs, node IDs, and connection IDs are unique across the entire application, not scoped to a single workspace. No operation — creation, migration, or any future operation — produces an identifier that collides with any existing identifier in any workspace.

## Scope

**IN** (building):
- Workspace entity: globally unique ID, human-readable name, nodes, connections, viewport
- Sidepanel listing all workspaces (flat list, visible by default, collapsible)
- Create workspace (single action, auto-named, immediate switch)
- Switch workspace (perceptually instant, full state restoration)
- Rename workspace (inline edit in sidepanel)
- Delete workspace (confirmation, permanent, last-workspace guard)
- Lossless automatic migration of existing single-workspace data
- Independent persistence per workspace with failure isolation
- Unambiguous active workspace indication

**OUT** (explicitly not building):
- Cross-workspace node references or linking
- Hierarchical nesting or folders in the sidepanel
- Workspace templates or pre-built scaffolding
- External agent targeting of specific workspaces
- Workspace sharing or collaboration features
- Search across workspaces
- Workspace duplication or cloning

**DEFERRED** (acknowledged for future consideration):
- Soft delete or undo for workspace deletion
- Manual reorder of workspaces in the sidepanel
- Hierarchical folder organization
- Cross-workspace node references (data model does not preclude this)
- Workspace-specific settings or per-workspace configuration
- External agent workspace targeting
- Workspace duplication

## Dependencies

- **Existing persistence layer**: StoragePort interface, server-side filesystem storage, merge-on-save logic, deletion manifest — must be evolved to support multiple workspace scopes, not replaced wholesale.
- **Existing identity system**: Node and connection IDs are already generated as UUIDs — this satisfies the global uniqueness requirement without change to existing data.
- **Existing viewport state management**: Per-workspace viewport must be stored and restored; the current single-viewport model must be extended.
- **Canvas layout**: The spatial canvas must accommodate the sidepanel without breaking existing node positioning or viewport calculations.

## User Scenarios

**Scenario 1 — First launch after update.** A user who has worked in a single canvas for weeks opens the application after the multi-workspace update. Their canvas looks identical: all nodes in place, all connections intact, viewport exactly where they left it. The only change is a sidepanel on the left showing one workspace entry with an auto-generated name, highlighted as active. The user continues working without interruption, migration step, or dialog. Later they notice the sidepanel, rename the workspace to "Research Notes," and carry on. *(Exercises: ac-lossless-migration, ac-sidepanel-listing, ac-active-workspace-unambiguous, ac-workspace-identity)*

**Scenario 2 — Starting a new thread of work.** A user is deep in a research workspace with 40+ nodes. A new task arrives. They click the "new workspace" action in the sidepanel. Instantly, a fresh empty canvas appears. An auto-generated name appears in the sidepanel, highlighted as active; the previous workspace is listed but visually inactive. They build out nodes for the new task. An hour later, they click the original workspace name. Within a fraction of a second, all 40+ nodes reappear exactly where they were, viewport position preserved. They copy an idea mentally, click back to the new workspace, and continue. At no point did they think about "managing" workspaces. *(Exercises: ac-single-action-creation, ac-scope-isolation, ac-instant-switch, ac-persistence-independence)*

**Scenario 3 — Cleaning up stale workspaces.** A user has accumulated 8 workspaces over several weeks. Three represent finished projects. They select a stale workspace and choose delete. A confirmation names the workspace and warns it is permanent. They confirm; the workspace vanishes from the sidepanel and the application switches to another workspace. They repeat for the other two stale entries. Down to 5 workspaces, the sidepanel is scannable again. On their final remaining workspace, the delete action is unavailable. *(Exercises: ac-workspace-deletion, ac-last-workspace-guard, ac-sidepanel-listing)*

**Scenario 4 — Renaming for clarity.** A user has four workspaces, all auto-named. They cannot recall what lives where. They click each workspace in turn to see its contents, then double-click its name in the sidepanel and type a meaningful label: "API Migration," "Blog Draft," "Agent Pipeline," "Scratch." Now the sidepanel is scannable and each scope is identifiable at a glance. The active workspace remains visually distinct throughout. *(Exercises: ac-workspace-identity, ac-instant-switch, ac-active-workspace-unambiguous)*
