---
status: rejected
date: 2026-04-05
reason: philosophical-audit
successor: signal-field
---

# Rejection Record

## Why This Spec Was Rejected

A philosophical audit roundtable (Gall, Korzybski, Hofstadter, Braitenberg) found that the two-type model (Signal + Synthesizer with internal composable pipeline) conserved the complexity of the original five-type system while hiding it behind fewer names. The Synthesizer's internal pipeline created a second composition system competing with the canvas — violating the spec's own center ("connection is the primary creative act").

Key findings:
1. The Synthesizer is not a primitive — it is a programmable meta-component (a rack, not a module) named as if it were a primitive
2. Three pipeline stage types (Prompt, Code, AI) are isomorphic to three of the five old node types — the spec renamed them but did not eliminate them
3. Behavior should live in the wiring (canvas connections), not in complex components — the pipeline restricts composition to sequential chains while the canvas enables arbitrary topology
4. The spec's self-description as a "simplification" was inaccurate — it is a re-encoding with conserved complexity and added architectural machinery

## Successor Spec

`.specs/features/signal-field/` — Three atomic primitives (Source, Code, AI) with canvas-only composition. Visual unification at rest. No internal pipeline. Behavior emerges from wiring.

## What Carries Forward

- The center holds with refinement: connection as primary creative act
- Visual unification at rest (compact cards, health dots, output previews)
- The Scope concept (expand a cell to edit it)
- The Mix view (compose terminal outputs)
- Design principles 1, 3, 4, 5 from the brief
- The four whiteboard sessions in factorio-node-patterns remain valuable deliberation
