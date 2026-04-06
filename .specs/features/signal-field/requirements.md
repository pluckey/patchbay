---
feature: signal-field
center: "This feature shifts the user's primary activity from configuring individual components to composing connections between them, and from prescribing behavior to observing emergence."
stage: requirements
intensity: deep
loop_iterations: 2
last_modified: 2026-04-05T21:30:00Z
---

## Panel

**Donella Meadows** — systems dynamicist, author of *Thinking in Systems*. Diagnosed the composition feedback loop as the system's critical leverage point: compose → observe Mix → recompose must be the FASTEST loop, dominating the slower configuration loop.

**W. Edwards Deming** — statistician, quality theorist. Demanded operational definitions: how do we KNOW the primary activity has shifted? Resolved mode-switch transition semantics. Flagged fan-in key stability under rename.

**Steve Jobs** — product architect. Identified The Mix as the product's true center ("The Mix IS the product; everything else is infrastructure"). Insisted The Mix be visible during composition, not hidden behind a toggle.

**Valentino Braitenberg** — synthetic psychologist, vehicles framework. Evaluated each AC by asking "what behavior does this produce when composed with other ACs?" Identified canvas-to-Mix feedback loop as the emergent behavior that IS the center. Flagged fan-in keyed inputs as classification activity competing with the center.

**John Gall** — systemanticist, Gall's Law. Split Phase 1 into 1a/1b. Identified minimum viable subset of ACs. Flagged ac-cycles-permitted as a discontinuity requiring cycle-aware engine from Phase 1.

**Carl Gustav Jacob Jacobi** — The Inverter. Inverted every AC. Found The Scope is the center's natural enemy. Found the spec enables but cannot guarantee the activity shift. Identified four composition mechanisms where the whiteboard claimed one.

## Panel Deliberation Summary

### The Scope as the Center's Natural Enemy (Jacobi)

Jacobi's strongest finding: every AC that improves component configuration (The Scope, output preview, health indication) also makes configuration more attractive. No AC creates pull *back* to the canvas. The Scope is the richest interaction surface, yet the center says composition is primary. Resolution: The Scope must emphasize topological context (navigable inputs, visual weight on I/O regions) to create pull back to the canvas.

### The Mix Must Be Visible During Composition (Jobs + Meadows)

Jobs: "If The Mix is hidden behind a toggle, The Scope is the product." The Mix must be visible while the user works on the canvas so that wiring actions produce immediately observable consequences. Structural topology changes (adding/removing connections that change which cells are terminal) should be reflected in The Mix immediately, even before re-execution.

### Manual Trigger with Cascade (Deming)

The whiteboard originally said "user triggers each cell explicitly." The panel rejected this — it makes composition feedback expensive and contradicts the center. Resolution: manual trigger with automatic downstream cascade. One trigger per chain, not per cell. The user chooses WHERE to initiate signal, a topology-level decision.

### Phase 1a/1b Split (Gall)

Phase 1 as originally scoped bundles eight interacting subsystems. Gall's Law demands fewer. The simplest thing that works: Source + AI + connections + Mix + cascade. Two cell types prove the center. Code, fan-in, health, and The Scope are Phase 1b refinements.

### Chat and Gate Structural Decisions

Chat demoted from primitive to overlay per Braitenberg: the experimenter is not a vehicle component. Gate demoted from cell to connection property per Braitenberg: inhibition is a synapse property, not a separate neuron. Three cell types remain: Source, Code, AI.

### Composition-to-Configuration Ratio (Deming)

The center claims an "activity shift" but has no operational definition. Deming proposed a validation criterion: measure canvas-level interactions vs. Scope-level interactions in user testing. If Scope interactions dominate, the center is unmet.

---

## Acceptance Criteria

### Phase 1a — "The Simplest Thing That Works"

*Phase 1a serves the center's first clause (composition over configuration). The second clause (observing emergence) activates in Phase 2 (automatic mode) and Phase 3 (cycles). Phase 1a builds the compositional infrastructure that emergence requires.*

### ac-two-transfer-primitives: Source and AI cells for minimum viable signal field
> **Center:** Two irreducible types — content origination and stochastic transformation — are the minimum needed to demonstrate that compositional meaning emerges from wiring, not from component complexity.

The system provides two cell types in Phase 1a: Source (emits user-provided text content, no input port) and AI (receives inputs, sends instruction plus inputs to a language model, emits generated output). Source originates signal without transformation; AI transforms stochastically. These two types are sufficient to demonstrate the center: a user can create content, wire it to an AI cell, and observe how different wiring produces different composed output.

### ac-directed-connections: Directed edges as sole composition mechanism
> **Center:** Directed edges are the medium's only grammar — every compositional decision the user makes is visible as a connection on the canvas, with no hidden or implicit wiring.

Cells connect via directed edges drawn from an output port to an input port. Connections are the sole composition mechanism. No implicit proximity-based connections, no internal pipelines within cells, no secondary wiring systems. The user creates, removes, and reroutes connections directly on the canvas. Fan-out is permitted (one output to many inputs). The topology is always a directed graph.

### ac-manual-trigger-cascade: One trigger propagates through the graph
> **Center:** Manual trigger operates at the topology level — the user chooses where to start the signal, a compositional decision, and the wave travels through the graph without per-cell intervention.

When the user triggers execution of a cell, all downstream cells with complete inputs execute in topological order without additional user action. The trigger propagates through the graph as a single wave. Cells that lack input from an untriggered upstream branch do not execute. The user initiates one action per chain, not one action per cell.

### ac-the-mix: Composed topology output always visible
> **Center:** The Mix closes the composition feedback loop — the user sees what their topology produces as a whole without mentally simulating signal flow. The Mix must be visible during composition so that wiring actions produce immediately observable consequences.

A persistent, always-visible UI element shows the composed output of all terminal cells (cells with no outgoing connections). The Mix is visible while the user works on the canvas — not hidden behind a tab, menu, or collapsed panel that requires an action to reveal. The Mix updates whenever terminal cell outputs change. When the user adds or removes a connection that changes which cells are terminal, The Mix immediately reflects the new terminal set — showing which cells now contribute to the composed output, even before those cells re-execute. The Mix presents terminal outputs in topological order with cell titles as provenance headers. Phase 1a delivers ordered juxtaposition — the simplest composition that preserves provenance and reading order. Richer composition logic (user-controllable arrangement, structural merging) is deferred.

### ac-cell-creation-simple: New cell in one action with type selection
> **Center:** Minimal creation friction keeps the user's attention on the canvas — the user thinks "I need another piece here" and places it, returning immediately to compositional decisions.

Creating a new cell requires one action and produces an immediately usable cell on the canvas. The user selects Source or AI at creation time (two options, not a burden). The cell appears with simple inline editing — the user can enter content (Source) or write an instruction (AI) directly, without opening a separate editing view.

---

### Phase 1b — "Precision and Polish"

### ac-code-cell: Deterministic transform completes the transfer primitive set
> **Center:** Code cells add deterministic transformation to the composition alphabet — the user can now express "extract, filter, format" as visible steps in the signal flow rather than hiding them inside AI prompts.

The system adds a third cell type: Code (receives inputs, executes user-written deterministic logic, emits result). Code cells are computationally irreducible to Source and AI: they transform deterministically, producing the same output for the same input. With all three transfer primitives, the full compositional alphabet is available.

### ac-fan-in-keyed-input: Multi-source inputs are labeled and orderable
> **Center:** Fan-in semantics make multi-source composition predictable — the user reasons about which sources feed which cell and in what order, keeping attention on topology structure.

When multiple cells connect to a single cell's input, the receiving cell gets a structured input where each source's contribution is identified by the source cell's title. The ordering of inputs is visible and user-controllable. Code cells can reference specific inputs by their source titles in their logic. AI cells receive all inputs as labeled context in the user-specified order. When a source cell is renamed, all downstream cells that reference its title as an input key update their display to reflect the new name. The system handles renames gracefully — downstream cells are never silently broken by an upstream rename. *Known trade-off: title-keyed inputs couple naming to composition. This is accepted as the cost of human-readable fan-in references, which serve compositional legibility.*

### ac-the-scope: Focused editing as three-column signal view
> **Center:** The Scope shows a cell's full signal path (inputs, transformation, output) in one view, reinforcing compositional thinking even during the brief act of component configuration. It creates pull back to the canvas by making topological context the dominant visual element.

Clicking a cell opens a focused editing view with three regions: connected inputs with their content (left), type-specific editor (center), and current output (right). Source cells show editor and output only — no input region, reinforcing their role as signal originators. Only one cell's Scope is open at a time. Closing the Scope returns the user to the canvas view. Each input in the left column is navigable — the user can click an input label to return to the canvas with the source cell selected, creating a natural path from configuration back to composition. The input and output regions together occupy at least as much visual weight as the editor region, reinforcing that the cell exists within a topology, not in isolation.

### ac-health-indication: Signal freshness visible across the graph
> **Center:** Health indication is topology-level feedback — the user sees signal freshness across the entire graph at a glance, identifying where re-execution is needed without inspecting individual cells.

Each cell displays a compact health indicator visible at the canvas level (without opening The Scope) showing one of three states: current (output reflects current inputs), stale (inputs have changed since last execution), or error (last execution failed). When a cell's upstream source changes its output, the downstream cell's indicator transitions to stale.

### ac-output-preview-as-identity: Output preview conveys cell function **(E)**
> **Center:** Output preview replaces type badges as the cell's identity — the user attends to what each cell produces (shaped by topology), not what it is labeled. Preview conveys function but does not make topology unnecessary for comprehension.

Each cell's at-rest display shows a preview of its current output with enough content to convey the cell's function through what it produces. Source cells show authored content. Code cells show computed results. AI cells show generated text. The preview reveals WHAT the cell produces; the connections reveal WHY it produces it and WHERE the output flows. A user familiar with the workspace can distinguish cell roles by reading output previews, but understanding the workspace's logic requires reading the topology. *Evaluate-and-iterate: passes if output previews are recognizably distinct across cell types in a representative workspace AND if understanding the workspace's composed behavior still requires attending to connections.*

### ac-uniform-cell-presentation: All cells visually identical at rest
> **Center:** Forces the user to read topology (connections between cells) rather than labels (type badges on cells) — the canvas rewards composition-reading over classification-reading.

All cells at rest present as visually identical compact cards: title, health indicator, output preview, and ports. No type badges, no type-specific coloring visible at rest. The only structural difference is port topology: Source cells expose an output port only; Code and AI cells expose both input and output ports. A user scanning the canvas sees a field of uniform cards connected by directed edges.

### ac-cell-creation-compositional: Drag-from-port creates a connected cell
> **Center:** Creation as composition — combining cell creation and connection in a single gesture keeps the user's attention on topology rather than switching between creation and wiring as separate acts.

Dragging from an output port into empty canvas space creates a new cell already wired to the source — combining creation and connection in a single compositional gesture. A newly created cell that has not yet been configured displays an empty state that is visually consistent with other cells and responds to incoming connections by reflecting them in its Scope input list.

### ac-connection-feedback: Wiring produces visible, anticipatory change
> **Center:** Immediate feedback from connection changes makes wiring feel consequential and anticipatory — the user sees the topology respond to their compositional actions with signals of pending change, reinforcing that connections are the active medium.

When the user creates or removes a connection, at least one visible change occurs in the affected cells within the same interaction moment: an input appearing or disappearing in The Scope, a health indicator transitioning to stale (signaling pending re-execution), or a change in The Mix's terminal set. The feedback should signal anticipation ("this connection will produce a new result") rather than obligation alone. The canvas is never inert to wiring actions. A connection to a newly created, unconfigured cell produces visible feedback in the form of the connection rendering and the cell's Scope input list updating.

---

### Phase 2 — "The Observer Enters"

### ac-execution-mode-toggle: Manual and automatic modes with visible state
> **Center:** The toggle governs how freely signal flows through the topology — automatic mode enables real-time emergence observation; manual mode enables deliberate step-by-step composition. Both are topology-level controls. Cascades never block composition.

A persistent, always-visible toggle switches between manual and automatic execution modes. The current mode is unambiguous from its visual presentation. In automatic mode, any cell output change triggers downstream re-execution without user action — signal propagates freely through the topology. In manual mode, the user triggers execution explicitly and signal cascades downstream per ac-manual-trigger-cascade. In both modes, execution cascades are non-blocking: the user can continue composing (creating cells, drawing connections, rearranging the canvas) while cascades execute. In-progress cascades are visually indicated but do not lock the canvas or prevent further compositional actions.

### ac-mode-switch-continuity: Mode transitions preserve signal state
> **Center:** Mode transitions are topology-level operations — the user shifts how the graph behaves without disrupting what the graph contains or losing pending work.

Switching from manual to automatic causes all stale cells (those with pending input changes) to execute. Switching from automatic to manual allows in-progress executions to complete but halts new propagation. No pending inputs are discarded in either direction. The transition is immediate and does not require confirmation.

### ac-chat-observation: Chat overlay receives observed cell's inner state **(E)**
> **Center:** Chat is the mechanism by which the user observes emergence conversationally — asking "why did this produce that?" about a cell's behavior within the topology, rather than inspecting raw configuration in isolation.

A chat overlay can be invoked on any cell. The overlay receives that cell's inner state as conversational context: sufficient information for a human to have a meaningful conversation about the cell's configuration, behavior, and current output. The information varies by cell type — each type exposes what is relevant to understanding its function. The chat overlay is not a cell type — it does not appear on the canvas, has no ports, and does not participate in the signal graph. *Evaluate-and-iterate: passes if a user can conduct a productive diagnostic conversation about any cell type, not if every possible question is answerable.*

### ac-chat-intervention: Chat overlay can modify the observed cell
> **Center:** Chat-mediated modification keeps the user's attention on topology-level intent ("make this cell behave differently in the chain") rather than on switching to the cell's configuration interface — composition-level reasoning expressed through conversation.

The chat overlay with write access can modify the configuration of the cell it observes: changing a Source cell's content, a Code cell's logic, or an AI cell's instruction through conversational interaction. All modifications made through Chat are immediately reflected when the cell's Scope is opened. The cell's health indicator updates to reflect that its configuration changed.

---

### Phase 3 — "The Loop Closes"

### ac-connection-gate: Connections can be latched for flow control
> **Center:** Connection gates make flow control a visible, spatial element of the topology — the user decides where to block and release signal as a compositional act on the wiring itself, not as a cell-level configuration.

Any connection can be toggled between open (signal passes through) and latched (signal blocked). The user toggles a connection's gate state with a single action on the canvas. When latched, upstream output does not propagate through that connection to downstream cells. Latched connections are visually distinguishable from open connections. Gate behavior is identical in manual and automatic execution modes — a latched connection always blocks regardless of the global execution model.

### ac-cycles-permitted: Topology allows feedback loops
> **Center:** Cycles enable emergent behaviors that arise purely from topology — the richest form of "behavior from wiring" and the fullest expression of the center's second clause.

The topology permits cycles: a cell's output may feed back to its own input through a chain of connections. Cycles execute only when all connections within the cycle are open (unlatched). A latched connection breaks the cycle. The user can release one quantum of signal through a latched connection in a cycle, enabling step-by-step observation of the cycle's trajectory. The user can always halt a running cycle by latching a connection, and the system remains responsive enough for the user to do so regardless of cycle state. The system does not impose automatic iteration limits or convergence detection.

---

## Validation Criteria

### vc-composition-primary: Composition dominates configuration in user testing
> **Center:** The center claims an activity shift. This criterion operationalizes that claim with an observable metric.

In user testing with representative tasks, the ratio of composition interactions (creating connections, removing connections, rerouting connections, drag-from-port cell creation) to configuration interactions (editing cell content, code, or instructions in The Scope or inline) should favor composition interactions. Canvas operations that are neither composition nor configuration (rearranging cells, triggering execution, panning, zooming) are excluded from the ratio. If configuration interactions dominate, the center is unmet regardless of individual AC compliance. *This criterion acknowledges Jacobi's finding: the center describes an optimal usage pattern (exploratory composition) that these requirements enable but cannot guarantee. Users with fixed production goals may configure more than compose, and that usage is acceptable.*

## Design Constraints

### dc-cycle-aware-engine: Execution engine accommodates cycles from Phase 1a
> **Center:** Gall's Law applied to infrastructure — the execution engine must evolve, not be replaced, when cycles arrive in Phase 3.

The Phase 1a execution engine must be architecturally capable of accommodating cycles in Phase 3 without replacement. The execution model should not hard-depend on topological sort as the sole scheduling mechanism. Cycle support may be disabled in Phase 1a, but the engine's design must not preclude it. This constraint is validated at design review, not at user acceptance.

---

## Scope

**IN (building):**

Phase 1a:
- Two transfer primitives (Source, AI) with simple inline editing
- Directed connections as sole composition mechanism
- Manual trigger with automatic downstream cascade
- The Mix: always-visible composed output of terminal cells

Phase 1b:
- Code cells (deterministic transform)
- Fan-in with labeled, orderable inputs and graceful rename handling
- The Scope: three-column focused editing view with navigable inputs
- Health indication (current / stale / error) visible at canvas level
- Output preview as cell identity
- Visual uniformity across all cell types at rest
- Drag-from-port cell creation (creation as composition)
- Visible, anticipatory feedback from connection changes

Phase 2:
- Execution mode toggle (manual / automatic) with visual state indicator
- Mode-switch transition semantics preserving signal state
- Non-blocking cascades (compose while executing)
- Chat overlay with inner state observation of any cell
- Chat read-write access to modify observed cell's configuration

Phase 3:
- Connection gates (latch property on edges, not a cell type)
- Cycles permitted in topology
- Step-by-step cycle observation via latched connections
- Responsive system during cycle execution with user-accessible halt

**OUT (explicitly not building):**
- File, PDF, or binary import into Source cells
- Grid snapping or spatial alignment tools
- Node grouping, composites, or sub-workspaces
- Templates or pre-wired subgraph insertion
- Cycle iteration budgets or automatic convergence detection
- Type badges, type-specific coloring, or visible type annotations at rest
- Chat as a cell type (it is an overlay)
- Gate as a cell type (it is a connection property)
- Multiple Scopes open simultaneously
- Semantic zoom
- Run history or execution comparison
- Export or output-format nodes

**DEFERRED (future):**
- Source cells accepting content types beyond text (files, PDF, structured data)
- Aperture or content filtering on connections
- Spatial annotation and canvas labels
- Run history with comparison across executions
- Export and output-format presentation
- Composites and hierarchical decomposition
- Workspace templates derived from existing topologies
- Logic gate behavior on connections (AND, OR, conditional routing)

## Dependencies

- Existing canvas infrastructure: spatial layout, pan, zoom, drag, node positioning, infinite canvas
- Existing AI execution capability: send instructions and context to a language model, receive text or structured output
- Existing persistence layer: workspace save and load, multi-workspace support
- Existing node shell: resize, duplicate, delete, drag behaviors
- Existing connection system: directed edge creation, deletion, and rendering

## User Scenarios

### sc-first-composition: Building a first signal chain
> *References: ac-cell-creation-simple, ac-directed-connections, ac-the-mix, ac-manual-trigger-cascade*

A user creates a Source cell and types a paragraph about a product idea directly in the cell's inline editor. They create an AI cell, draw a connection from the Source to the AI, and write an instruction: "Identify the three strongest objections to this idea." They trigger the AI cell. The output appears in the cell's preview. They glance at The Mix — always visible alongside the canvas — and see the objections as the composed output of the topology. They have built a signal chain in under a minute without consulting documentation or navigating to a separate editing view.

### sc-topology-as-thinking: Rewiring changes the output
> *References: ac-directed-connections, ac-the-mix, ac-manual-trigger-cascade, ac-health-indication*

A user has three Source cells (market research, competitor analysis, customer feedback) all wired to a single AI cell instructed to "synthesize strategic recommendations." The Mix shows strategy informed by all three inputs. The user disconnects the competitor analysis wire. The AI cell's health indicator turns stale. The user triggers it. The Mix updates: the strategy shifts toward customer-centric recommendations, with no mention of competitive positioning. The user changed no cell's content or instruction — they rewired, and the behavior changed. They reconnect the competitor analysis and add a fourth Source (engineering constraints). Another trigger. The Mix shifts again. The topology IS the thinking.

### sc-code-in-the-chain: Deterministic transform in the signal flow
> *References: ac-code-cell, ac-the-scope, ac-manual-trigger-cascade, ac-the-mix*

A user has a Source cell containing raw survey responses. They create a Code cell, wire the Source to it, and open the Code cell's Scope. The Inputs column shows the survey text. They write logic that extracts lines containing the word "frustrated" and returns a count with the matching excerpts. They trigger the Code cell. The output shows "12 mentions of 'frustrated'" followed by the excerpts. They wire this Code cell to an AI cell instructed to "analyze why customers are frustrated, citing specific evidence from the excerpts." One trigger from the Code cell cascades to the AI cell. The Mix shows the AI's analysis, grounded in the deterministic extraction. Source → Code → AI — three primitives, two connections, one coherent output.

### sc-reading-the-field: Scanning the canvas tells the story
> *References: ac-uniform-cell-presentation, ac-output-preview-as-identity, ac-health-indication, ac-directed-connections*

A user opens a workspace with eight cells and ten connections. Without clicking any cell, they scan the canvas. Three cells on the left have no input ports and show raw text previews — these are Sources. Two cells in the middle show code-formatted output — Code cells processing the source material. Two cells show prose paragraphs in their preview — AI cells generating analysis. One cell at the bottom, connected to both AI cells, shows a synthesis. All health indicators are green except one AI cell showing amber — its input changed since it last ran. The user reads the workspace as a diagram: sources feed through deterministic processing into AI interpretation, converging at a synthesis point. The topology tells the story of the analysis without opening a single cell.
