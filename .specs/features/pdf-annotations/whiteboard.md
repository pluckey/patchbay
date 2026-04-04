---
feature: pdf-annotations
center: "This feature allows users to construct an interpretive layer over non-editable source material — marking regions and attaching meaning — so that their reading becomes a composable, pipeline-accessible input alongside the original content."
center_test:
  excludes: "Add dark mode to the PDF viewer — improves reading comfort, not interpretive composability"
  boundary: "A purely visual highlight that never reaches the pipeline — relates to marking regions but fails the composability requirement"
stage: whiteboard
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## Center

This feature allows users to construct an interpretive layer over non-editable source material — marking regions and attaching meaning — so that their reading becomes a composable, pipeline-accessible input alongside the original content.

## Center Test

**Exclusion test:** "Add dark mode to the PDF viewer" is a plausible PDF feature that does NOT serve this center (it improves reading comfort, not interpretive composability). "Auto-extract all text from the PDF" also fails — it is automated extraction without user interpretation.

**Boundary discrimination:** "Let users highlight text in a PDF" serves this center ONLY IF the highlight is accessible to downstream processing. A purely visual highlight that never reaches the pipeline fails the center. This is the critical discriminator: if the user's mark doesn't flow forward as composable data, it doesn't belong to this feature.

## Context

The workspace lets users arrange source material, connect it through transforms, and compose context for AI. Every node type except PDF already participates in this curation loop — markdown is authored directly, transforms are user-written. The PDF node alone forces passive observation: visible but untouchable, readable but not addressable. The user's only current workaround is extracting flat text through the pipeline and manually copying relevant fragments into editable nodes — a lossy, high-friction process that discards the spatial and structural context of the original document. A prior design decision explicitly deferred selection as "crossing from reading into editing." This feature intentionally crosses that line, recognizing that the workspace's purpose demands it.

## Intent

**What this is really about:** The user reads source material. They form interpretations. They need those interpretations to flow into downstream processing with full traceability to the source region. Today, the reading act is invisible to the system — only the document's raw content passes through the pipeline, with no trace of what the user found significant or why. This feature makes the reading act legible to the pipeline.

**Who needs it:** Any user whose most important source material arrives as a fixed-layout, non-editable document. They need to curate that material — not by editing it, but by layering interpretation on top of it — and have that curated interpretation compose with everything else in their workspace.

**What could go wrong if misunderstood:** If this is understood as "add PDF markup features" (in the tradition of document annotation tools), the result will be a capable annotation interface that produces data the pipeline cannot meaningfully consume. Conversely, if this is understood as only a pipeline data-modeling problem, the result will be a well-structured data format attached to a hostile interaction — slow, awkward marking that users abandon in favor of copy-pasting into text nodes.

## Assumptions

1. **The user's act of selection carries information.** The fact that a human chose THIS region (and not others) is itself meaningful to downstream processing.

2. **Spatial regions can be reliably mapped to textual content.** A bounding box on a rendered page must translate to a stable text fragment. Multi-column layouts, embedded figures, and rotated text may violate this assumption.

3. **Annotations are user-constructed, not document-intrinsic.** Two users may annotate the same region with different meanings. Annotations belong to the user's interpretation, not to the document.

4. **Bounding-box granularity is sufficient.** Rectangle-level selection rather than character-level. Some imprecision is acceptable for the context-composition use case.

5. **The existing pipeline contract (flat text) is inadequate.** Annotations require a richer data structure — at minimum, region + extracted text + user-supplied label.

6. **Annotations are durable.** They survive page navigation, zoom changes, and workspace reload.

## Design Tensions

1. **Basic selection vs. advanced annotation.** Select-and-copy (commodity) vs. region-bound annotations (novel). Different moments — quick extraction vs. deliberate curation — with different design implications.

2. **Spatial precision vs. semantic fluidity.** A bounding box is rigid geometry. Human interpretation is fluid — a key insight might span non-contiguous paragraphs. Every spatial constraint is also a semantic constraint.

3. **Annotation as private reading aid vs. annotation as pipeline data.** A note-to-self and a pipeline-facing label are different speech acts. Supporting only one mode forces over-formalization or under-structuring.

4. **Document fidelity vs. interpretive freedom.** Annotations create a figure/ground reversal. The feature must serve both orientations — pipeline attending to curated fragments and pipeline needing full document with annotation hints.

5. **Coupling between annotation layer and document rendering.** Annotations anchored to specific positions in a specific rendering. If re-rendered at different zoom, annotations must re-anchor or be orphaned.

## Open Questions

1. **What is the minimal viable annotation?** A region with no label? A text tag? A freeform note?

2. **How do annotations compose?** If two annotations overlap, what does the pipeline receive?

3. **What is the pipeline's contract with annotations?** Structured data? Enriched text? Separate data channel?

4. **What happens to un-annotated content?** Does the pipeline still receive full document text, or do annotations act as a filter?

5. **Are annotations resolution-independent?** How is the anchor specified — page-relative coordinates, text offsets, or something else?

6. **Can annotations survive document replacement?**

7. **Is copy-to-clipboard a separate capability or a subset of annotation?**

## Alternatives Considered

**Separate annotation node.** Companion node referencing regions by page and coordinates. Clean separation at the cost of losing spatial locality.

**Pipeline-side extraction with user confirmation.** Auto-identify candidate regions, user confirms. Lower effort but imposes system's reading rather than capturing user's interpretation.

**Text-only selection without spatial annotation.** Text layer for copy but no persistent annotations. Solves basic need without pipeline-accessible regions, loses provenance.

**Structured extraction via transform.** Pattern-based extraction instead of visual marking. Powerful but inaccessible to spatial thinkers.

## Non-Functional Context

**Interaction speed is existential.** Marking a region must be faster than the copy-paste workaround it replaces.

**Annotation volume is unpredictable.** A handful per document to dense annotations across dozens of pages.

**New data lifecycle.** Annotations are interpretive metadata — neither imported content nor authored content. They need their own persistence story.

**Accessibility.** Bounding-box drag is pointer-centric. Alternative paths needed for keyboard/assistive technology users.
