---
feature: missing-primitives-discovery
stage: whiteboard-extension
topic: lower-level primitives analysis
last_modified: 2026-04-04T14:00:00Z
---

# Lower-Level Primitives Analysis

## The Core Argument

The current system has the wrong number of primitives at the wrong level of abstraction:
- Too many at the surface level (5 specialized node types)
- Too few at the structural level (1 undifferentiated edge type)
- Zero at the compositional level (no way to compose primitives into new primitives)

This is equivalent to a programming language that ships with built-in functions for specific tasks but has no way to define new functions. The 19 identified gaps are the next 19 functions users are asking for. The real solution is not to build those 19 — it is to provide function definition as a primitive.

## Decomposition of Current Node Types

Every current node type decomposes into four identical structural slots:

| Slot | Markdown | PDF | Transform | Chat | AI Transform |
|---|---|---|---|---|---|
| Content | User text | Doc reference | User code | Conversation | Instruction |
| Process | Identity | Extraction | Code execution | LLM converse | LLM apply |
| Interface | Rich editor | Doc viewer | Code editor | Chat UI | Instruction field |
| Port behavior | Emit content | Emit text | Named in → result | Context in → response | Named in → result |

Five names for five configurations of one four-part structure.

## Six Proposed Compositional Primitives

### 1. The Cell
Universal container with Content + Process + Interface. Every entity on canvas is a cell. Current node types become pre-configured cell templates.

### 2. The Channel
Directed connection with Label + Type + Mode + Transform. Replaces the single labeled edge. Inline transforms eliminate "passthrough" nodes. Conditional routing becomes a channel property.

### 3. The Frame
Compositional boundary enclosing cells/channels, presenting as a single cell externally. Defines input/output ports. Enables recursive composition — function definition for the spatial canvas.

### 4. The Region
Spatial zone with behavioral properties affecting everything within it. Unlike frames (functional composition), regions are contextual composition — shared properties while contents stay visible.

### 5. The Reference
Non-flow pointer allowing cells to read other elements' state, including graph structure. The INDIRECT() of Context Canvas. Minimum viable strange loop — bounded meta-awareness.

### 6. The Constraint
Declarative rule on any element limiting what's permissible. Defines the grammar of composition. Makes structural rules visible and editable.

## Design Spectrum

```
MOST GENERAL                                              MOST SPECIFIC
Universal → Structural → Compositional → Functional → Solution
Machine     (3 prims)    (6 prims)       (5+1 current) Templates

Expressiveness: MAX -------- HIGH ------- MODERATE ----- ZERO
Usability:      ZERO ------- LOW -------- HIGH --------- MAX
Defensibility:  NONE ------- LOW -------- HIGH --------- NONE
```

Current system: Level 3 (Functional). Proposal: Level 2 (Compositional).
Defensibility peaks at Level 2.

## Gaps Subsumed

The 6 primitives subsume or enable most of the 19 gaps:
- Cell → structured data, export, web content, image nodes
- Channel → content filtering, conditional routing, sequence control
- Frame → grouping, composites, parameterized inputs, templates, run history
- Region → grouping (spatial), scoped configuration, annotations
- Reference → pipeline inspection, run history access, meta-awareness
- Constraint → structured output, validation, type visibility

## Phasing Recommendation

1. Refactor internally — make 5 node types configurations of universal cell (invisible to user)
2. Enrich connections — add type, mode, inline transform to edges
3. Introduce boundaries — regions (visual/organizational first), then frames (computational)
4. Introduce meta-layer — references and constraints (bounded self-reference)

## Key Panel Disagreements

- McLuhan vs. Hofstadter: Ship regions (spatial meaning) or frames (recursive composition) first?
- Korzybski vs. Von Foerster: Progressive disclosure (keep current types as entry points) vs. radical simplicity (let patterns emerge)?
- Hofstadter vs. McLuhan: How many of the 19 gaps truly dissolve vs. become "theoretically possible but practically too complex"?
- All: Self-reference is essential (Hofstadter) but must be bounded (Von Foerster) to prevent reversal into programming environment (McLuhan)

## Defensibility Thesis

In a world where anyone can build an app, the 5 specialized node types are commodity replicable in a weekend. The 6 compositional primitives and their interaction design represent a multi-year design challenge that produces defensible value — not because the primitives are secret, but because the design of how they compose, the spatial grammar they enable, and the emergent constructions users discover cannot be replicated by copying a feature list.

The primitive vocabulary is the moat.
