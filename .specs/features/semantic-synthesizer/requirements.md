---
feature: semantic-synthesizer
center: "This feature makes connection the primary creative act, so that what each element IS emerges from how it's composed rather than being declared in advance."
stage: requirements
intensity: deep
panel:
  - Donella Meadows (systems dynamics, leverage points, limits to growth)
  - W. Edwards Deming (statistical quality control, system of profound knowledge)
  - Steve Jobs (product taste, simplicity as sophistication, user experience)
  - Christopher Alexander (pattern languages, living structure, quality without a name)
rounds: 12
last_modified: 2026-04-05T00:00:00Z
---

# Semantic Synthesizer — Acceptance Criteria

## Panel

**Donella Meadows** (1941-2001) — Environmental scientist, systems thinker, lead author of *The Limits to Growth*. Creator of the twelve leverage points for intervening in a system. Her framework: a system's behavior arises from its structure; to change behavior, change the structure.

**W. Edwards Deming** (1900-1993) — Statistician, quality management pioneer. Father of the System of Profound Knowledge: appreciation for a system, knowledge of variation, theory of knowledge, psychology. His framework: quality comes from reducing variation in the process, not inspecting the output.

**Steve Jobs** (1955-2011) — Co-founder of Apple. Product visionary who believed in starting from the user experience and working backwards to the technology. Champion of simplicity as sophistication and saying no to a thousand things.

**Christopher Alexander** (1936-2022) — Architect, mathematician, author of *A Pattern Language* and *The Nature of Order*. Developed pattern languages, the quality without a name, and centers as the fundamental units of spatial structure. His framework: good design arises from structure-preserving transformations that strengthen centers.

## Deliberation Summary

The panel conducted 12 rounds of deliberation. The central debate concerned the composable pipeline inside Synthesizer cells: Jobs argued it creates a second composition system that competes with canvas-level connection (undermining the center). Meadows identified the structural test: if a user can build a "God Synthesizer" with a long internal pipeline that does everything, the canvas becomes decorative. Alexander proposed the resolution: nesting works if the inner pipeline uses the same spatial grammar as the canvas and cannot substitute for canvas connections. The panel converged on: accept the composable pipeline (user decision) but guard canvas primacy through explicit subordination constraints.

**Deferred by panel consensus (user override noted):** Cycles with feedback semantics — the user decided these are in scope, but the panel unanimously flagged that cycle termination mechanics are undefined. Included below as (E) criteria. The Chat meta-layer was similarly flagged as orthogonal to the center but included per user decision, also as (E).

**Over-scope findings:** The whiteboard itself did not over-scope. The user's resolved decisions expand scope in two areas (cycles, chat meta-layer) that the panel considers high-risk for a first delivery. The panel recommends these be the last criteria implemented and the first cut if schedule pressure emerges.

**Whiteboard fidelity:** The whiteboard captured intent faithfully. The user's two-primitive decision (Signal + Synthesizer) refined the whiteboard's "one primitive with topological inference" into the whiteboard's own Alternative 2, resolving Tension 2 (one primitive vs. three modes) through composability.

**Gaps the whiteboard missed:** (1) Visual treatment of connections — the primary creative act has no described visual presence. (2) The empty canvas experience. (3) Migration from the existing five-type system. (4) The depth problem — pipeline configurator + stage editor inside the Scope creates three levels of nesting from the canvas.

---

## Acceptance Criteria

### ac-two-primitives: Only two cell types exist
> **Center:** Reducing five declared types to two minimizes upfront classification, so a cell's role emerges primarily from its connections rather than a type menu.

The system offers exactly two cell types: Signal and Synthesizer. The user chooses one or the other at creation time. No other cell types exist. There is no "type" menu beyond this binary choice.

### ac-signal-as-source: Signal cells originate content
> **Center:** Sources provide the raw material that connections give meaning to — without sources, there is nothing for composition to act upon.

A Signal cell holds user-provided content: text, a document, structured data, an API response, a command result, or any other artifact. It has no inputs from other cells. Its output is its content, available to any downstream connection. The Scope view for a Signal cell shows the content editor and output preview; the input column is empty.

### ac-synthesizer-as-effect: Synthesizer cells transform inputs through a composable pipeline
> **Center:** A Synthesizer's identity emerges from two sources of composition — what is connected to it (canvas) and how it processes those connections (pipeline) — rather than from a type declaration.

A Synthesizer cell receives inputs from connected upstream cells and processes them through a user-composed internal pipeline. The pipeline consists of any number of stages arranged in any order, drawn from three effect types: Chat (prompt-response), Code (deterministic transform), and AI (schema-constrained generation). A single-stage pipeline is valid. An empty pipeline passes inputs through unchanged.

### ac-connection-changes-output: Connecting cells produces observable output change
> **Center:** This is the center's most direct expression — making a connection changes what a cell IS (what it produces), proving that connection is the primary creative act.

When the user draws a connection from cell A's output to cell B's input, cell B's output changes to reflect the new input. When the user removes a connection, the downstream output changes accordingly. The causal relationship between connection and output is immediate and visible.

### ac-canvas-primacy: Canvas connections are the only mechanism for fan-in
> **Center:** Canvas connections are uniquely required for merging different signal sources at intermediate points — this is the structural property that keeps connection as the primary creative act for any non-trivial composition.

Canvas connections are the only mechanism for introducing new signal sources at intermediate points in a transformation chain. A Synthesizer's pipeline stages operate on a single input set established by the cell's connections; to merge a different source mid-chain, the user must create a separate Synthesizer and connect it on the canvas. Sequential transformation chains can be expressed either as multi-stage pipelines or as connected single-stage Synthesizers — the canvas is structurally required for fan-in (combining outputs from multiple upstream cells).

### ac-pipeline-subordination: Internal pipeline receives only the cell's connected inputs
> **Center:** The pipeline is subordinate to canvas connections — it processes what connections deliver, ensuring connection remains the upstream creative decision.

A Synthesizer's pipeline stages cannot receive inputs from cells other than those connected to the Synthesizer itself. The pipeline's first stage receives the Synthesizer's connected inputs. Each subsequent stage receives the output of the previous stage. There is no mechanism to wire an external connection to a specific pipeline stage.

### ac-connection-presence: Connections are visually prominent
> **Center:** The primary creative act must be the most visually present element, not the thinnest — visual weight must match conceptual importance.

Connections between cells visually communicate at minimum: (a) existence (visible line), and (b) signal direction (source to destination). Connections are visually substantial enough that a glance at the canvas reveals the composition structure without tracing thin lines. **(E)**

### ac-input-ordering: Users control the order of inputs
> **Center:** Connection order is a dimension of composition — the same connections in different order can produce different output, giving connections more expressive power.

When a Synthesizer has multiple inputs, the user can see and reorder them. The order of inputs affects how they are presented to the pipeline's first stage. Reordering inputs changes the output.

### ac-stable-scope-layout: Uniform three-column Scope for all cells
> **Center:** A uniform editing surface means the cell's role is not declared by its editor UI — it emerges from what the user puts in the cell and what they connect to it.

Both Signal and Synthesizer cells open into the same three-column Scope layout: inputs (left), editor (center), output (right). For Signal cells, the input column is empty. The layout does not change shape based on cell type.

### ac-scope-as-extension: The Scope feels like a spatial extension of the canvas
> **Center:** If the Scope feels like a separate application, the user loses spatial awareness of connections while editing — severing the link between connection (canvas) and configuration (Scope).

Opening a cell's Scope maintains the user's sense of spatial context. The Scope is visually and interactionally connected to the canvas — the user understands they are "inside" a specific cell within the larger composition, not in a disconnected editing environment. **(E)**

### ac-scope-depth: Pipeline and stage editing coexist without nesting
> **Center:** Excessive nesting depth breaks spatial awareness, which breaks the user's ability to think about connections while configuring a cell — connection stops being the primary creative frame.

Within the Scope's center column, the pipeline configurator (stage sequence) and the selected stage's editor are visible simultaneously. Selecting a different stage updates the editor in place. There is no drill-down modal or stacked navigation to reach a stage's configuration. Maximum depth from canvas: Canvas, then Scope. Two levels, no more.

### ac-pipeline-stage-types: Three composable effect types
> **Center:** Three general-purpose effect types let a Synthesizer's behavior emerge from composition of simple parts rather than from selecting a specialized type.

The three pipeline stage types are: (1) Chat — prompt template with model response, (2) Code — deterministic transform expressed as user-written logic, (3) AI — schema-constrained generation with optional structured output. Each stage type is available in any position in the pipeline. A pipeline can mix types freely (e.g., Code then AI then Code). **(E)**

### ac-stage-handoff: Pipeline stages pass output forward
> **Center:** Sequential handoff within the pipeline mirrors the connection pattern of the canvas — output becomes input — reinforcing composition-through-connection at a smaller scale.

Each pipeline stage receives the output of the previous stage (or the cell's connected inputs for the first stage) and produces output for the next stage (or the cell's final output for the last stage). The data format between stages is consistent: each stage receives and produces structured data.

### ac-compact-display: Cells at rest show output, not configuration
> **Center:** Showing output (what emerged from composition) rather than type or instruction (what was declared) ensures the canvas surface reflects compositional results, not categorical labels.

At rest, a cell displays: a preview of its current output, its title label, its health indicator, and its connection ports. It does not display its internal configuration, pipeline structure, or editing controls. The at-rest cell is a signal indicator, not an editing surface.

### ac-health-indicator: Three-state health visible at rest
> **Center:** Health state communicates whether a cell's compositional inputs are flowing correctly — green means connections are producing results, amber means connections changed but results are stale, red means the composition is broken at this point.

Each cell displays a health indicator with three states: current (inputs processed, output fresh), stale (inputs changed since last evaluation, output outdated), and error (evaluation failed). The indicator is visible without opening the cell.

### ac-title-labels: User-assignable title labels
> **Center:** Title labels let users annotate emergent intent without the system imposing categorical identity — the label is what the user decided this cell DOES in the composition, not what the system declared it IS.

Every cell has an optional user-editable title label visible at rest. The label is free text. The system does not auto-generate labels from cell type or content. Labels persist across sessions.

### ac-error-halt: Errors stop downstream propagation
> **Center:** Error halting is a compositional behavior — it means a broken connection (error) has structural consequences (downstream silence), reinforcing that connections carry real causal weight.

When a cell enters an error state, all cells downstream of it in the connection graph do not receive updated input. Downstream cells retain their last state (stale) or show that their upstream dependency has errored. Errors do not cascade — only the erroring cell shows error state; downstream cells show stale or blocked state.

### ac-error-visibility: Error state visible without opening
> **Center:** If errors are invisible at rest, the user cannot assess composition health from the canvas — they must open each cell, breaking the spatial overview that makes connection-thinking possible.

A cell in error state is distinguishable at rest from a healthy or stale cell. The error is attributable — the user can identify which cell errored by looking at the canvas, without opening cells.

### ac-mix-view: One action shows composed terminal output
> **Center:** The Mix view is the payoff of composition — it shows what all the connections collectively produced, closing the feedback loop between connection-as-action and meaning-as-result.

A single user action (one click or one keystroke) shows the composed output of all terminal cells (cells with no outgoing connections). The Mix view displays the combined result of the entire composition. For cached results, it appears immediately. For results requiring computation, it shows clear progress indication.

### ac-terminal-identification: Terminal cells are identifiable by topology
> **Center:** Terminal cells are defined by their connection topology (no outgoing connections), not by a type declaration — their role as "endpoints" emerges from how they are composed into the graph.

Cells that have no outgoing connections are identifiable as terminal cells. The user can determine which cells contribute to the Mix view by observing which cells have no outgoing connections.

### ac-empty-canvas: Empty workspace invites the first connection
> **Center:** The first experience must lead toward connection — the empty state should make the path to "create something, create another thing, connect them" obvious and inviting.

When a workspace has no cells, the canvas communicates how to begin. The path from empty canvas to first connection (create a cell, create another, connect them) is discoverable without external documentation. **(E)**

### ac-cycle-support: Circular connections are supported with feedback semantics
> **Center:** Cycles are the most powerful form of composition-through-connection — a connection that feeds back means the output influences itself, and what the cell IS evolves iteratively through its own connections.

The system permits the user to create circular connections (cell A feeds cell B feeds cell A). Circular connections execute with explicit feedback semantics: the system provides a defined mechanism for iteration count or convergence, so cycles terminate deterministically. The user has visibility into and control over cycle behavior. **(E)**

**Panel note:** The mechanics of cycle termination (iteration limits, convergence detection, user-specified bounds) are undefined in the current design. This AC passes if cycles are implemented with ANY coherent termination model that the user can observe and control. The panel unanimously recommends this be the last AC implemented and notes it may warrant its own spec.

### ac-chat-configuration-assistant: Chat is available on any cell for configuration help
> **Center:** Chat assists with configuring cells so that the user can realize their compositional intent more effectively — it serves connection-as-creative-act by lowering the barrier to expressing what each connection should do.

The user can invoke a chat assistant on any cell (Signal or Synthesizer). The assistant helps configure the cell — suggesting code, refining prompts, explaining behavior. The assistant's output is configuration guidance, not pipeline data. **(E)**

### ac-chat-distinct-from-pipeline: Chat assistant is visually distinct from pipeline AI stages
> **Center:** If the configuration assistant is confused with a pipeline AI stage, the user loses clarity about what is part of the composition (connection-driven) and what is meta-level help — the boundary between creative act and tooling blurs.

The chat configuration assistant is visually and interactionally distinct from AI pipeline stages within a Synthesizer. The user cannot accidentally confuse "asking the assistant for help" with "configuring an AI stage in the pipeline." These are presented as separate activities with separate interfaces. **(E)**

### ac-migration-from-existing: Existing workspaces transition to the two-primitive model
> **Center:** Existing workspaces contain compositions (connections between nodes) that embody the user's creative decisions — migration preserves these connections and their meaning, honoring past compositional acts.

Workspaces created under the current five-type system (Markdown, PDF, Transform, Chat, AiTransform) are accessible after this feature ships. Existing nodes map to Signal or Synthesizer cells. Existing connections are preserved. The user's data and compositional structure survive the transition without manual reconstruction.

---

## Scope

**IN (building):**
- Two cell types: Signal and Synthesizer
- Composable internal pipeline (Chat, Code, AI stages in any order)
- Canvas connections with signal propagation
- Three-column Scope view for both cell types
- Compact at-rest display (output preview, health dot, title label)
- Mix view for composed terminal output
- Error halt and visibility
- Input ordering
- Title labels
- Migration from five-type system

**OUT (explicitly not building):**
- Collaborative real-time editing
- Cell templates or preset library
- Property panels, minimap, or resize handles at rest
- Type-specific visual distinction between Signal and Synthesizer at rest (beyond connection topology)
- Node type selector menu (beyond the binary Signal/Synthesizer choice)
- Conversation-style chat interface as a pipeline stage (Chat stages use prompt templates, not multi-turn conversation)

**DEFERRED (future):**
- Keyboard-first interaction model
- Connection health indicators (signal type, throughput, latency visualization on connection lines)
- Signal type system (distinguishing text, structured data, binary content at the connection level)
- Batch execution (running all stale cells at once)
- Version history per cell
- Undo/redo for connection changes
- Canvas-level zoom-to-fit after composition changes

**AT RISK (in scope per user decision, panel flags high complexity):**
- Cycles with feedback semantics (ac-cycle-support) — undefined termination mechanics
- Chat as meta-layer on any node (ac-chat-configuration-assistant, ac-chat-distinct-from-pipeline) — orthogonal to center, could be a separate spec

---

## Dependencies

Existing capabilities this feature requires to be in place:

1. **Canvas infrastructure** — the spatial canvas with node rendering, connection drawing, and viewport management (exists: @xyflow/react integration)
2. **Server-side persistence** — workspace storage with per-workspace scoping (exists: multi-workspace storage layer)
3. **AI execution** — ability to send prompts to AI models and receive responses, with optional structured output (exists: AiExecutorPort, ChatPort, model roster)
4. **Code execution** — ability to run user-written transforms in a sandboxed environment (exists: TransformExecutorPort, web worker)
5. **Workspace management** — creating, switching, and managing workspaces (exists: WorkspaceRegistryPort, workspace manager)

---

## User Scenarios

### Scenario 1: Building a first composition from scratch

The user opens a new workspace and sees an empty canvas (ac-empty-canvas). They create a Signal cell and paste in a product requirements document. They give it the title "Product Reqs" (ac-title-labels). They create a second Signal cell and paste in customer interview notes, titling it "Interviews." Both cells show output previews of their content at rest (ac-compact-display).

The user creates a Synthesizer cell. They connect both Signal cells to it (ac-connection-changes-output). The Synthesizer's health dot turns amber — inputs received but not yet processed (ac-health-indicator). They open the Synthesizer's Scope (ac-stable-scope-layout) and see the two inputs in the left column, ordered as connected (ac-input-ordering). They reorder them, putting Interviews first.

In the center column, they add a single AI stage to the pipeline (ac-pipeline-stage-types) and write an instruction: "Extract the top 5 customer pain points that align with stated product requirements." They see the output appear in the right column (ac-stage-handoff). The health dot turns green. They close the Scope and see the output preview on the compact cell (ac-compact-display). They title it "Pain Point Extraction."

They click Mix (ac-mix-view) and see the extracted pain points — the composed output of their three-cell, two-connection composition.

### Scenario 2: Multi-stage pipeline within a Synthesizer

The user has a Signal cell containing raw JSON data from an API response. They create a Synthesizer, connect the Signal to it, and open the Scope. They compose a three-stage pipeline (ac-pipeline-stage-types, ac-scope-depth): first a Code stage that filters the JSON to only records from the last 30 days, then an AI stage that summarizes trends, then a Code stage that formats the summary as a specific JSON schema.

The pipeline configurator and the selected stage editor are visible simultaneously in the center column (ac-scope-depth). The user clicks between stages to configure each one. Each stage shows what it received and what it produced (ac-stage-handoff). The cell's final output is the formatted JSON from the last Code stage.

They then create a second Synthesizer, connect the first Synthesizer's output to it (ac-canvas-primacy), and add an AI stage that generates action items from the trend summary. The canvas now shows: Signal -> Synthesizer -> Synthesizer, and the output of the second Synthesizer depends on both canvas connections AND its internal pipeline (ac-pipeline-subordination).

### Scenario 3: Error handling in a composition chain

The user has a four-cell chain: Signal A -> Synthesizer B -> Synthesizer C -> Synthesizer D. Synthesizer B has a Code stage with a bug. When it executes, B enters error state — the health dot turns red and the error is visible without opening B (ac-error-visibility). Synthesizer C and D do not cascade into error — C shows a blocked/stale state because its input (from B) is unavailable (ac-error-halt).

The user opens B's Scope, sees the error message, and fixes the Code stage. B re-evaluates, the health dot turns green, and C and D re-evaluate in sequence. The composition flows again. At no point did C or D show misleading "good" output from before the error.

### Scenario 4: Migrating an existing workspace

The user has an existing workspace with a Markdown node containing research notes, a PDF node with a paper, an AiTransform node that extracts key findings, and connections between them. After the feature ships, they open this workspace (ac-migration-from-existing). The Markdown node appears as a Signal cell titled with its previous content summary. The PDF node appears as a Signal cell. The AiTransform appears as a Synthesizer cell with an AI stage pre-configured with its previous instruction and schema. The connections between them are preserved. The composition still works — the Synthesizer still extracts findings from the connected sources.

---

## Panel Dissent Record

**Jobs on composable pipeline:** "I maintain that a single-mode Synthesizer composed on the canvas is truer to the center than a multi-stage pipeline composed inside a cell. The user decided otherwise, and I respect that. But I predict that within three months of use, the user will find themselves building most compositions as single-stage Synthesizers connected on the canvas, because that is where the spatial thinking lives. The internal pipeline will be used rarely. If that prediction holds, simplify: remove multi-stage pipelines and make each Synthesizer a single effect. The (E) marking on pipeline ACs exists for this reason."

**Deming on cycles:** "Cycles with feedback semantics require an execution model fundamentally more complex than DAG evaluation. The acceptance criteria as written (ac-cycle-support) pass if ANY coherent termination model is implemented. This is too loose. I recommend: ship without cycles, observe whether users attempt circular connections, and design the cycle model based on observed need. Plan-Do-Study-Act, not Plan-Do-Hope."

**Meadows on nested composition:** "The canvas-primacy and pipeline-subordination ACs address my structural concern. But I want it recorded: if user telemetry (even informal observation) shows that average pipeline length exceeds 3 stages, the inner system is growing faster than the outer system. That is a limits-to-growth signal. When the inner system outgrows the outer system, restructure."

**Alexander on connections:** "The ac-connection-presence criterion is marked (E), which means it can pass with minimal implementation. I want it recorded that connections are the PRIMARY CENTER of this system's wholeness. If they are implemented as thin gray lines with arrow tips — the minimum — the system will lack life. Connections deserve the same design attention as cells. I defer to the evaluate-and-iterate process but note that 'evaluate' must include: do the connections feel alive?"
