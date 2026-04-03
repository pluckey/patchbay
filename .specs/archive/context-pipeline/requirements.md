---
feature: context-pipeline
center: "This feature makes the user's context-construction process — what they select, transform, and compose from source material for AI — into a visible, spatial, experimentable object."
stage: requirements
intensity: deep
loop_iterations: 1
last_modified: 2026-04-02T00:00:00Z
---

# Requirements: Context Pipeline

## Acceptance Criteria

### ac-spatial-connection: User can create directed connections between nodes via direct spatial interaction
> **Center:** Connections make the *structure* of context construction visible — without them, the canvas is a collection of isolated documents with no depicted relationships.

Given two nodes on the canvas, the user can initiate a directed connection from one to the other through direct spatial interaction (e.g., dragging). The resulting connection has a clear visual direction indicating data flow from source to destination. No menus, dialogs, or keyboard shortcuts are required for the basic connection action.

### ac-transform-visible: Every data-transforming connection exposes its logic on the canvas
> **Center:** If the transform is hidden, the construction process is still opaque — visibility of *how* data changes between nodes is what distinguishes this from the hidden pipeline it replaces.

When a connection transforms data, the transformation logic is visible and editable directly on the canvas without navigating to a separate view, modal, or panel. The user can read the transform definition and understand what it will do to the source data.

### ac-live-output: Output content updates automatically when source data or transform logic changes
> **Center:** Live update closes the feedback loop between transform definition and output — without it, the user must manually re-run transforms, breaking the direct manipulation that makes spatial construction faster than editing code.

When the user modifies a transform's logic, the connected output node's content updates without manual refresh, re-run, or save action. When source content changes, all downstream outputs recompute. The user perceives the update as immediate (no perceptible delay for typical content sizes).

### ac-output-derives-from-source: Output content is verifiably derived from source data through the defined transform
> **Center:** Verifies that data actually flows through connections rather than connections being merely decorative lines — the pipeline must be real, not theatrical.

Given a source node with known content and a transform with defined logic, the output node contains content that is the demonstrable result of applying that transform to that source. The output is empty or in error state when the transform cannot be applied — never populated with unrelated content.

### ac-transform-error-visibility: Failed transforms display actionable diagnostic information
> **Center:** Making failure visible is inseparable from making the process visible — a pipeline that hides errors is still a hidden pipeline.

When a transform cannot produce output (invalid logic, incompatible source data, empty result), the output node displays a visually distinct error state. The error identifies which transform failed and communicates the category of failure in terms the user can act on. "An error occurred" without specifics does not satisfy this criterion.

### ac-multiple-transforms-per-source: One source node supports multiple independent outgoing connections
> **Center:** Multiple transforms from a single source make the *branching structure* of context construction visible — the user sees alternative extractions simultaneously, enabling spatial comparison.

A single source node can have two or more outgoing connections, each with its own independent transform logic, producing independent output nodes. Modifying one transform does not affect the others. The user can visually compare multiple outputs derived from the same source.

### ac-connection-removal: User can remove a connection and downstream nodes indicate disconnected state
> **Center:** Deletion makes the construction process experimentable — the user can try structures, discard them, and try alternatives without penalty.

The user can select and remove any connection. Upon removal, the previously-connected output node remains on the canvas and visually indicates that it is no longer receiving data. The output node retains its last computed content (not blanked) but is clearly marked as stale/disconnected.

### ac-source-removal-cascade: Removing a source node cleanly removes its outgoing connections
> **Center:** The spatial workspace must remain coherent under modification — orphaned connections pointing at nothing would make the construction process *less* visible than before.

When a source node is taken off the canvas, all connections originating from it are cleaned up automatically. Downstream output nodes remain on the canvas and display their disconnected state (per ac-connection-removal). No dangling visual artifacts remain.

### ac-graph-persistence: The complete pipeline graph survives page reload with no data loss
> **Center:** A construction process that vanishes on reload is not a persistent, experimentable object — it is a disposable sketch the user cannot build on across sessions.

All nodes, their positions, all connections, all transform definitions, and all output content are persisted. After a full page reload or browser restart, the canvas is restored to its prior state with no user action required. No data is silently dropped.

### ac-source-type-agnostic: Connections and transforms function identically regardless of source node type
> **Center:** The construction process is about *structure* (what connects to what, how it transforms) not about source format — source-specific behavior would fragment the spatial model into disconnected format-specific silos.

A user can create connections from any node type that exposes content (text, document, etc.) using the same interaction. The transform mechanism operates on the source data uniformly. No connection or transform behavior is available for one source type but not another.

### ac-self-describing-pipeline: A populated pipeline visually communicates its data flow without interaction **(E)**
> **Center:** "Visible" means the spatial arrangement itself communicates the construction process — not that the process merely exists somewhere on screen for the user to discover through clicking.

A person unfamiliar with a specific canvas, shown a screenshot of a populated pipeline, can correctly describe: what the source material is, that a transformation is being applied, and what the output contains. The visual design of nodes, connections, and transforms communicates direction, relationship, and role without requiring hover, click, or tooltip interaction.

### ac-first-pipeline-speed: A new user can build their first working pipeline within 2 minutes **(E)**
> **Center:** If the process of *constructing* the context pipeline is itself opaque and slow, the feature has replaced one hidden process with a visible but impractical one.

A user with no prior experience with this feature, given a canvas with an existing source node, can create a connection, define a transform, and see output content appear — all within 2 minutes. This includes any learning or discovery time.

### ac-transform-disposability: Creating, evaluating, and discarding a transform is faster than manual extraction **(E)**
> **Center:** Experimentability requires low cost of failure — if trying a transform is expensive relative to the alternative, users will not experiment, and the spatial medium loses its advantage over the script it replaces.

A user can create a new transform, observe its output, decide it is not useful, and discard it (removing the connection) in less time than it would take to manually copy-paste the equivalent content from the source. The interaction cost of a failed experiment is near zero.

### ac-incoherent-flow-prevention: The system prevents data flow configurations that would produce undefined behavior
> **Center:** A visible construction process must be a *coherent* one — displaying a broken structure without indicating it is broken undermines the user's trust in what they see.

The system does not allow configurations that would produce undefined results (e.g., circular dependencies in v1, an output with no source connection claiming to have transformed content). When a user attempts an incoherent configuration, the system either prevents it or clearly communicates why the configuration is invalid.

## Scope

**IN** (building in this increment):
- Directed connections between existing canvas nodes
- One transform mechanism that satisfies all ACs above (mechanism to be determined during design)
- Live output nodes that display transformed content
- Visible, editable transform definitions on the canvas
- Error states for failed transforms
- Connection and node deletion with coherent cascade behavior
- Persistence of the full graph (nodes, edges, transforms, output content)
- Source-type-agnostic connection model

**OUT** (explicitly not building):
- Composing multiple outputs into a single prompt or artifact
- AI-powered / nondeterministic transforms
- Multiple transform modes (v1 ships one; the *which one* decision is deferred to design)
- Cycle/recursion support in the data flow graph
- Version history of transforms or outputs
- Import/export of pipeline definitions
- Collaborative or multi-user features

**DEFERRED** (future increments, architecturally protected):
- Additional transform modes (template, JS evaluator, or others — v1's source-agnostic model must not preclude these)
- Nondeterministic (AI-invoked) transform node type
- Multi-output composition into a prompt artifact
- Cycle support for iterative refinement flows
- Storage migration beyond localStorage (the persistence AC does not prescribe storage mechanism)

## Dependencies

- **Source text extraction from document nodes.** PDF nodes must expose their textual content for transforms to operate on. The existing PDF renderer provides search but not text extraction — this must be added before pipeline connections to PDF nodes can satisfy ac-output-derives-from-source.
- **Canvas edge support.** The canvas must support creating and rendering directed edges between nodes. The existing canvas infrastructure supports nodes but the edge interaction layer must be present.
- **Persistence infrastructure extended to edges.** The existing storage adapter persists nodes. It must be extended to persist edges, transform definitions, and computed output content within the existing storage envelope.

## User Scenarios

**Scenario 1: Extract a key passage from a document**
A user has a PDF node on their canvas containing a 40-page research paper. They drag a connection from the PDF node and a new output node appears. They define a transform targeting pages 12–15. The output node populates with the text from those pages *(ac-spatial-connection, ac-output-derives-from-source)*. They read the output, realize they need pages 12–18 instead, edit the transform in place *(ac-transform-visible)*, and the output updates immediately with the expanded range *(ac-live-output)*. They now have a reusable, visible extraction they can revisit tomorrow after closing their browser *(ac-graph-persistence)*.

**Scenario 2: Compare two extractions from the same source**
A user has a lengthy markdown node with meeting notes. They create two connections to two separate output nodes — one transform extracts action items by filtering for lines containing "ACTION," another extracts decisions by filtering for "DECIDED" *(ac-multiple-transforms-per-source)*. Both outputs appear on the canvas simultaneously. The user spatially positions them side by side. They see the action-items transform missed some items, edit it to broaden the filter *(ac-transform-visible)*, and that output updates while the decisions output remains unchanged *(ac-live-output)*. A colleague glancing at the canvas can see two extractions flowing from one source without clicking anything *(ac-self-describing-pipeline)*.

**Scenario 3: Recover from a failed experiment**
A user creates a connection and writes a transform with a syntax error. The output node shows an error state explaining the transform logic is invalid and pointing to the specific problem *(ac-transform-error-visibility)*. They fix the error and the output populates correctly *(ac-live-output)*. Later, they decide this extraction isn't useful after all. They delete the connection in under 5 seconds *(ac-transform-disposability)*. The output node remains on canvas showing it is disconnected *(ac-connection-removal)*. They delete the output node. The source is unaffected. Total cost of the failed experiment: under 30 seconds.

**Scenario 4: Resume a multi-pipeline workspace**
Over a 20-minute session, a user builds a workspace with two source nodes (a PDF and a markdown note), four transforms, and four output nodes arranged spatially to represent different aspects of their research. They close the browser tab. The next day, they reopen the application. Every node is in its original position, every connection is drawn, every transform definition is intact, and every output shows its last computed content *(ac-graph-persistence)*. They pick up exactly where they left off, adding a fifth transform from the PDF source to explore a new angle *(ac-multiple-transforms-per-source)*.
