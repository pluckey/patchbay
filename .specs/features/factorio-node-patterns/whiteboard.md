---
feature: factorio-node-patterns
center: "What interface allows the user to compose context as signal flow — arranging sources and effects into chains — such that the composition process itself generates insight about how context shapes AI interpretation?"
center_test:
  excludes: "A side-by-side diff view to compare AI outputs from different models — improves evaluation of results, not the granularity or visibility of the composition process"
  boundary: "A Prompt Template node with placeholder slots — decomposes prompt construction into a reusable primitive, but if the template node is itself monolithic (containing template syntax, variable binding, formatting logic, and output preview in one block), it violates the demand for single-purpose primitives. The center rejects 'smaller but still monolithic.'"
stage: whiteboard
intensity: deep
loop_iterations: 1
last_modified: 2026-04-05T00:00:00Z
---

## Context

The question arrives at a moment when AI context composition is largely invisible. In almost every AI tool today, users write a prompt — a linear document — and receive a response. They have no visibility into how context was assembled, what was included or excluded, or where meaning degraded. Context Canvas already breaks from this by making composition spatial, but its current nodes are large, self-contained units that cannot be decomposed or rearranged at the sub-node level.

Factorio represents a well-known exemplar of a different approach: a system where complexity emerges from the composition of simple, visible, single-purpose primitives. The game has become a reference point across disciplines for thinking about decomposition, flow visibility, and emergent design. Its cultural presence means the analogy is immediately legible to a technical audience.

The adjacent landscape includes visual programming tools (node-based editors for shaders, audio, data pipelines), notebook environments (linear but with discrete cells), and prompt-chaining tools (which automate flow but hide it). None of these combine spatial arrangement, visible flow, content inspection, and AI interaction in a single medium. The opportunity is to be the first tool where context composition is as visible and debuggable as a Factorio production line — but for meaning rather than material.

## Intent

The user sees their current workspace nodes as too large and too fixed. They cannot take a part of one node and move it independently. They cannot reuse a fragment of one configuration in another context. They experience the constraint of monolithic design: each node is a finished product rather than a composable component.

The picture in the user's head is the Factorio factory floor: dozens of small, single-purpose machines connected by visible pathways, where you can trace any item from source to destination, where bottlenecks announce themselves spatially, and where solving a new problem means rearranging existing pieces rather than building a new monolith. They want that feeling — the freedom of small composable parts, the satisfaction of visible flow, the power of emergent solutions — applied to the task of composing context for AI.

They are asking: can I break my five big node types into a larger set of smaller, single-purpose primitives that compose to produce the same results but offer more flexibility, more reuse, and more visibility into what is happening at each stage?

## Assumptions

**The user assumes that Factorio's decomposition model transfers to context composition.** This is partially true but structurally misleading in specific ways:

- Factorio items are **fungible and discrete** — one iron plate is identical to any other. Context fragments are **unique and semantically rich**. Decomposition of fungible items is lossless; decomposition of meaning risks semantic degradation at every junction.
- Factorio machines are **deterministic** — same inputs always produce same outputs. AI nodes are **stochastic** — the same context can produce different results. This means Factorio-style debugging (trace the inputs, find the missing ingredient) only partially applies.
- Factorio throughput is **quantitative** — you can measure items per second. Context "throughput" is **qualitative** — you cannot measure meaning per second. The "belt speed" metaphor does not transfer.

**The user assumes that smaller primitives automatically mean better composability.** This holds for deterministic, fungible systems. For semantic systems, smaller primitives can mean MORE junctions where meaning is transformed, and each transformation is an opportunity for semantic drift that is invisible until the final output.

**The user assumes the Factorio factory metaphor maps to a "content factory."** The deeper analogy is actually to a craftsman's workshop — spatial arrangement of meaningful materials for a purpose. Factorio is a game about optimizing production; Context Canvas is a tool for understanding and communicating meaning. The "factory" frame risks importing optimization concerns (throughput, efficiency, automation) that are irrelevant or harmful to a sense-making tool.

**Mental models in play:**
- Factory production line (explicit in the request)
- Lego bricks — small general pieces that snap together in unanticipated ways (implicit desire)
- Craftsman's workshop — spatial arrangement of materials for a specific purpose (what the tool actually is)
- Visual programming (node-and-wire paradigm already present in the canvas)

## Design Tensions

**1. Visibility vs. Friction (McLuhan's Reversal)**
More primitives means more visible flow but also more arrangement work. In Factorio, arranging the factory IS the game — players enjoy it for hundreds of hours. In Context Canvas, arranging the pipeline is a MEANS to composing context, and if it becomes the primary activity, the tool has failed. Every additional primitive type increases the cost of arrangement. The tension: maximum visibility of meaning flow requires many small pieces; minimum friction requires few large ones.

**2. Decomposition vs. Observability at AI Boundaries (von Foerster's Paradox)**
Decomposing a monolithic Chat node into separate "system prompt," "context assembler," "model selector," and "response parser" primitives makes each piece simpler. But the user's ability to understand what the AI received and why it responded as it did DECREASES, because they must now trace through four nodes and mentally reconstruct the full input. For deterministic operations, decomposition always improves observability. For AI-mediated operations, decomposition can REDUCE it.

**3. Emergence vs. Predictability (Hofstadter vs. Korzybski)**
Small, general primitives enable unexpected compositions — users discover workflows the designer never imagined. This is the "strange loop" aspiration: the system becomes more than the sum of its parts. But meaning is not like logic gates; unexpected compositions of semantic content can produce nonsense as easily as insight. The user who joyfully discovers an unexpected Factorio production chain is working with deterministic machines. The user who joyfully discovers an unexpected context composition may find it produces brilliant results once and garbage the next time, because AI is stochastic.

**4. Flat Visibility vs. Adaptive Granularity (McLuhan vs. von Foerster)**
McLuhan argues for one level of composition where everything is visible — no nesting, no hiding, no black boxes. Von Foerster argues that different users need different grain sizes and the system must support grouping and abstraction to scale. Both are right about different scales: for a workspace with 10-20 nodes, flat visibility works. For a workspace with 100+ nodes, grouping becomes essential. But grouping introduces opacity, and opacity is exactly what this tool exists to eliminate.

**5. The "Main Bus" Question (emergent patterns)**
Factorio's most celebrated pattern — the main bus — emerged because items are fungible and reusable. Is there an equivalent in context composition? Some context IS reusable across multiple AI interactions: persona definitions, style guides, domain knowledge, system prompts. A "main bus" of shared context feeding into multiple processing nodes is structurally plausible. But other context is deeply specific to a single interaction. The tension: should the tool optimize for reusable shared context (encouraging the main-bus pattern) or for bespoke one-off compositions? These suggest different primitive designs.

## Open Questions

**Unresolved panel disagreement: Nesting and encapsulation.**
Von Foerster argues that the system must support spatial grouping (visual clustering of related primitives into named regions) to manage complexity as workspaces grow. McLuhan argues that ANY form of grouping introduces opacity and that the tool's core value proposition is making everything visible. Von Foerster's compromise — allow visual grouping without semantic encapsulation (you can organize spatially but never hide internals) — was tentatively accepted but McLuhan maintained that even visual grouping creates cognitive "containers" that users stop looking inside. This is unresolved and will likely depend on observed workspace sizes in practice.

**Where are the cognitive joints?**
The panel agreed that decomposition should follow "cognitive joints" — natural seams in how humans think about context. Hofstadter proposed three: (a) the boundary between what the AI should KNOW (context/knowledge) vs. what the AI should DO (instruction/task), (b) the boundary between raw source material and processed/summarized material, and (c) the boundary between content authored by the user and content generated by AI. These are plausible but unvalidated. Are these the joints users actually experience? Are there others? This requires observation, not theory.

**How do you show semantic effects?**
Korzybski insisted that every transformation of content must show its SEMANTIC effect, not just its mechanical operation. A node that concatenates two text inputs is performing a semantic operation — the juxtaposition creates new implied relationships. But how do you show the semantic effect of concatenation? Of filtering? Of reordering? The panel agreed this is essential but offered no concrete approach. It may require that every junction point show a preview of its output content, which has significant implications for workspace density and visual noise.

**Does the stochastic nature of AI invalidate pipeline debugging?**
Korzybski raised but the panel did not fully resolve: in Factorio, tracing a problem means following the deterministic chain until you find the missing input. In a context pipeline with AI nodes, the same inputs can produce different outputs on different runs. Does this make pipeline-style debugging fundamentally unreliable for AI-mediated transformations? Or is the visibility still valuable even when the system is non-deterministic?

**What do users actually want to detach?**
McLuhan's final statement proposed that the right primitives are discovered bottom-up: observe what parts of current monolithic nodes users want to move, reuse, or rearrange independently. The panel agreed this is more reliable than top-down design from Factorio analogies. But it requires user research that may not exist yet. Candidates proposed by the panel: system prompts (detach from Chat nodes for reuse), output schemas (detach from AI Transform nodes), model/provider selection (detach as a shared configuration), and text filters/formatters (detach from Transform nodes as separate pipeline stages).

## Alternatives Considered

**Alternative 1: Keep monolithic nodes, add inter-node features.**
Instead of decomposing nodes, add features like "link this Chat node's system prompt to that Markdown node's content." This preserves the current mental model (five node types, each self-contained) while adding cross-references. The panel's assessment: this addresses reuse but not visibility. The user's frustration is not just about reuse — it's about being unable to see and intervene in the stages of context assembly. Rejected as insufficient.

**Alternative 2: Full Factorio-style decomposition into micro-primitives.**
Create 15-20 primitive types: Source, Filter, Concatenator, Splitter, Router, Formatter, Prompt Builder, Model Endpoint, Response Parser, Schema Validator, etc. Every operation is its own node type. The panel's assessment: this maximizes composability and visibility of flow but falls into McLuhan's reversal — the pipeline becomes the primary cognitive object and content becomes secondary. The assembly tax will exceed the assembly value for most users. Rejected as overreach.

**Alternative 3: Modest decomposition along cognitive joints.**
Identify 2-3 natural seams in the current monolithic nodes and create new primitives ONLY at those seams. Candidates: separate "content source" from "content processor" from "AI endpoint." Keep each new primitive content-visible (the node always shows what it contains). Add visible flow between them. This is the panel's preferred direction — it imports Factorio's principle of visible flow and single-purpose primitives without importing its complexity tax.

**Alternative 4: Plugin/recipe system instead of decomposition.**
Instead of breaking nodes into smaller pieces, let users define RECIPES — saved configurations of how nodes should interact. Analogous to Factorio's blueprints but applied to the current monolithic nodes. The panel's assessment: this addresses reuse and templates but does not address the core visibility problem. It's a useful feature but doesn't serve the center.

## Non-Functional Context

**Audience:** Knowledge workers who compose context for AI systems — researchers, writers, analysts, developers building prompts and pipelines. These are people who think spatially and prefer visible systems over opaque automation. They are not casual users; they are willing to learn a tool if it gives them genuine capability.

**Scale:** Current workspaces contain roughly 5-30 nodes. Decomposition will increase this count. If a Chat node decomposes into 3 primitives, a workspace of 10 Chat nodes becomes 30 nodes. The canvas must remain navigable at 50-100 nodes without overwhelming the user. This puts a practical upper bound on decomposition granularity.

**Timeline pressure:** The question is exploratory, not urgent. The user is seeking the right conceptual frame before committing to structural changes. This is a "think twice, build once" moment. Premature decomposition of the node model would be expensive to reverse because it touches every layer of the system.

**Performance consideration:** More nodes means more rendering, more connections, more persistence operations. The spatial medium must remain responsive. Factorio solves this through aggressive spatial chunking and level-of-detail rendering. A context workspace needs similar strategies if node counts increase significantly.

**The reversal threshold:** The panel identified but could not quantify the point at which composition overhead exceeds composition value. This threshold is different for different users and different tasks. A user composing a simple prompt should not need more than 2-3 nodes. A user building a complex multi-stage research pipeline might tolerate 30-50 nodes. The decomposition design must serve both ends of this spectrum, which likely means the smaller primitives should be AVAILABLE but not REQUIRED — users should be able to work with the current monolithic nodes when they want simplicity, and decompose into primitives when they want control.

---

## Reconvened Session: The Right Analogy

The panel was reconvened after the user pushed back: "Maybe Factorio was the wrong analogy. If so, what game IS the right one? What about 'breadboard for AI applications'?"

### Analogy Evaluation

| Analogy | What it captures | What it misses | Verdict |
|---|---|---|---|
| **Factorio** | Nodes, connections, flow (surface only) | Meaning, context-dependence, interpretation, reflexivity | **Rejected** — systematically misleads |
| **Breadboard** | Prototyping stance, modularity, visible wiring, neutral substrate, exists-to-produce-something-beyond-itself | Context-dependent components, stochastic interpretation, meaning emergence | **Primary metaphor** — least wrong, most useful as entry point |
| **Laboratory** | Experimental iteration, observer-in-system, hypothesis testing | Building/construction aspect, modular recombination | **Secondary metaphor** — governs the *activity* |
| **Editor's desk** | Meaning from juxtaposition, composing for interpreter, granularity judgment | Pipeline/flow dimension, standardized interfaces | **Tertiary metaphor** — governs *granularity decisions* |
| **Musical score** | Composing for stochastic interpreter, context-dependent meaning | Temporality (scores are sequential; context is simultaneous) | Illustrative only |
| **Collage/montage** | Meaning emergence from juxtaposition (Kuleshov effect) | Pipeline processing, provisionality | Illustrative only |
| **Mixing desk** | Spatial composition, emergent properties, processing chains, mute/solo | Domain-specific (audio), not widely understood | Illustrative only |
| **Any game** | Engagement, discovery, creative play | Win conditions, scoring — Context Canvas has neither | **No game analogy is structurally adequate** |

### The Breadboard Assessment

**Where it succeeds:**
1. **Prototyping stance** — you are figuring something out, not building something permanent
2. **Modularity and swappability** — components plug in, can be pulled out, replaced
3. **Visible wiring** — all connections are on the surface, traceable, inspectable
4. **Neutral substrate** — the breadboard has no opinion about what you build
5. **Beyond-itself teleology** — the breadboard is scaffolding, not the product
6. **Self-correcting reversal** — when wiring becomes the primary activity, breadboard users recognize it as a problem

**Where it misleads:**
1. **Context-independence of components** — a resistor behaves the same regardless of neighbors; a context fragment means something different depending on what surrounds it
2. **Deterministic outcomes** — circuit testing is binary; context testing has gradations
3. **Quantifiable signals** — electrical signals are measurable; information flow is qualitative
4. **Possible scope misread** — "AI applications" might suggest prototyping the app, not the context

**Panel judgment:** The successes outweigh the mismatches. The failure modes are correctable through experience with the tool.

### Recommended Frame (Three Layers)

**External communication:** "Breadboard for AI applications"
- Use when explaining the tool to someone who has never seen it
- Instantly communicates: prototyping, modularity, visible connections, not-the-final-product

**Internal design principle:** "Experimental workbench where the components carry meaning"
- Use when making decisions about what to build, what granularity, what features to add
- Reminds builders that components are meaningful fragments whose significance depends on arrangement

**Granularity guide:** "Edit at the level an editor would cut"
- Use when deciding how fine-grained decomposition should be
- Editors cut along cognitive joints — at the boundaries where the *idea* changes

### The Game Question — Resolved

The panel concluded definitively: **no game captures Context Canvas because Context Canvas is not a game.** It is a workspace. The right analogy category is instruments, workbenches, and studios — not games. The instinct to seek a game analogy contains a useful signal (engagement, discovery, creative play) but no game analogy is structurally adequate.

### Design Implications from the Breadboard Frame

1. **Components should be chunky, not granular.** On a breadboard, you plug in integrated circuits, not individual transistors. The current five node types are at approximately the right level. Resist the urge to decompose further.
2. **Connections should be simple and visible.** A directed edge with a label is sufficient.
3. **The substrate should be neutral.** No templates, no suggested arrangements. Spatial freedom is the feature.
4. **Debugging should be probe-based.** Inspect what data flows through any connection at any point.
5. **Nothing is permanent.** Optimize for easy rearrangement, easy addition, easy removal.
6. **The tool is not the product.** Make it easy to export results, not just build within the canvas.

### Reconvened Open Questions

1. **"AI applications" vs. "AI context"** — "AI context" is more precise but less ambitious. Panel was split.
2. **The Kuleshov effect gap** — same content in different context produces different interpretation. No metaphor in the recommendation foregrounds this. Should it be explicitly taught to users?
3. **When does prototyping end?** — the breadboard implies a transition to "production." What is the equivalent? Or is the canvas the ongoing workspace, never graduating?
4. **Eigenform risk** — if the breadboard metaphor attracts prototyper-engineers and repels composer-editors, the tool's user community may skew toward the systematic and away from the compositional.

---

## Reconvened Session II: The Teenage Engineering Provocation

The panel was asked: "If Teenage Engineering were tasked with creating a canvas node, what would they create?"

### The TE Node

TE would create a **universal primitive called a "cell."** Every cell looks the same on the surface: a compact tile with a **signal indicator** showing content density and flow state. No toolbar. No tabs. No chrome. The circuit board IS the product.

One primary surface control: **aperture** — a continuous adjustment that determines how much of the cell's content flows to connected cells. The control IS the decoration IS the function, like EP-133 faders printed on the PCB.

You create a cell. You type into it, paste into it, drop a file onto it. The cell adapts its internal behavior based on what you put in — text becomes editable text, code becomes executable, a PDF becomes viewable. But the external form stays the same. One primitive. Modal behavior determined by content, not by user selection from a menu.

**Focused state:** Click into a cell and it expands. Everything else recedes to signal-indicator form. The focused cell shows a constrained editing interface — radically simpler than the current nodes.

**At-rest state:** The cell shows its signal indicator and its aperture setting. The canvas reads as a signal-flow diagram — tiles with levels, connected by visible paths.

**Live context preview:** The cell's primary display mode shows not the raw content but the content AS THE AI WILL SEE IT — aperture-filtered, connection-resolved, upstream-integrated. You are always looking at the signal, not the source.

### Design Principles Extracted

1. **One primitive, modal behavior.** Do not multiply node types. Create one universal form whose behavior adapts to content. The OP-1 has one screen and four encoders; meaning shifts by mode.
2. **Constraint is observation.** Every control you place on the surface is a declaration about what matters creatively. Model selectors and schema builders declare that infrastructure choices are creative acts. They are not. Remove them from the surface.
3. **Signal, not source.** The primary display shows the node's contribution to context, not its raw content. You are mixing signals, not editing documents.
4. **Gesture depth, not visual surface.** Complexity lives in interaction layers (tap, double-tap, long-press, drag-edge) rather than in visible buttons and dropdowns.
5. **Immediate feedback on the controllable loop.** You cannot get instant AI response, but you CAN get instant preview of what the AI will receive.
6. **The drawing is the function.** Zero gap between representation and mechanism. The text IS the context. The line IS the signal path. The arrangement IS the composition.
7. **Figure/ground discipline.** One cell is figure at a time. Everything else is ground. The canvas has two visual modes — diagram (all cells at rest) and editor (one cell focused).

### What Gets Removed

- **Node type selection.** No menu of "Add Markdown Node / Add Chat Node." You add a cell. The cell adapts.
- **Model selector dropdowns.** Deferred to secondary gesture or intelligent default. Not a creative parameter.
- **Schema builders.** Hidden entirely or accessed through configuration gesture.
- **Timeout configuration.** Removed from surface, handled by sensible defaults.
- **Tab bars** (Edit/Preview). The cell shows the signal by default. Editing is accessed by focusing.
- **Toolbars** (bold, italic, heading). Accessed through keyboard shortcuts or gesture, not visible chrome.
- **Zoom/page navigation on PDF nodes.** Deferred to focused-state interaction.
- **Auto-execute toggles, input/output mode toggles.** Intelligent defaults with override via gesture.
- **Resize handles.** Fixed compact form at rest. Focused state expands automatically.

### What Gets Surfaced

- **Aperture control.** Currently invisible — a node sends everything or nothing. TE would make this the primary surface control: how much content flows downstream, and which portion.
- **Signal indicators.** Content density, flow state, activity status — visible at a glance on every cell without focusing.
- **Live context preview.** What the AI will actually see from this cell, with all scoping and upstream resolution applied. Currently, users must mentally simulate this.
- **Connection flow direction and volume.** Wires between cells would visually indicate what is flowing and how much. Not abstract graph edges but signal paths with visible content indicators.
- **The circuit board.** The underlying structure of the composition — signal routing, data flow, dependency graph — visible as the canvas's own texture.

### The Single-Primitive Question

**TE would make one node type.** The panel reached consensus through multiple converging arguments:

- **TX-6 mixer analogy:** A mixer channel is a single primitive; what varies is the signal, not the channel. Context Canvas cells are channels for context signals.
- **OP-1 argument:** One physical interface serves all modes. The form is constant; the meaning shifts.
- **Structural argument (Korzybski):** All current node types share the deep structure CONTENT → SCOPED → TO-PRODUCE-CONTEXT. The surface differences are signal differences, not channel differences.
- **Strange loop argument (Hofstadter):** Content determines behavior and behavior shapes content. A single adaptive primitive captures this co-determination naturally; multiple fixed types force premature classification.

### Tension with Current Design

1. **Five types vs. one primitive.** Current architecture has separate components with distinct interfaces. TE demands a single adaptive component.
2. **Rich editing surfaces vs. signal display.** Current nodes prioritize content editing. TE prioritizes signal display — the cell primarily shows its contribution to context.
3. **All-visible vs. focus discipline.** Current nodes show full interface at all times. TE demands that only the focused cell shows its editing interface.
4. **Explicit configuration vs. intelligent defaults.** Current nodes expose model selectors, schema builders, timeout fields. TE hides these behind gesture layers.
5. **Neutral canvas vs. active medium.** The panel suggested spatial proximity as signal strength, making the canvas itself an active component.
6. **Connection-drawing vs. proximity-sensing.** TE approach suggests spatial proximity could serve as implicit connection, reducing explicit wiring work.

### Metaphor Evolution

The three-layer metaphor system evolves:
- **External pitch:** "breadboard for AI applications" (unchanged)
- **Internal design guide:** shifts from "experimental workbench" toward **"mixing surface for context signals"**
- **Granularity guide:** shifts from "edit at the level an editor would cut" toward **"scope at the level the aperture controls"**

### TE Session Open Questions

1. **Is the single primitive viable for code execution?** A transform that takes inputs and produces outputs through code has genuinely different interaction requirements from a text node. Can a single cell UI serve both?
2. **Aperture granularity.** Contiguous selection is clean, but users might want paragraphs 1, 3, and 5 but not 2 and 4. Does aperture need discontinuous selection?
3. **Spatial proximity as connection.** McLuhan proposed implicit connection via proximity. Korzybski flagged structural ambiguity. Unresolved.
4. **The secondary gesture layer.** Complexity was repeatedly deferred to gestures. How deep can gesture layers go before they become the hidden menus TE explicitly rejects?
5. **AI feedback latency.** The outer loop (AI response) cannot achieve instrument-speed immediacy. Live context preview solves the inner loop. Is there a mechanism for the outer loop?
6. **Power user escape hatches.** TE products serve people who embrace constraint. Context Canvas may need to serve users who want direct access to configuration. The OP-1 does not have a "pro mode." Is that viable for a professional tool?

---

## Reconvened Session III: The Signal Chain Product Design

User confirmed key reframes: (1) context = signal, transforms = knobs on the signal; (2) at rest = net result, focused = all controls; (3) modal editor expansion was already being designed out of practical necessity (Monaco editor performs poorly in small nodes); (4) go as far as the thought experiment requires.

### The Signal Chain Model

Context flows like signal through a chain:
- **Source cells** originate signal from content the user provides (text, PDF, code)
- **Effect cells** receive signal and transform it (AI instruction, JS function, concatenation)
- The distinction is not a property of the cell — it's a **role** determined by topology. A cell with no inputs is a source. A cell with inputs is an effect. Same primitive.
- The chain is a directed acyclic graph with branching and merging, not a linear pipeline
- The chain terminates at observation points — the composed context the AI receives
- The user is embedded in a feedback loop: arrange → observe output → adjust → observe again

### Source Cells

**At rest:** Displays the rendered output of its content (formatted markdown, PDF thumbnail, syntax-highlighted code). Cropped to cell size. Three surface elements only:
1. Output text (dominant — fills the cell)
2. Pulse dot (upper-right, 6px, colored: green=current, amber=stale, red=error)
3. Output port (subtle dot at bottom/right edge)

No title bar, no type label, no toolbar. The content IS the interface.

**Focused (the Scope):** Opens as modal overlay commanding the screen. Two-region layout:
- **Center:** Full content editor (Monaco for code, rich text for markdown, document viewer for PDF)
- **Right:** Output preview — what downstream cells will receive
- **Left:** Empty — no inputs for a source. The asymmetry reinforces the cell's role.

### Effect Cells

**At rest:** Displays the **output signal** — the transformed result, not the transform instruction. If the cell summarizes three inputs into bullet points, you see the bullet points. The transform logic is invisible at rest. Same three surface elements plus input ports at top/left edge.

Mode indicator: subtle typographic shift (monospace for effect instruction vs. rendered for source content) visible in the cropped output.

**Focused (the Scope):** Three-column layout making the full signal path visible:
- **Left:** Input signals, ordered, each labeled. User can reorder by dragging.
- **Center:** Transform editor (AI instruction textarea, JS code editor, or empty for pass-through)
- **Right:** Output preview, live-updating as the user modifies the transform

### Routing

- **Fan-out:** One source to many effects — draw multiple lines from one output port. Signal is shared.
- **Fan-in:** Many sources to one effect — the effect cell gains multiple ordered input ports. Default combination: concatenation in port order. Transform instruction can reference specific inputs.
- **Input order is always visible and user-controllable.** Ports are numbered. Focused view shows inputs in delivery order. Reordering is a drag gesture. (Korzybski's non-negotiable: the user must never be surprised by context assembly order.)

### Vocabulary

| Concept | Term | Rationale |
|---|---|---|
| The canvas | **Field** | Spatial, not technical |
| The universal primitive | **Cell** | TE's grid units. Biological: a living unit |
| What flows between cells | **Flow** | Intuitive, directional. "Signal" is too technical for UI |
| The focused/expanded view | **Scope** | Short for oscilloscope. Examining closely |
| The composed output preview | **Mix** | What the AI receives. The final composition |
| The health indicator | **Pulse** | Is this cell alive and current? |
| Connections | **Lines** | Not "edges" or "wires" |

Panel caution: audio/optical terminology (signal, modulator, aperture) is fine for design thinking but should NOT appear in the product UI. Domain-neutral vocabulary above.

### The Two States — Detailed

**At Rest (the Field view):**
- Every cell shows output, pulse, ports. No chrome.
- Semantic zoom: zoomed in = content readable, zoomed out = cells shrink to pulse + port diagrams, topology becomes the figure
- The canvas reads as a signal-flow diagram at distance, a content workspace up close

**Focused (the Scope):**
- Modal overlay, three-region layout (input | editor | output)
- Source cells: editor + preview (left empty)
- Effect cells: input signals | transform editor | live output
- Close with Escape or click-outside. Transition feels like focusing/defocusing — an aperture opening and closing.

### The Product TE Would Ship

**First launch:** Empty field. Warm gray background. Bottom dock: one "+" icon, one "Mix" icon. Two controls.

**Creating a cell:** Tap "+". Cell appears, cursor blinking. Type. The cell shows rendered text. You've created a source without knowing the word "source."

**Making a connection:** Drag from cell 1's output dot to cell 2. Three things happen: (1) line appears, (2) cell 2's display shifts to monospace (mode indicator), (3) cell 2's display changes from instruction text to computed result. The user learns: connected cells show output, not instruction.

**Focusing:** Click cell 2. Scope opens: left shows cell 1's content, center shows the instruction editor, right shows live result. Edit instruction, watch output change in real time. Close Scope. Cell 2's at-rest display updates.

**The Mix:** Tap Mix icon. Overlay shows the final composed context — all terminal cells' outputs concatenated in spatial order. The full picture of what the AI will receive.

**Information hierarchy on cell surface:**
1. Output text (dominant)
2. Pulse dot (6px, colored)
3. Ports (4px, subtle)

Three levels. No more.

**Gestures:**
- Click cell → open Scope
- Drag from port → create line
- Drag cell → reposition
- Double-click line → delete
- Pinch/scroll → semantic zoom
- Keyboard shortcut in Scope → toggle source/effect mode
- Drag inputs in Scope → reorder

**What TE would NOT include:** No node type selector, no property panels, no minimap, no undo button on surface, no visible grid, no color coding by type.

### Center Revision

The panel proposes a final revision:

> "What interface allows the user to compose context as signal flow — arranging sources and effects into chains — such that the composition process itself generates insight about how context shapes AI interpretation?"

The shift: from "how do we keep arrangement from being burdensome" to **"how do we make arrangement BE the thinking."** The signal chain model transforms arrangement from overhead into creative instrument. The user is not doing administrative work when connecting cells — they are making structural decisions about what to include, how to transform it, what order it arrives in.

### Session III Open Questions

1. **AI execution model.** When does an AI effect cell execute? On every input change (expensive)? On manual trigger? On focus? Tension between immediate feedback and computational cost.
2. **Persistence of stale outputs.** If inputs change but transform hasn't re-run, show stale output with amber pulse? Or blank? Stale-with-indicator seems right but can mislead.
3. **The pass-through cell.** A cell with inputs but no content — concatenation point? Observation probe? Routing hub? Purpose unclear.
4. **Binary content in flow.** PDF is not text. Is flow always text (binary converted at source boundary)? Or typed signals (text, image, document)?
5. **Mix ordering.** Terminal cells read "left to right, top to bottom" — but canvas is freeform. Explicit ordering in Mix? Spatial heuristics?
6. **Multi-chain workspaces.** Can one field contain independent chains? Multiple Mix outputs? Parallel context compositions for comparison?
7. **Mode toggle discoverability.** Source/effect mode toggle is hidden. How does a new user learn it exists? The typographic shift must be visually clear enough to provoke curiosity.
8. **Collaboration.** Panel designed for single user. What happens with shared fields?

---

## Session IV: The Scope Transform Pane — Resolved

User confirmed the three-column Scope layout and refined the transform pane design through interactive mockup iteration.

### The Transform Pane Has Three Tabs

The center pane of the Scope (for effect cells) uses tabs to select the processing mode. The tabs describe what the cell DOES with flow, not what it IS:

**Passthrough** — reorder inputs (draggable list), set separator. The simplest intervention: just arrange and concatenate.

**Code** — full Monaco editor at proper dimensions. Deterministic JS transform against inputs. The modal Scope solves the existing problem of Monaco performing poorly in small embedded nodes.

**AI** — three sections, top to bottom:
1. **Model** (compact selector — at top, because you pick your instrument before you write the score)
2. **Instruction** (textarea — the prompt that governs the transformation)
3. **Schema** (collapsible field builder — collapsed by default, optional)

### Schema Presence IS the Mode

No separate "prose vs. structured" toggle. No `outputMode` or `schemaMode` split:
- **No schema defined** → AI returns prose → flow carries a string
- **Schema defined** → AI returns structured JSON → flow carries an object/array

The schema's shape determines the output format. The user never explicitly chooses "text mode" or "structured mode" — they either define a schema or they don't. One less decision.

### Output Pane Adapts to Schema

The right output pane for AI mode:
- **No schema** → rendered prose text
- **Schema defined** → table view (default) with typed column headers, or JSON view (toggle). Inline error indicators on fields that fail validation (red "missing required", "expected number", etc.)

Parse/validation errors are shown IN the output pane, next to the data — not as modal dialogs or toasts. Probe-based debugging.

### Source Cell Scope

For source cells (no inputs), the tabs don't appear at all — there's nothing to transform. The Scope shows content editor + output preview. Two columns, not three.

### Implementation Decisions

- **Schema builder:** Keep existing `SchemaBuilder.tsx` component, relocate into the Scope's AI tab. Custom is simpler than a library for this interaction.
- **JSON object viewer:** `react-json-view-lite` — zero deps, lightweight, read-only. Used in the output pane's JSON toggle view.
- **Table view:** Custom renderer driven by schema fields + result data. No library needed.

### Mockup

Interactive prototype at `src/app/mockup/page.tsx` — uses shadcn Tabs + Button components, shows all three transform modes with the three-column layout.
