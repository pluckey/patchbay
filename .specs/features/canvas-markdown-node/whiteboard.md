---
feature: canvas-markdown-node
center: "A workspace where a person spatially arranges source material to compose the context an AI operates within."
center_test:
  excludes: "Auto-generating AI context from a codebase — no human spatial arrangement, context composed automatically"
  boundary: "A drag-and-drop file upload widget that adds multiple PDFs to an AI conversation — collection without spatial composition"
stage: whiteboard
intensity: standard
loop_iterations: 1
last_modified: 2026-04-02T00:00:00Z
---

# Whiteboard: AI Context Composition Surface

## Panel

- **John Gall** — Systems theorist, author of *Systemantics*. Originator of Gall's Law.
- **Alfred Korzybski** — Founder of General Semantics, author of *Science and Sanity*.
- **Douglas Hofstadter** — Cognitive scientist, author of *Gödel, Escher, Bach*.
- **Steve Jobs** — Co-founder of Apple. Product visionary.

## Center

**A workspace where a person spatially arranges source material to compose the context an AI operates within.**

## Center Test

**Exclusion test:** Auto-generating AI context from a codebase (as many IDE-integrated AI tools do) is a good feature idea that this center excludes. There is no human spatial arrangement — the context is composed automatically, not by a person on a spatial surface. The center demands a human in the loop, composing deliberately.

**Boundary discrimination:** A drag-and-drop file upload widget that lets you add multiple PDFs to an AI conversation. This almost qualifies — the user is gathering source material for AI context. But the center says no, because there is no spatial arrangement. A file upload list has no two-dimensional relational structure. The user cannot express "these two documents relate to each other but are separate from that third one" through spatial proximity. It is collection without composition.

## Context

Why now? The current paradigm for feeding context to AI is the chat input box — a one-dimensional, linear, ephemeral channel. Users paste text, upload files, re-explain context in every new conversation. There is no persistent workspace for constructing the information environment an AI operates within. The pain is proportional to the complexity of the user's work: someone synthesizing multiple sources suffers more than someone asking a single question.

What exists that is related? The builder has two sibling projects already using canvas-based interfaces, providing institutional familiarity with spatial UI patterns. The broader landscape includes prompt management tools, knowledge base integrations, and multi-file chat interfaces — but none of these offer spatial composition as a first-class concept. The gap is not "talking to AI" (solved many times over) but "constructing the world the AI sees."

## Intent

The user wants a surface where they can gather their working materials — starting with editable markdown text nodes — and arrange them spatially so that an AI can operate with awareness of all of them simultaneously. The picture in their head is closest to spreading notes across a desk before calling a colleague over to help: "Here, look at all this." They want the transition from "I have scattered context" to "the AI sees what I see" to feel effortless. They have explicitly committed to evolutionary development — start with one source type on a canvas and build outward from whatever works. AI integration is not required for the first version; the priority is getting source material onto the canvas and sorted.

## Assumptions

1. **Spatial arrangement carries meaning the AI can use.** This is the foundational assumption, and it is unproven. The user assumes that placing documents in spatial relationships on a canvas will produce meaningfully different AI behavior than simply listing the same documents.

2. **A canvas is the right metaphor.** The user has pre-selected "freeform canvas" as the interaction paradigm. Alternatives — structured templates, hierarchical outlines, tagged collections, sequential playlists — were not considered or were considered and rejected without documentation.

3. **Markdown is the right starting point.** (Originally PDF, changed after panel challenge from Gall.) Markdown is the simplest textual source type — already the native format of most AI context, no parsing required, directly editable. This honors Gall's Law.

4. **"Context engineering" is a coherent activity.** The term "engineering" implies precision, repeatability, and predictable outcomes. But composing context for AI is closer to curation — a subjective, creative act where the same arrangement may produce different results. "Context composition" more honestly describes the activity.

5. **The user's mental model matches the AI's experience.** The user will arrange items on the canvas and believe the AI "sees" what they see. But the AI receives a serialized, textual representation — not a spatial one. Three levels of mapping: (a) the user's mental model, (b) the canvas as externalization, (c) what the AI actually receives. Each mapping loses information.

6. **Prior canvas experience transfers.** The sibling projects provide familiarity with canvas interaction patterns, but a canvas for context composition is fundamentally different from a canvas for reading or document processing.

## Design Tensions

**Spatial expressiveness vs. translation fidelity.** The more freedom the user has to arrange things spatially, the harder it is to faithfully translate that arrangement into something the AI can process. A rich, freeform canvas promises expressive power but creates a wider gap between what the human sees and what the AI receives.

**Simplicity of first version vs. proof of core concept.** The simplest working system (one document on a canvas) cannot demonstrate the product's differentiating value — spatial relationships require at minimum two items. But building toward two-item interactions means building more before you know if the foundation works. Gall says "one node first"; Hofstadter says "one node can't test your thesis."

**Beautiful canvas vs. honest translation.** Making the canvas feel delightful and spatial risks creating the impression that the AI experiences the same spatial richness. If spatial arrangement turns out to have minimal effect on AI output, the beautiful canvas becomes a "sycophantic interface" — it agrees with whatever the user does without any of it mattering.

**Evolutionary simplicity vs. architectural discipline.** The user wants strict evolutionary development AND Clean Architecture principles simultaneously. But a sophisticated organizational methodology applied to a system that should be radically simple is itself a systems-design contradiction. Over-architecting the foundation constrains the directions it can evolve in — directions that should be determined by what works, not by what the architecture anticipates.

**Curation tool vs. conversation partner.** The description implies a one-directional workflow: human composes context, AI consumes it. But the interesting future is bidirectional — the AI responds, the response becomes new context, the human recomposes. Designing for one-directional use now may create structural barriers to the feedback loop later.

**Generality vs. specificity.** The language ("AI context sources," "different sources," "freeform") reveals an aspiration toward a general-purpose platform. But every successful product begins as a specific tool for a specific person doing a specific thing. The pull toward "what about other source types?" must be resisted until the first source type works perfectly.

## Resolved Questions

- **When does AI integration enter?** Not day 1. Priority is getting source material onto the canvas and sorted. AI comes later. (User decision.)
- **First source type?** Editable markdown text node. PDF was replaced after Gall challenged its complexity. (User decision.)
- **Single-player or multiplayer?** Single-player first. (User confirmed, panel unanimous.)
- **What does a node look like?** An editable markdown editor. (User decision.)

## Open Questions

1. **Does spatial arrangement actually change AI output?** This is the existential question. If moving nodes closer together on the canvas produces the same AI response as leaving them far apart, the spatial dimension is decorative. Must be tested empirically. (All four panelists flagged as critical.) Deferred — cannot be answered until AI integration enters.

2. **What is the serialization strategy?** How does a two-dimensional spatial arrangement become input an AI can process? Does proximity become ordering? Does grouping become sectioning? Do explicit connections become instructions? Core unsolved problem. Deferred — not needed for v1 (canvas-first, no AI yet).

3. **Who decides what spatial arrangement means?** Three options: (A) fixed conventions (proximity = relatedness), (B) user-declared meaning (explicit labels), (C) AI-inferred meaning. Panel agreed to start with A. Deferred — couples to serialization strategy.

## Alternatives Considered

**Linear context builder (no canvas).** A sequential list or outline. Simpler to build, no spatial-to-linear translation problem. Rejected by the user's commitment to spatial arrangement, but worth noting: if spatial arrangement proves not to affect AI output, this delivers the same value with less effort.

**Template-based composition.** Pre-defined layouts ("research synthesis," "document comparison"). Solves blank-canvas paralysis and makes serialization deterministic. Rejected by preference for "freeform."

**Chat-first with context sidebar.** Keep familiar chat interface, add persistent sidebar for context sources. Least disruptive, ships fastest. Rejected because it doesn't offer spatial composition.

**Why this direction?** The user chose the canvas approach because they believe spatial arrangement is a meaningfully different way to compose context. The direction is a bet that two-dimensional composition produces better AI outcomes than one-dimensional listing. That bet must be validated early.

## Non-Functional Context

**Audience:** Knowledge workers with multi-source, complex workflows who already use AI extensively. Consultants, researchers, analysts. Not casual AI users.

**Timeline:** Greenfield, evolutionary approach. First working version should be achievable in days to weeks, not months.

**Scale:** Single-user, small number of documents per canvas. Handful of PDFs, responsive canvas.

**Performance:** Canvas interaction must feel instantaneous. PDF loading may take a moment but must show progress. AI processing clearly asynchronous, never blocking canvas interaction.

**Infrastructure:** Deployment preferences stated. Two sibling projects share tooling. Greenfield — no migration, no backward compatibility.
