# Signal Field

Context Canvas becomes a signal field — three atomic primitives wired on a spatial canvas. Behavior emerges from wiring, not from component complexity.

## Predecessor

This spec supersedes `.specs/rejected/semantic-synthesizer/`, which proposed a two-type model (Signal + Synthesizer with internal composable pipeline). That design was rejected because the pipeline created a second composition system competing with the canvas, conserving five-type complexity behind a two-type facade. The full rejection record and deliberation that led here is in `.specs/rejected/semantic-synthesizer/REJECTED.md`.

## The Primitives

Three irreducible cell types. Each does one thing. No internal pipeline. No modal behavior. No deferred classification.

**Source** — Identity function. No input port. Emits content: text, PDF, structured data, any artifact. The sensor.

**Code** — Deterministic transform. Receives inputs, runs user-written JavaScript, emits result. The direct wire.

**AI** — Stochastic transform. Receives inputs, sends instruction + inputs to an LLM, emits generated text or structured data. Model, instruction, optional schema are parameters. The probabilistic wire.

### Why Three

- Source (identity) cannot be expressed as Code or AI without absurdity.
- Code (deterministic) and AI (stochastic) are computationally irreducible to each other. The discontinuity is in the territory, not the map.
- These three cannot be collapsed further without losing a real distinction.

### Why Not More

- Markdown and PDF are both Sources — the distinction is content type, not transfer function.
- Chat (conversation) is a bidirectional interaction protocol, not a transfer function. It belongs at the workspace level (a panel/overlay on any cell), not as a cell type.
- AiTransform and Chat differ in statefulness and output mode — both are parameters of the AI primitive, not separate primitives.
- Passthrough (concatenation) is just a Code cell with trivial code, or the default behavior of fan-in. Not a primitive.

## One Composition Mechanism

Directed canvas edges with fan-in and fan-out. This is the ONLY composition mechanism. There is no internal pipeline, no stage sequencer, no second composition system.

**Fan-in semantics:** When multiple cells connect to one cell's input, the receiving cell gets a keyed object: `{ [sourceTitle]: output, ... }`. Input ordering is user-controllable.

**What emerges from wiring (no special constructs needed):**

| Behavior | Wiring Pattern |
|----------|---------------|
| Pipeline | Source -> AI -> Code -> AI (serial chain) |
| A/B comparison | Source => AI(model_a) + AI(model_b) => Code(diff) |
| Multi-doc synthesis | N x Source => AI(synthesize) |
| Chain of thought | Source -> AI(think) -> AI(refine) -> AI(finalize) |
| Schema validation | AI(generate) -> Code(validate) -> AI(fix) |
| Template interpolation | Source(template) + Source(data) -> Code(merge) |
| Structured extraction | Source(doc) -> AI(with schema) |

## Visual Unification at Rest

All cells present as identical compact cards on the canvas:

- **Title** — user-editable label
- **Health dot** — green (current), amber (stale), red (error)
- **Output preview** — truncated rendering of the cell's current output
- **Ports** — Source: output only. Code/AI: input + output.

No type badges, no type-specific coloring, no configuration visible at rest. The output preview and port topology implicitly reveal function. The canvas is calm — a field of uniform signal indicators.

## The Scope

Click a cell to expand into a 3-column Scope:

```
┌─ Inputs ──────┐  ┌─ Editor ──────────────────────┐  ┌─ Output ─┐
│                │  │                                │  │          │
│  Connected     │  │  Type-specific editor:         │  │  Cell's  │
│  inputs with   │  │  - Source: text editor or PDF  │  │  current │
│  drag-reorder  │  │  - Code: JS editor             │  │  output  │
│                │  │  - AI: instruction + model +    │  │          │
│  (empty for    │  │        optional schema          │  │  Health  │
│   Source)      │  │                                │  │  + time  │
│                │  │                                │  │          │
└────────────────┘  └────────────────────────────────┘  └──────────┘
```

One cell open at a time. Stable layout for all types. Input panel empty for Sources.

## The Mix

One button shows composed output of all terminal cells (cells with no outgoing connections). Closes the feedback loop: the user sees exactly what the entire signal field produces.

## Chat as Meta-Layer

Users can invoke a chat assistant on any cell. The AI helps configure the cell — suggesting code, refining prompts, explaining behavior. This is orthogonal to the signal graph. It lives in a panel/overlay, not as a cell type. History is ephemeral (component state).

## Three-Phase Delivery

**Phase 1 — Visual Unification** (low risk, no entity changes)
Unify all existing 5 node types behind identical compact cards. Type-specific UI appears only on expansion. No migration. Delivers the aesthetic immediately.

**Phase 2 — Primitive Reduction** (moderate risk)
Reduce 5 types to 3: Source, Code, AI. Migration: Markdown->Source, PDF->Source, Transform->Code, AiTransform->AI, Chat->legacy (creation disabled). The pipeline construct does not exist — multi-stage composition is multiple cells wired on the canvas.

**Phase 3 — Composites** (optional, gated on observed need)
Select cells -> group into composite -> collapses to single card, expands inline. One level of nesting. Only pursue if Phase 2 users demonstrate the need for organizational structure beyond spatial proximity.

## Design Principles

1. **Behavior lives in the wiring.** The simplest correct primitives, correctly wired, produce richer emergence than complex primitives with constrained wiring.
2. **Signal, not source.** Cells show output (what came out), not instruction (what you told it to do).
3. **Honest naming.** Source cells source. Code cells compute. AI cells generate. No type claims to be what it isn't.
4. **One composition grammar.** The canvas is the only composition mechanism. No internal pipelines, no nested sequencers, no competing systems.
5. **Figure/ground discipline.** One cell focused = full editor. Everything else = compact signal indicators.
6. **Constraint is observation.** Only creative parameters earn surface space.
7. **Evolve, don't design.** Each phase ships independently, delivers value independently, and is independently reversible.

## Origin

Four whiteboard sessions (`.specs/features/factorio-node-patterns/whiteboard.md`) + the semantic-synthesizer spec process (`.specs/rejected/semantic-synthesizer/`) + two philosophical audit roundtables that identified the pipeline as a competing composition system and converged on Braitenberg's vehicles framework for deriving the minimal primitive set.
