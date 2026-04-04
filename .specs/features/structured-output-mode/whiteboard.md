---
feature: structured-output-mode
center: "Letting users declare the expected shape of an AI node's output so downstream consumption — by humans or other nodes — requires less interpretation."
center_test:
  excludes: "A prompt template library that helps users write better AI node instructions — improves input quality, not output shape, and does not reduce downstream interpretation burden"
  boundary: "A user requesting markdown with specific heading levels (H2/H3) — this looks like declaring output shape, but headings are visual formatting, not independently addressable data segments; downstream consumers still must scan and parse prose to find content"
stage: whiteboard
intensity: standard
loop_iterations: 1
last_modified: 2026-04-04T00:00:00Z
---

## Center

**Letting users declare the expected shape of an AI node's output so downstream consumption — by humans or other nodes — requires less interpretation.**

The panel debated four framings before converging. Korzybski emphasized the output's "declared shape" as a map with its own legend. Hofstadter stressed user agency in defining the interface between cognitive steps. Von Foerster challenged the panel to specify *whose* interpretation is being reduced (machine consumer vs. human reader), insisting on spectrum language ("less interpretation") rather than binary promises. McLuhan framed the shift as one of medium temperature — from ambient prose to compartmentalized form. The synthesis preserves all four contributions: "declare" (Korzybski's intentional cartography), "expected shape" (Von Foerster's acknowledgment that the LLM may not comply), "downstream consumption" (Hofstadter's bilateral junction), and the implicit medium shift from prose to structured form (McLuhan).

## Center Test

**Exclusion test:** A *prompt template library* — pre-built instructions that help users write better AI node prompts — is a good feature idea that this center excludes. It improves the quality of what goes *into* the AI step, not the shape of what comes *out*. It does not reduce downstream interpretation burden.

**Boundary discrimination:** A user requests that the AI node output markdown with specific heading levels (H2 for main topics, H3 for subtopics). This *looks* like declaring output shape, but the spec should say no. The test: can a downstream consumer access a specific part of the output by name without interpreting the whole? Markdown headings are visual formatting conventions, not independently addressable data segments. If a downstream node must scan and parse prose to find "the part under the H2 called Summary," that is interpretation, not structured access. The line is: does the declared shape create parts that are addressable by name or position without re-interpreting the surrounding content?

## Context

The AI Transform node already exists and works. It produces free-form text, participates in multi-step pipelines, and supports both concatenated and template-based input modes. The pipeline infrastructure is functional — nodes connect, data flows, downstream nodes consume upstream output.

The pressure point has shifted. The bottleneck is no longer "can nodes connect?" but "can they communicate precisely?" In a two-step pipeline, the interpretation tax at the junction is tolerable. As pipelines grow longer and branches multiply, cumulative interpretation drift across junctions degrades reliability. Each downstream node must guess at the structure of its input, and that guesswork compounds.

Meanwhile, the broader AI tooling ecosystem has matured. LLM providers widely support structured output modes — schema-constrained generation, function calling, typed responses. The capability exists at the infrastructure level. The question is how to surface it to users who think spatially rather than programmatically.

The workspace already has two "temperatures" of processing: free-form text nodes (interpretive, ambient) and code transform nodes (deterministic, explicit). The AI Transform currently lives entirely in the interpretive zone. Structured output mode would create a hybrid — AI-generated content in a machine-navigable container — filling a gap in the workspace's expressive range.

## Intent

The user pictures something like: "I want my AI node to output not just a blob of text, but specific named fields — summary, sentiment, key_points — and I want the next node in my pipeline to grab just the summary field without parsing prose."

They have likely seen structured output in other AI tools and want that capability in their spatial workspace. The mental image is probably a form or a table with labeled compartments, not a wall of text.

Note the word "mode" in the request. The user envisions a toggle: the node can operate in free-form mode (as it does today) or structured mode. They expect the two modes to coexist within the same node, not for structured output to replace free-form output.

The user may hold two pictures simultaneously without realizing they are different: (1) "I want the output to *look* organized" — a display concern, and (2) "I want downstream nodes to *access specific parts* of the output" — a data flow concern. The feature must serve the second picture. The first is a pleasant side effect but not the center.

## Assumptions

**The user is taking for granted:**

1. **LLMs can reliably conform to a declared schema.** This is increasingly true but not guaranteed. The gap between declared structure and actual output is inherent to non-deterministic generation. The feature must have a strategy for when the territory doesn't match the map.

2. **Structure is declared at the producer side only.** The user imagines defining fields on the outputting node. But reliable composition may require bilateral declaration — the producer declares what it outputs, and the consumer declares what it expects. The user is thinking unilaterally when the problem may be bilateral.

3. **"Structured" means "more useful."** But structure that doesn't match downstream needs is worse than no structure. A downstream node expecting a "summary" field that receives a "synopsis" field has a harder time than one that simply receives prose and extracts what it needs. False precision is more dangerous than honest ambiguity.

4. **Structure comes before content.** The user assumes they will define a schema, then run the node. But in exploratory workflows, they may not know what structure they want until they see the output. The assumption that declaration precedes execution may be backwards for discovery use cases.

**Applicable analogies:**

- **Spreadsheets.** Named columns, typed cells. The user is asking: can my AI node output a spreadsheet-like result instead of an essay? (Hofstadter)
- **Database schemas.** Define the table structure before inserting data. But unlike databases, here the "data source" is non-deterministic and may produce surprising rows. (Korzybski)
- **The telegraph-to-memo transition.** Unstructured stream to structured document. It changed what organizations could do with information by making it routeable and addressable. (McLuhan)

## Design Tensions

**Tension 1: Precision vs. Flexibility.** The more precisely the expected shape is defined, the more brittle the pipeline becomes. A strict schema means any LLM deviation is a failure. A loose schema is barely better than free-form text. The user wants both firm-enough-to-be-useful and forgiving-enough-to-survive-variability. This is a genuine contradiction, analogous to the static-vs-dynamic typing tension in programming. The design must choose a point on this spectrum or offer a dial.

**Tension 2: Discoverability vs. Composability.** In exploratory mode, the user doesn't know what fields they want until they see what the LLM produces. They want to run, observe, then extract structure. But composability requires declaring structure *before* execution so downstream nodes know what to expect. These two workflows — discover-then-declare vs. declare-then-execute — pull in opposite directions. The feature must serve both or explicitly choose one and name the cost.

**Tension 3: Human Readability vs. Machine Parseability.** A human looking at structured output wants labels, formatting, and contextual cues. A downstream node consuming it wants clean, predictable keys and values with no decoration. Optimizing for one degrades the other. The display of structured output and its underlying data representation may need to be different views of the same thing.

**Tension 4: Node Simplicity vs. Schema Complexity.** The current node is beautifully simple: write an instruction, get text. Adding structured output means adding a schema definition surface. How does a user define a schema inside a spatial canvas node without turning the node into a form builder? The node's visual and cognitive complexity will increase. The instruction is first-order ("do this"). The schema is second-order ("and shape the result like this"). Introducing a second order of abstraction to a node that currently operates at one order must be done gracefully or the first-order simplicity will be overwhelmed.

**Tension 5: Singular Output vs. Multi-Field Output in the Pipeline.** Currently, a node's output is one thing — a blob of text. Structured output breaks this into many things — named fields. How does a downstream node reference a specific field from an upstream structured result? The connection model (one edge from A to B) must now carry richer meaning. This changes the nature of connections in the pipeline, not just the nature of outputs. It is the single deepest tension: the feature is not just about one node's output format — it potentially reshapes the pipeline's information model from blob-passing to record-passing.

## Open Questions

**Q1: Should the schema be defined visually or textually?**
A visual field list (add field, name it, choose type) feels native to the canvas metaphor. A textual schema definition (type a list of fields or a schema description) is more powerful and expressive. *Panel split: Hofstadter leans textual for power; McLuhan leans visual for medium coherence. Unresolved.*

**Q2: What happens when the LLM doesn't conform to the declared schema?**
The system needs a strategy: retry, show raw output with a warning, attempt best-effort parsing, or fail with an error. *Panel consensus: the mismatch between declared shape and actual output must be made visible to the user, never silently papered over. The map-territory gap must be shown, not hidden.*

**Q3: How do downstream nodes reference specific fields?**
Two approaches: (a) each field becomes a separate visual output port on the node, so connections can target individual fields; (b) fields are accessed through template syntax in the consuming node (e.g., referencing upstream.summary), keeping connections simple but making their meaning less visible. *Panel split: no consensus. Both approaches have real tradeoffs between visual complexity and semantic clarity. This is the largest open design question.*

**Q4: Can structure be inferred from output rather than declared upfront?**
A "discover-then-declare" workflow: run in free-form mode, see the output, then tell the system to extract a schema from what the LLM produced. *Panel agrees this is valuable for exploration but insufficient as the primary mechanism — inferred structure is coupled to a single run and may change on re-execution. Best treated as a secondary workflow, not the default.*

**Q5: Flat key-value pairs or nested structures?**
*Panel split: Korzybski advocates flat-only for the initial version, arguing each nesting level is an additional order of abstraction that compounds complexity. Hofstadter argues that at minimum arrays/lists must be supported, since many real extraction tasks produce variable-length results (e.g., "list all key themes"). No resolution — this is a scoping decision.*

**Q6: Is this a mode of the existing node or a different node type?**
*Panel mostly agrees: a mode. The underlying mechanism (LLM + instruction) is the same. The structure declaration is an output constraint, not a different operation. McLuhan dissents mildly, noting that the "feel" of the node changes significantly in structured mode — it becomes a form-filler rather than a writer. He urges that the UI acknowledge this identity shift rather than treating structured output as a minor toggle.*

## Alternatives Considered

**Alternative 1: Do nothing — keep free-form text only.**
Works for short pipelines where the user is the primary output consumer. Breaks down as pipelines grow longer and node-to-node consumption increases, because interpretation tax at each junction becomes prohibitive. *Rejected: does not serve the pipeline composition use case that motivated the request.*

**Alternative 2: Use the existing code transform node as a post-processor.**
Users can already chain a free-form AI output into a code transform that parses text into structured data. This is technically possible today. But it requires users to write parsing code, which defeats the purpose of a low-friction AI workspace. It shifts the complexity cost onto the user. *Rejected: the "build it yourself" non-answer.*

**Alternative 3: Predefined output templates instead of user-defined schemas.**
Offer a small menu of common structures: summary + bullets, pros/cons, Q&A pairs, key-value extraction. Dramatically reduces the schema definition burden but limits expressiveness. *Not rejected: flagged as a possible incremental first step. Predefined templates as starting points, with customization available, could serve as a bridge to full user-defined schemas.*

**Alternative 4: Inferred structure — let the LLM decide the shape, then expose it.**
Run the LLM, detect structure in its output (embedded JSON, lists, tables), and automatically parse and expose addressable fields. No user-defined schema needed. *Elegant for exploration but unreliable for composition — the detected structure could change on every run. Useful as a secondary capability, not as the primary mechanism.*

## Non-Functional Context

**Audience:** Knowledge workers who think spatially, comfortable with node-and-wire composition but not necessarily programmers. The schema definition surface must be visual and declarative, not programmatic. Any approach that requires writing schema definitions in a formal language will alienate a significant portion of the user base.

**Scale:** Single-user workspace. Schemas are node-local, not shared or versioned across users. This relaxes the design: schemas can be informal, mutable, and tightly coupled to individual nodes without coordination costs.

**Performance:** Structured output from LLMs may require specific generation strategies (constrained decoding, schema-guided sampling) that differ from free-form generation. Validation of output against the declared schema is an additional step. For auto-execute nodes in a pipeline, these additions compound. The feature should not noticeably degrade the execution speed of simple pipelines.

**Persistence and Compatibility:** The existing output representation is a single string. Structured output requires a richer representation, but it must remain serializable in the same persistence layer and degrade gracefully. Nodes that do not understand structure should still be able to consume structured output as a string fallback (e.g., the full output serialized as text). Backward compatibility with saved workspaces must be preserved.

**Incrementalism:** The feature has natural layers that can be delivered independently: (1) flat key-value output with named fields, (2) typed fields with validation, (3) nested and array structures, (4) downstream field-level access via connections or templates, (5) schema inference from output. Each layer is independently useful. The specification should identify which layer constitutes the minimum viable feature.
