# Semantic Synthesizer

Context Canvas is a semantic synthesizer. The user composes meaning by routing context through chains of modules — not by writing documents.

## The Paradigm

**One primitive: the Cell.** No node type menu. You create a cell, put content in it. Its role is determined by topology — no inputs = source, has inputs = effect. Same interface either way.

**Everything is signal.** Context flows as JSON between cells. A source cell originates signal (text, PDF, data). An effect cell modulates signal (AI instruction, JS code, passthrough concatenation). The lines between cells are patch cables. What emerges from the patching is the composition.

**Two states.** At rest, a cell shows its output — what came out, rendered as JSON via a lightweight viewer. Pulse dot (green/amber/red) shows health. Ports show topology. No chrome. When focused, the cell opens into a modal Scope that reveals the full signal path: inputs | transform | output.

## The Scope

Three-column layout for effect cells: input signals (left, ordered, draggable) | transform editor (center) | live output (right).

Two-column layout for source cells: content editor | output preview.

The center pane has three tabs describing what the cell does with flow:

- **Passthrough** — reorder inputs, set separator. Arrange and concatenate.
- **Code** — full-size code editor. Deterministic JS transform.
- **AI** — model selector (top), instruction textarea, optional schema builder (collapsible). Schema presence IS the output mode: no schema = prose, schema = structured JSON.

Output pane adapts: prose renders as text, structured renders as table with type badges and inline validation errors. JSON view toggle available.

## The Mix

One button shows the composed output — all terminal cells' outputs, representing the full context the AI will receive. Closes the feedback loop: the user sees exactly what they're composing.

## What This Replaces

The current five monolithic node types (Markdown, PDF, Transform, Chat, AiTransform) with distinct UIs per type. Each is a finished appliance. The cell paradigm replaces them with a uniform module whose behavior adapts to content and connections — like a synthesizer module that accepts any signal and processes it according to its patch.

## Key Decisions Already Made

- `react-json-view-lite` for at-rest cell rendering and JSON output view
- Existing `SchemaBuilder.tsx` relocated into the Scope's AI tab
- Monaco editor in the Scope's Code tab (solves existing problem of Monaco performing poorly in small embedded nodes)
- Input ordering always visible and user-controllable
- Pulse dot: green = current, amber = stale (inputs changed, not re-run), red = error
- No node type selector, no property panels, no minimap, no resize handles at rest

## Design Principles

1. **Signal, not source.** Cells show output (what came out), not instruction (what you told it to do).
2. **One primitive, modal behavior.** The cell adapts to content. The user never classifies.
3. **Constraint is observation.** Only creative parameters earn surface space. Infrastructure (model, schema, timeout) lives in the Scope.
4. **Figure/ground discipline.** One cell focused = full editor. Everything else = compact signal indicators.
5. **The patching IS the thinking.** Connecting cells, reordering inputs, adjusting transforms — these are structural decisions about context made visible.

## Origin

Explored through four whiteboard sessions starting from Factorio patterns, evolving through breadboard metaphor, Teenage Engineering design provocation, and signal chain modeling. Full deliberation record in `.specs/features/factorio-node-patterns/whiteboard.md`.
