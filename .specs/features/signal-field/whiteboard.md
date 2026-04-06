---
feature: signal-field
center: "This feature shifts the user's primary activity from configuring individual components to composing connections between them, and from prescribing behavior to observing emergence."
center_test:
  excludes: "A feature that enriches the internal editing experience of a single cell type — a multi-tab code editor, a PDF annotation layer, a richer AI parameter interface — deepens component-level engagement rather than composition"
  boundary: "A template library that lets users browse and insert pre-wired subgraphs almost serves this center, but if templates become a substitute for spatial thinking rather than a seed for it, the medium has been circumvented"
stage: whiteboard
intensity: deep
loop_iterations: 3
last_modified: 2026-04-05T21:30:00Z
---

## Center

**This feature shifts the user's primary activity from configuring individual components to composing connections between them, and from prescribing behavior to observing emergence.**

The current workspace front-loads **classification** ("what kind of thing do I need?") at the expense of **composition** ("how should these things connect?"). The proposal inverts this priority. The second clause captures a qualitative shift introduced by cycles and the chat overlay: the user is no longer only a builder — they are an observer of emergent behavior arising from topology.

**Jacobi's qualification (accepted):** The center describes an optimal usage pattern — exploratory composition — that the design enables but cannot guarantee. Users with fixed production goals will configure, not compose, and that usage is acceptable, not a failure of the center.

## Center Test

**Exclusion test:** A feature that enriches the internal editing experience of a single cell type — a multi-tab code editor, a PDF annotation layer, a richer AI parameter interface — would be a good feature idea that this center *excludes*. It deepens component-level engagement rather than composition. Such features are permissible only if subordinate to the composition experience, never as the primary investment.

**Boundary discrimination:** A "template library" that lets users browse and insert pre-wired subgraphs *almost* serves this center (it is about composition), but the center should say no if templates become a substitute for spatial thinking. If users browse a catalog rather than compose on the canvas, the medium has been circumvented. Templates that seed an empty canvas for further wiring: acceptable. Templates that replace the composition act: excluded.

## Context

The current workspace has grown through accretion. Each new capability — pipeline execution, transform polish, AI transforms, chat — arrived as a new component type with its own visual treatment, creation logic, and execution path. The trajectory has been: identify a use case, create a node type. This is additive complexity. Five types is already past the threshold where a user can hold all types in mind simultaneously while composing.

The workspace sits in a lineage of visual composition environments — dataflow languages, node-based compositors, AI workflow builders. But the crucial difference is purpose. Those tools are about **production** — building a pipeline that runs. This workspace is about **thinking** — arranging context to discover what you want to say to an AI. The output is not a program; the output is a composed perspective.

The multi-workspace infrastructure, merge-on-save, deletion manifest, and polling system are all complexity management for a model that this proposal aims to simplify at the root. A simpler primitive model may retroactively simplify the infrastructure layers above it.

## Intent

The user wants a workspace where the primary cognitive artifact is the **arrangement**, not the individual parts. They picture a calm field of identical cards connected by wires, where intelligence is visible in the topology. They want to look at their canvas and immediately see: here is where sources enter, here is where transformation happens, here is where generation occurs, and here is how it all flows to the output. The canvas should be readable as a diagram of their thinking process.

The user's language reveals their mental model: "signal field," "irreducible," "computationally irreducible to each other," "the discontinuity is in the territory, not the map." The picture in their head is closer to a circuit board than a document — clean, regular, functional. Every connection intentional. No decoration. No waste.

There is a pedagogical dimension. The visual uniformity withholds type information to force the user to attend to relationships. This is constructivist environment design: create conditions where the desired understanding emerges through interaction, not through labeling. The workspace teaches composition-thinking by refusing to let classification-thinking dominate.

The user wants to build a **medium**, not a tool. A tool does a job. A medium changes how you think. The signal field changes how you think about AI context by making composition spatial, visible, and interactive.

## Three Transfer Primitives

Three irreducible cell types. Each does one thing. No internal pipeline. No modal behavior.

- **Source** — originates signal. No transformation. Content is the output. No input port. The sensor.
- **Code** — deterministic transformation. Same input always produces same output. The direct wire.
- **AI** — probabilistic transformation. Output shaped by instruction and context, not fully predictable. The probabilistic wire.

**Why three:** Source (identity) cannot be expressed as Code or AI without absurdity. Code (deterministic) and AI (stochastic) are computationally irreducible to each other. The discontinuity is in the territory, not the map. No two share the same position along the axes of signal origination and determinism.

**Why not more:** Markdown and PDF are both Sources — the distinction is content type, not transfer function. AiTransform and Chat differ in statefulness and output mode — both are parameters of the AI primitive or the chat overlay.

## Chat as Overlay

Chat is **not** a cell type. It is a workspace-level overlay — the mechanism by which the human enters the system as a participant rather than remaining an external observer. It is orthogonal to the signal graph.

**Rationale (Braitenberg):** The experimenter who watches the vehicles is not a vehicle component. Chat receives inner state and can modify cells, but has no output port and does not participate in signal flow. It is the observation apparatus, not a transfer function.

**Interaction model:** The user invokes a chat overlay on any cell. The AI helps configure the cell — suggesting code, refining prompts, explaining behavior. Chat has **read-write access**: it can modify the configuration of the cell it observes (change a Source's content, a Code cell's logic, an AI cell's instruction). History is ephemeral (component state).

**Compelling use case:** Using Chat to draft JavaScript transforms in Code cells — pair programming through the overlay.

### Chat Inner State Protocol

Each cell type exposes a different kind of inner state when Chat is invoked on it:

| Cell Type | What Chat receives | What this enables |
|---|---|---|
| **Source** | The content itself (text, data, file contents) | Conversation about a document |
| **Code** | The code/rule AND the last execution result, including errors | Pair programming, debugging |
| **AI** | The instruction, last input received, last output produced, model identity | Oracle interrogation — "why did you produce this?" |

## Gate as Connection Property

Gate is **not** a cell type. It is a property of connections — a latch on an edge.

**Rationale (Braitenberg):** In neural circuits, inhibition is a property of the synapse, not a separate neuron. A connection with a latched/open toggle produces identical behavior to a Gate cell — but without occupying canvas space, without breaking the three-primitive taxonomy, and without requiring its own visual treatment.

**Behavior:** Any connection can be toggled between open (signal passes through) and latched (signal blocked). When latched, the user can press to release one quantum of signal — enabling step-by-step observation of cycle behavior. Gate behavior is identical in manual and automatic execution modes.

### Cycles Analysis (Braitenberg)

Three behaviors of a cycle with all connections open (automatic mode):

1. **Convergence.** Each pass produces output closer to a fixed point. The signal stabilizes — an eigenvalue, a form that survives its own transformation.
2. **Oscillation.** The signal alternates between states without converging. A clock, a pattern generator.
3. **Divergence.** Each pass amplifies the signal. Output grows without bound. "In a neural circuit, this is a seizure."

Connection gate behavior by configuration:

| Gate state | Topology | Behavior |
|---|---|---|
| Latched (blocking) | Any | Cycle broken. Upstream dormant. Stable. |
| Open (passing) | Acyclic | No-op. Signal flows through. |
| Open (passing) | Cyclic | Cycle runs. Convergence, oscillation, or divergence. |
| Latched, user releases one quantum | Cyclic | One step of the cycle's trajectory. Transparent, observable process. |

**Safety principle:** No automatic convergence detection or iteration budget. But the execution engine must remain interruptible — the user must always be able to latch a connection to break a cycle, even mid-execution. A system that locks out its observer has violated the fundamental principle.

## Execution Model

**Manual mode** = implicit latches on every connection. Each cell receives input but does not execute until the user triggers it. Trigger cascades downstream automatically — one trigger per chain, not per cell. The user chooses WHERE in the topology to initiate, a topology-level decision.

**Automatic mode** = latches transparent, clock runs freely. Signal propagates as soon as available. No intermediate state.

**Critical constraint:** Connection gates (latched connections) behave identically in both modes. A latched connection always blocks, always requires user action to release, regardless of global mode. In automatic mode, connection gates are the *only* brake.

**Non-blocking:** Execution cascades never lock the canvas. The user can continue composing (creating cells, drawing connections, rearranging) while cascades execute.

## Composition Mechanisms

The whiteboard originally claimed "one composition mechanism." Jacobi's inversion revealed four:

1. **Directed edges** — the primary, visible composition mechanism
2. **Fan-in keyed objects** — cell titles as namespace for multi-source inputs
3. **The Mix** — topology-derived implicit collection of terminal cell outputs
4. **Cell-internal input references** — AI instructions and Code logic referencing labeled inputs

One PRIMARY composition mechanism (directed edges) with three derivative mechanisms. The derivatives exist because of directed edges, not independently of them.

## Assumptions

**1. Three is the right number.** Source (identity), Code (deterministic), and AI (stochastic) are computationally irreducible to each other. The bet is that context composition does not need additional transfer primitives (accumulation, conditional routing). If it does, the primitive set must grow.

**2. Fan-in with keyed objects is sufficient composition.** Wiring expresses dependency but not structure — combination logic lives inside cell configuration. The wiring is for flow; the cell internals are for meaning. Known trade-off: title-keyed inputs couple naming to composition.

**3. Compositional meaning emerges from wiring.** Wiring determines what signals reach which cells and in what combinations. This creates compositional meaning (juxtaposition, sequencing, synthesis). In cyclic topologies, wiring also determines dynamics (convergence, oscillation, divergence). Behavior in the transfer-function sense (what a cell does to its inputs) lives in cell configuration. The center's honest claim is about compositional meaning, not behavior.

**4. Users want to think in signal flows.** The signal field paradigm assumes a user comfortable with graph-based mental models. This may be a narrow but growing audience.

**5. Visual uniformity creates calm, not confusion.** The uniform presentation works for experts who read topology instinctively. For novices, it removes orientation cues. Construction-phase type hints (when cells are empty/unexecuted) may be needed.

## Design Tensions

**Tension 1: Structural honesty vs. visual uniformity.** Source cells cannot receive inputs — topological fact, not label. The user needs this information before wiring, yet the design withholds it at rest. Port topology (output-only vs. input+output) provides implicit type information.

**Tension 2: Minimal alphabet vs. configuration burden.** Three types means logic that previously lived in specialized components now lives in cell configuration. Total information has not decreased; it has moved.

**Tension 3: Composition as primary activity vs. The Scope as primary experience.** The Scope is the center's natural enemy (Jacobi). The richest interaction surface is inside individual cells, yet the center says composition is primary. Every AC that improves component configuration also makes configuration more attractive. The Scope needs pull-back mechanisms — navigable inputs, visual weight on topological context.

**Tension 4: Emergence vs. predictability.** The signal field must be both surprising enough to enable discovery and predictable enough to enable work.

**Tension 5: Mix reactivity.** Adding a wire to a terminal node removes its output from The Mix. The Mix changes as a side effect of topology edits, not as a direct user action.

**Tension 6: Manual-to-automatic transition.** Pending stale cells firing when the mode switches. Resolved: manual→automatic fires all stale cells; automatic→manual completes in-progress, halts new propagation. No inputs discarded.

**Tension 7: Figure/ground (McLuhan's dissent).** Content should be figure, composition should be ground. The medium should amplify the user's content through structural composition, not elevate composition over content authoring. The Mix is feedback (a mirror), not product. The center may have figure and ground inverted. Noted as a genuine tension, not resolved.

## Open Questions

**1. The Mix's composition logic.** ~~How does The Mix compose terminal outputs?~~ **Resolved (Phase 1a):** Topologically ordered juxtaposition with cell titles as provenance headers. The Mix in Phase 1a is a reading-order presentation of terminal outputs, not a structural merge. Richer composition is a future concern.

**2. Construction-phase type hints.** When cells are empty/unexecuted and output preview is unavailable, what subtle type indication appears? Must not dominate the mature canvas but must provide orientation during building.

**3. Cycle safety mechanism.** The UI must remain responsive during cycles. Is cycle execution asynchronous with interruptible steps? Is there a global "stop" in addition to per-connection gate controls? If gate is on connections (less visible than a cell), how does the user halt a runaway cycle quickly?

**4. Signal type mismatch in cycles.** What happens when a Code cell outputs structured data and the downstream AI cell expects text? Invisible in acyclic pipelines but amplified in cycles where type mismatches compound.

**5. Code cell timing.** If Code is deferred to Phase 1b, does Phase 1a validate the center sufficiently with Source + AI only? Must be tested, not assumed.

**6. Chat overlay interaction model.** What is the UX container? Panel/drawer attached to selected cell? Keyboard shortcut? Does it persist across cell selection?

**7. Center validation metric.** How will we know the primary activity has shifted? Composition-to-configuration interaction ratio in user testing. Without an observable criterion, the center is unfalsifiable.

## Alternatives Considered

**1. Keep five types, unify visually only.** Rejected — the five-type ontology is structurally wrong.

**2. Five primitives (3 transfer + Chat cell + Gate cell).** Initial reconvened panel position. Superseded: Chat is an observation apparatus (overlay), not a transfer function. Gate is a synapse property (connection latch), not a neuron (cell).

**3. One universal type.** Rejected — pushes too much onto configuration, loses structural honesty.

**4. Progressive disclosure of type indicators.** Cells uniform by default, users opt into type cues. More work but avoids illegibility risk for novices.

**5. Skip Phase 1, go directly to primitives.** Avoids habit-breaking between phases. Higher technical risk but single cognitive transition.

**6. Gate as cell.** Gate occupies canvas space, has visual presence, breaks three-primitive symmetry. Rejected per Braitenberg: inhibition is a synapse property, not a separate neuron.

## Non-Functional Context

**Timeline:** Incremental delivery across four phases. Phase 1a proves the basic medium with minimum viable primitives. Phase 1b adds precision. Phase 2 introduces the observer. Phase 3 closes the loop.

**Audience:** People who understand AI context as compositional. AI engineers, prompt engineers, technical writers, researchers, developers composing complex system prompts.

**Scale:** Three primitives with unlimited wiring scales well conceptually. Canvas with 50+ uniform cards becomes unreadable. Composites (future) may be essential for non-trivial use.

**Performance:** Optimize for **rearrangement speed** over execution speed. The tool succeeds when experimentation is fluid. Deterministic cells instant; stochastic cells have intrinsic latency. Cascades must be non-blocking — the user composes while the graph executes.

**Grid snapping:** Removed per Gall's Law. No real reason to have it yet. Start simple.

## Phase Scope Recommendation

### Phase 1a — "The Simplest Thing That Works" (Gall)

Two cell types prove the center. Source + AI + connections + Mix + manual cascade.

- Source and AI cells with unified visual treatment
- Directional connections with visible signal flow
- Manual trigger with automatic downstream cascade
- The Mix as always-visible composed output of terminal cells
- Simple inline editing (no three-column Scope yet)
- No Code, no fan-in keyed objects, no health tracking, no Scope

### Phase 1b — "Precision and Polish"

Code cells, multi-source inputs, and the full editing experience.

- Code cells (deterministic transform)
- Fan-in with keyed objects (labeled, orderable multi-source inputs)
- Health indication (current / stale / error)
- The Scope (three-column focused editing: inputs | editor | output)
- Drag-from-port cell creation (creation as composition)
- Output preview as identity, visual uniformity, connection feedback

### Phase 2 — "The Observer Enters"

- Automatic execution mode (toggle in header, visual state indicator)
- Mode-switch continuity (stale cells fire on manual→auto, in-progress completes on auto→manual)
- Chat overlay with inner state protocol and read-write access
- Non-blocking cascades (compose while executing)

### Phase 3 — "The Loop Closes"

- Connection gates (latch property on edges, not a cell type)
- Cycles permitted in topology
- Cycle execution with responsive UI (interruptible, user can always latch a connection to break a cycle)

**Design constraint (Gall):** The execution engine must be architecturally cycle-aware from Phase 1a, even though cycles are disabled until Phase 3. Topological sort as sole scheduling mechanism precludes cycles — design for cycle support from the start.
