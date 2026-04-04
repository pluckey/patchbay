---
feature: ai-transform-node
center: "The AI Transform lets users define a single LLM processing instruction that operates as a composable, low-friction step in a spatial information pipeline."
center_test:
  excludes: "A prompt playground for iteratively testing prompts against different inputs and comparing outputs across models — valuable, but attended and non-composable"
  boundary: "A node that requires manual approval of each output before it flows downstream — almost qualifies but the approval gate violates 'unattended step'"
stage: whiteboard
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## Center

The AI Transform lets users define a single LLM processing instruction that operates as a composable, unattended step in a spatial information pipeline.

## Center Test

**Exclusion test**: A "prompt playground" feature — where users iteratively test a prompt against different inputs, compare outputs across models, and tune parameters — is a valuable feature idea that this center *excludes*. The playground is attended, iterative, and focused on prompt development. The AI Transform center demands unattended, composable pipeline operation, not prompt experimentation.

**Boundary discrimination**: A node that lets users write a prompt instruction and then manually approves each output before it flows downstream. This *almost* qualifies — it has a single instruction and processes connected inputs — but the manual approval gate violates "unattended step." The center specifies that the transform operates without requiring ongoing attention; an approval gate reintroduces the user into every execution cycle, making it supervised rather than autonomous.

## Context

The workspace already possesses both halves of this capability independently. Deterministic code execution composes in pipelines — it takes connected inputs, runs user-written logic, and produces outputs that flow downstream. LLM integration exists through interactive chat — it calls models, streams responses, supports multiple providers, and displays results. The AI Transform is the intersection: pipeline composition meets LLM processing.

The need surfaces from a recognizable usage pattern. Users already use chat nodes for single-shot tasks — write one instruction, receive one response, copy it elsewhere. The overhead is that conversation carries interaction surface (message history, input field, turn-taking) that is unnecessary when the intent is simply "process this and move on." The AI Transform formalizes the single-shot pattern and removes the conversational scaffolding.

The existing pipeline infrastructure already handles execution ordering, input resolution by name from connections, output display, status indication, and error states. The existing LLM infrastructure already handles model selection, provider routing, streaming, and error display. The mechanical prerequisites are largely in place. The work is primarily in defining the right interaction model — not building new infrastructure from scratch.

## Intent

The user sees their canvas as a processing graph. Source material enters at the edges — documents, notes, reference text. It flows through transformations — code logic, AI instructions — and produces refined outputs at the other end. Right now, the AI step in that graph requires entering a conversation: opening a chat, typing a message, waiting for a response, perhaps copying the result. The user wants to remove that friction.

The picture in their head is the Unix pipeline — `cat notes.md | summarize | extract-entities | format-table` — but spatial, visual, and persistent. Each step is a small, focused tool. You wire them together, and information flows. The AI Transform is the missing pipe fitting: the piece that lets LLM processing slot into the pipeline with the same ease as a code transformation.

The user's own words — "one is interactive and the other is plumbing" — reveal the governing metaphor. Plumbing is infrastructure you install once and rely on. You do not have a conversation with your kitchen sink. You expect it to work every time you turn the handle.

## Assumptions

1. **LLM processing can be treated like a pipe.** The user assumes that a single instruction is sufficient to get reliable, useful output without iterative refinement. This holds for well-understood tasks (summarization, extraction) but strains for nuanced or ambiguous processing.

2. **Interactive and non-interactive are distinct categories, not a spectrum.** The user draws a hard boundary between "conversation" and "plumbing." In practice, many tasks sit between these poles — a summarization instruction that needs minor tweaking, an extraction that misses edge cases. The boundary may be more permeable than the two-node-type model suggests.

3. **Users will write effective instructions on the first try,** or at least that iterating on instructions is a separate editorial concern, not something the runtime pipeline needs to support. The implicit assumption is that prompt-writing is a one-time setup cost, not an ongoing activity.

4. **One-shot processing without memory is adequate** for the envisioned use cases. The AI Transform has no message history, no accumulated context across runs. This works for stateless operations (summarize, extract, translate) but fails for tasks that benefit from accumulated understanding.

5. **Output quality will be sufficient to pipe downstream without human review.** If AI Transform outputs feed into subsequent processing steps, the user assumes those outputs are reliable enough to flow unsupervised. This is the strongest assumption and the one most likely to be violated.

The governing analogy is the **Unix pipeline**: each step is a small, focused tool that does one thing well, connected by standard interfaces. The analogy captures the structural relationship between nodes (data flows through connections) but obscures the behavioral difference (Unix pipes are deterministic; LLM processing is not).

## Design Tensions

1. **Plumbing vs. Craft.** The user wants infrastructure-grade reliability ("set and forget"), but LLM outputs are sensitive to prompt wording, input ordering, model choice, and even stochastic variation between runs. Making the experience feel like plumbing may discourage the careful iteration that produces good results. Making it feel like craft may undermine the efficiency the user is seeking.

2. **Simplicity vs. Observability.** Gall's Law demands starting simple — instruction in, output out. But a minimal node may hide too much. When the output is wrong, the user needs to see what inputs were assembled, how they were ordered, what the full prompt looked like, which model was used. Observability competes with simplicity, and the first version must find a defensible position on this spectrum.

3. **Autonomy vs. Control.** The entire value proposition is that the transform runs without the user's attention. But unattended AI processing can produce surprising, incorrect, or subtly degraded results — especially when upstream inputs change in ways the prompt instruction does not anticipate. The user wants freedom from the process but also wants quality assurance over the output. These goals pull in opposite directions.

4. **Distinctness vs. Duplication.** Separating AI Transform from Chat creates two node types that both call LLMs, both need model selection, both stream responses, and both display textual output. The conceptual distinction is clear (different interaction models), but the mechanical overlap is large. The tension is between conceptual purity and practical economy.

5. **Single-shot vs. Implicit Iteration.** The design says "no message history, no back-and-forth." But the user *will* iterate on the instruction. Each edit-and-rerun cycle is functionally a conversation — just one the system does not remember. The tension: should the system acknowledge this implicit iteration (preserving previous outputs for comparison, tracking instruction revisions) or treat each run as genuinely independent?

## Open Questions

- **When should the AI Transform re-execute?** On every upstream input change? Only when the user manually triggers it? On instruction edits? Automatic re-execution makes it feel like "live plumbing" but burns resources and produces output churn. Manual triggering preserves user control but breaks the pipeline metaphor.

- **How does the user know the output is good?** Without conversational back-and-forth, there is no built-in verification mechanism. The user reads the output and either accepts it or edits the instruction. Is that sufficient?

- **What happens when AI Transforms are chained?** Error propagation in a chain of probabilistic steps is qualitatively different from a chain of deterministic steps. A small misinterpretation in step one cascades and amplifies through subsequent steps.

- **Should the instruction support named input references?** When multiple inputs are connected, can the instruction say "take the summary from the left input and the dates from the right input"? Or does it receive all inputs as an undifferentiated block of text?

- **At what point does a chain of AI Transforms become an agent?** If users build multi-step AI pipelines that process, filter, synthesize, and decide — they have built an agent without calling it one. Is that an intended use case or a complexity trap?

## Alternatives Considered

1. **Mode on the Chat node.** Instead of a new node type, add a "single-shot mode" to the existing chat interface. The user explicitly rejected this: the interaction models are fundamentally different, and conflating them in a single node creates confusion about what the node *is*.

2. **Enhanced template node with AI processing.** Extend the existing text-substitution node to optionally process its composed output through an LLM. This reuses existing multi-input composition infrastructure but blurs the line between assembly and processing.

3. **AI mode toggle on the deterministic transform.** Add a switch to the code execution node: "run as code" vs. "run as AI prompt." Rejected for the same reason — deterministic and probabilistic execution have different expectations, different failure modes, and different debugging needs.

4. **Do nothing — use Chat nodes for single-shot tasks.** Users can already send a single message to a Chat node. The overhead is conversational scaffolding that is unnecessary for single-shot processing. The AI Transform removes that overhead and declares a different *intent*.

## Non-Functional Context

**Audience**: Knowledge workers who compose AI context spatially — researchers, analysts, writers. They are comfortable with pipelines and data flow but are not necessarily programmers.

**Scale**: Single-user, local-first workflows. Pipelines likely three to ten nodes. Primary bottleneck is LLM response latency. A five-node pipeline with two AI Transform steps means two sequential LLM calls — seconds to tens of seconds.

**Performance**: LLM calls are inherently slow. The experience must accommodate this through progress indication or streaming output. When chained, latency multiplies. Users need clear feedback about what is processing and what is waiting.

**Timeline**: Evolution of a working system per Gall's Law. The AI Transform should be the simplest viable addition — a single instruction, connected inputs, streamed output. Sophistication can follow once the basic interaction is validated.

**Infrastructure preferences**: Existing AI gateway, streaming, and pipeline execution to be composed into the new node type. Minimal surface area, incremental complexity.
