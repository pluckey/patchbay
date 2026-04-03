---
feature: context-pipeline
center: "This feature makes the user's context-construction process — what they select, transform, and compose from source material for AI — into a visible, spatial, experimentable object."
center_test:
  excludes: "AI-powered auto-summarization of PDFs — good feature, but it automates rather than illuminates the construction process, removing the user from the loop"
  boundary: "A batch script that processes all source documents into a finished prompt — it transforms sources into AI context, but the construction process is hidden inside the script, not spatial or experimentable"
archetypes: [pipeline-decomposition, modality-addition]
stage: whiteboard
intensity: deep
loop_iterations: 1
last_modified: 2026-04-02T00:00:00Z
---

# Whiteboard: Context Pipeline

## Center

This feature makes the user's context-construction process — what they select, transform, and compose from source material for AI — into a visible, spatial, experimentable object.

## Center Test

**Exclusion test:** "AI-powered auto-summarization of PDFs" is a good feature idea that this center excludes. Auto-summarization removes the user from the construction process — it automates rather than illuminates. The center demands that the user's own construction choices be visible and adjustable, not delegated to a machine.

**Boundary discrimination:** "A batch script that processes all source documents into a finished prompt" almost qualifies — it is a transformation from sources to AI context. But the center says no: a batch script is neither spatial (it has no meaningful position or visual relationship to other elements) nor experimentable (it runs once and produces a result, with no invitation to vary, compare, or iterate in real time). The construction process is hidden inside the script, not made visible on the canvas.

## Context

**Why now?** The user has already built a working system for composing AI context from PDFs (incremental-reader-v2). That system works — it extracts page text, assembles trailing pages and annotations, fills prompt templates, and sends the result to AI. But it is hardcoded: the assembly logic is fixed in application code, invisible to the user, and modifiable only by changing source code. The user has hit the ceiling of what a rigid pipeline can do and wants to make the pipeline itself the thing they can see and manipulate.

**What exists that's related?** The spatial canvas already exists with two node types: editable text and PDF viewing. But these nodes are islands — there are no connections between them, no data flow, no way to say "this text was derived from that PDF." The user has the workspace but not the wiring. The incremental-reader-v2 has the wiring but not the workspace. This feature is the point where those two capabilities begin to merge.

The user also identifies this as part of a larger trajectory: connecting different data sources, querying data from them, and composing everything into AI prompts. This is the first step in that trajectory, using the PDF-to-text case as the proving ground.

## Intent

**In the user's words:** They want "a more freeform/creative version" of their existing prompt-composition pipeline, one that allows "some degree of experimentation within that paradigm." They want to "transform PDF node data into textual nodes, each with its own custom query." They envision connecting source nodes to transform nodes to output nodes on the canvas.

**The picture in their head:** A canvas where a PDF node sits on the left, connected by a visible edge to a transform node in the middle, which is connected to a text output node on the right. The transform node contains some kind of user-specified extraction logic — "give me pages 5-10," "extract all passages about epistemology," "summarize the main argument." The user can change the transform and see the output update. They can have multiple transforms emanating from the same PDF, each producing different textual outputs. Those outputs eventually flow together into a composed prompt for AI.

The user is imagining a directed graph where sources flow through transforms into outputs, and the graph is visible and editable on the spatial canvas.

## Assumptions

**Assumption 1: Transformation is primarily a data operation.** The user frames this as "querying data out of" sources, which implies extraction — the useful content is already IN the PDF, and the transform's job is to GET IT OUT. But much of what makes context useful for AI is not extraction but *reframing* — changing the level of abstraction, adding interpretive framing, juxtaposing passages that aren't adjacent in the source. The user's existing system already does this (it injects library book names and prior discourse, not just page text), but the framing of the request doesn't fully acknowledge the constructive nature of the operation.

**Assumption 2: The user knows what they want to extract before they extract it.** Both proposed mechanisms (visual query builder, JavaScript evaluator) require the user to specify the transformation in advance. But a significant portion of context-construction work is *discovering* what's relevant through exploration. The user reads a passage, realizes it connects to something in another source, and only *then* knows they want to extract it. The assumption of specify-then-execute may be backwards for much of the actual workflow.

**Assumption 3: The pipeline is linear.** The user describes source → transform → output. But the actual workflow is recursive — AI responses change what the user wants to extract next, extracted content reveals new connections, new connections prompt new extractions. The pipeline metaphor hides this fundamental circularity.

**Assumption 4: The JavaScript evaluator is the right level of formalism.** The user gravitates toward this because it is maximally flexible (Turing-complete) and they are technically capable. But formalism has a cost: it forces the user to translate their intent into procedural logic before they can act on it. Many of the most valuable transformations are pre-formal — the user can point at what they want but cannot write a function to find it programmatically.

**Applicable analogies:**
- *The rehearsal space*: A place for practicing, experimenting, and developing intuitions through real-time feedback, with the freedom to fail and iterate cheaply.
- *The desk covered with open books*: The spatial canvas retrieves the older practice of physical arrangement — spreading sources out, placing related things near each other, annotating margins, seeing relationships through proximity.
- *The structural differential*: The transform node is a device for moving between levels of abstraction — from raw source (territory) through various maps (extractions, summaries, reframings) to a composed representation (the AI prompt).

## Design Tensions

**Tension 1: Power vs. Accessibility.** A JavaScript evaluator is maximally powerful but imposes a procedural-programming cognitive mode that clashes with the spatial, gestural mode of the canvas. A visual query builder is accessible but, as the user correctly intuits, will always lag behind the complexity of real needs. There is no resolution — only a choice about where to sit on the spectrum, or a design that allows movement along it.

**Tension 2: Formalism vs. Fluidity.** Every proposed transform mechanism requires the user to formalize their intent before acting. But the user's stated goal is experimentation, which implies intent that is still forming. Requiring premature formalization fights the exploratory process. But without some formalization, the system cannot execute anything. The design must find a way to support *partial, evolving, informal* specifications — transforms that are sketches rather than blueprints.

**Tension 3: Determinism vs. Discovery.** A transform that reliably produces the same output from the same input is useful for building stable prompt compositions. But the user wants to *discover* new composition strategies, which requires being able to vary inputs, tweak transforms, and compare results. The system needs to support both a "production" mode and an "exploration" mode.

**Tension 4: Known-good patterns vs. Freeform creation.** The existing hardcoded pipeline embodies accumulated knowledge about what context is useful for AI. Moving to a freeform canvas *loses* that knowledge. If the system offers only blank-canvas freedom, users face the paradox of choice. If it offers only templates, it's just a GUI for the existing system. The design must enable both: instantiating known-good patterns AND departing from them.

**Tension 5: Hot tool in a cool medium.** The spatial canvas is a cool medium — low definition, high participation, inviting the user to complete meaning through arrangement. A JavaScript evaluator or formal query builder is a hot medium — high definition, low participation, everything must be explicit. Inserting a hot tool into a cool medium creates a friction point. This friction might be *productive* (a precise instrument on an open desk) or *destructive* (a jarring mode-switch that breaks flow).

## Open Questions

**1. What is the transform node — a specification or a performance?** Does the user write a query/function in advance and then execute it (specification), or do they interact with source material in real time, making selections and annotations that become the transform (performance)? The panel did not resolve this. Korzybski advocates for multiple levels of specification. Von Foerster argues that performance is more aligned with experimentation. McLuhan notes the user's comfort with formalism suggests specification may be acceptable.

**2. Can transforms invoke AI?** "Summarize the epistemological argument from chapter 3" is a transform that requires AI to execute. If transforms can invoke AI, the system becomes recursive: AI helps construct context for AI. This is potentially powerful but introduces latency, cost, nondeterminism, and a dependency on external services into what is currently a local-first system.

**3. Should the system remember previous transform configurations and their results?** If so, it becomes a tool for tracking the user's epistemic evolution — a record of how their understanding of "what context matters" has changed over time. This is a different and potentially more profound product than a pipeline builder.

**4. What granularity should transforms operate at?** Page level (like the existing system)? Paragraph? Sentence? Concept? The answer determines what the user can see and manipulate. You cannot construct what you cannot perceive.

**5. How does the system handle the feedback loop?** AI responses will change what the user wants to extract. Changed extractions will change the next AI response. If the system is designed as a one-directional pipeline, it will fight this fundamental loop.

**6. Is "increment" the right framing?** Von Foerster dissents from the user's description of this as "a step toward" a known destination. If the system is truly for experimentation, the destination is unknowable — it will emerge from use. Building incrementally toward a predetermined vision may prevent the system from becoming what it needs to become. The other panelists acknowledge the tension but note that building something small and learning from it is compatible with emergence.

## Alternatives Considered

**Option 1: Visual modular query/filter builder.** User dismissed as "nice but complex and will probably be continually insufficient." The panel agrees — it is a hot medium that must anticipate every possible query type in advance, and every unanticipated need requires building a new widget. Its failure mode is *feature accretion* — becoming increasingly complex without becoming correspondingly more capable.

**Option 2: Intermediate query node with JavaScript function evaluator.** The user leans toward this. The panel sees it as formally powerful but problematic: it imposes a procedural-programming cognitive mode on a spatial-exploration workflow; it assumes the user can formalize their intent before acting; it creates a hot/cool medium mismatch. Its failure mode is *cognitive mode-switching* — the user must shift from spatial thinking to procedural thinking every time they define a transform.

**Option 3: "Something else."** The panel suggests: transforms that support multiple levels of formality (from "select these pages" to "summarize the argument about X"); transforms that can be specified in natural language and executed by AI; transforms that are lightweight and disposable rather than heavyweight and precious; transforms that leverage the spatial medium rather than fighting it with formal syntax. The panel does not converge on a single alternative but agrees that the final design should not force a choice between the mechanical and the semantic — it should allow both and allow users to move between them.

## Non-Functional Context

**Audience:** Power users who have already outgrown their current tools. The user reveals deep familiarity with prompt engineering, context composition, and AI interaction patterns. They are comfortable with technical mechanisms and have specific, experience-derived opinions about what won't work. This is not a tool for casual users — it is a tool for practitioners who have hit the limits of fixed pipelines and want to break through.

**Scale:** Today's sources are PDFs and text. The user explicitly mentions "multi-modal sources" and "different data sources." The transform pattern must not be specific to PDF-to-text — it should be a general mechanism that works across source types. Tomorrow's sources could include images, code, web content, conversation transcripts, API responses.

**Timeline and incrementalism:** The user frames this as "a step" and "an increment." They want the smallest thing that teaches them something about how freeform context composition works on a spatial canvas, then iterate from there. This argues for a design that is minimal but extensible.

**Performance:** The existing prompt-composition system operates synchronously. If transforms become asynchronous (especially if they invoke AI), the user experience changes fundamentally. Synchronous transforms feel like direct manipulation; asynchronous transforms feel like job submission.

**Infrastructure preference:** The existing system is local-first. Introducing AI-executed transforms or external data sources would break the local-first model. Any design that requires cloud services for basic operation would be a departure from the established pattern.
