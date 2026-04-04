---
feature: ai-transform-node
center: "The AI Transform lets users define a single LLM processing instruction that operates as a composable, low-friction step in a spatial information pipeline."
stage: requirements
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## Acceptance Criteria

### ac-pipeline-input: Node accepts connected inputs
> **Center:** Composability requires that the node consume upstream content through the same connection mechanism every other pipeline node uses; without this, it cannot be a "step in a spatial information pipeline."

An AI Transform node accepts one or more incoming connections. Each connection delivers content from its source node (markdown text, PDF text, deterministic transform output, or another AI Transform's output). The node resolves all connected inputs before execution. A node with zero connections and no instruction is valid (idle state) but cannot execute.

### ac-pipeline-output: Node output is consumable by downstream nodes
> **Center:** A "composable step" must produce output in the form the pipeline already expects, so downstream nodes can consume it without special handling.

When an AI Transform completes successfully, its output is available to any downstream node connected to it — including other AI Transform nodes, deterministic Transform nodes, and Chat nodes. The output behaves identically to a deterministic Transform's output from the perspective of downstream consumers.

### ac-instruction-field: User-authored processing instruction
> **Center:** The "single LLM processing instruction" is the defining element that makes this node an AI transform rather than a passthrough; without it, no processing occurs.

The node presents an editable text field where the user writes a natural-language instruction that governs how the LLM processes the connected inputs. The instruction persists as part of the node's data and survives workspace save, load, and page reload. Changing the instruction does not require re-creating the node.

### ac-execution-status: Distinguishable operational states
> **Center:** A "low-friction step" that provides no feedback about its operational state is an invisible process; visible status is what makes low-friction operation trustworthy rather than reckless.

The node reports its current state through a status indicator. At minimum, the following states are distinguishable from one another: idle (never executed), running (LLM call in progress), success (output available), and error (execution failed). The user can determine the node's state at a glance without interacting with it.

### ac-output-display: Node shows its own result
> **Center:** A pipeline step whose output is only visible to downstream consumers but not to the user violates observability; each step must be independently inspectable to diagnose variation in the chain.

When execution succeeds, the node displays the LLM's response directly within the node body. The displayed output is the same content delivered to downstream nodes. The output remains visible until the next execution replaces it.

### ac-error-surfacing: Errors are reported, not swallowed
> **Center:** A "low-friction step" that silently fails is worse than no step at all; surfacing errors is what distinguishes automation from abandonment.

When the LLM provider returns an error (rate limit, token limit, network failure, model unavailability, malformed response), the node displays a meaningful error message to the user. The error state is visually distinguishable from success and idle states. The node does not display stale successful output alongside an error — the error replaces the prior output.

### ac-upstream-error-halt: Upstream failure prevents execution
> **Center:** Composability in a pipeline means failure states propagate with defined behavior; executing on garbage input violates the premise that this is reliable "plumbing."

When an upstream node that the AI Transform depends on is in an error state, the AI Transform does not execute. It indicates that its input is unavailable or in error. When the upstream error is resolved and inputs become available, the AI Transform becomes eligible to execute again (automatically in auto mode, or on user trigger in manual mode).

### ac-execution-toggle: Per-node auto/manual re-execution control
> **Center:** "Low-friction" does not mean "uncontrolled"; the toggle gives users authority over the execution rate of each pipeline step, which is the primary control surface for managing LLM cost and output quality in a spatial pipeline.

Each AI Transform node has a toggle that switches between two modes. In auto mode, the node re-executes when its upstream inputs change. In manual mode, the node executes only when the user explicitly triggers it. The toggle setting persists as part of the node's data. The default mode is manual.

### ac-input-mode-freetext: Free text input resolution
> **Center:** The simplest possible input mode — all connected content concatenated into an undifferentiated text block — is the default that makes the "pipe fitting" metaphor concrete for the common case.

In free text mode, all connected inputs are concatenated into a single text block and provided to the LLM alongside the user's instruction. The user does not need to reference inputs by name. This is the default input mode.

### ac-input-mode-named: Named input references with templating
> **Center:** Named references let users write instructions that distinguish between multiple inputs ("compare {{source}} with {{reference}}"), which is necessary for multi-input pipeline steps to be meaningful rather than ambiguous.

In JSON/named mode, the user can reference specific connected inputs by their connection label within the instruction (e.g., `{{input_name}}`). Each connection's label maps to its resolved content. Unresolved references (labels that don't match any connection) produce a clear error, not silent empty substitution.

### ac-model-selection: User can choose the LLM provider and model
> **Center:** Different processing tasks have different cost/quality/speed tradeoffs; model selection lets the user tune each pipeline step appropriately, which is essential for a "composable" system where steps serve different purposes.

The node allows the user to select a provider and model for its LLM call. The selection persists as part of the node's data. The node defaults to a sensible system-level default so that users who don't care about model choice are not blocked.

### ac-visual-distinction: Visually distinct from Chat and Transform nodes
> **Center:** If the AI Transform is visually indistinguishable from Chat, users cannot tell plumbing from conversation at a glance, and the conceptual distinction that justifies a separate node type collapses.

The AI Transform node is visually smaller and simpler than the Chat node. It does not display a message list, a conversational input textarea, or a reset button. Its visual elements are limited to: instruction field, output display, status indicator, execution controls, and settings. A user who has both Chat and AI Transform nodes on their canvas can immediately distinguish which is which.

### ac-no-conversation-ui: No conversational interaction model
> **Center:** The exclusion test in the whiteboard defines the boundary — "a prompt playground for iteratively testing prompts" is explicitly out; the absence of conversational UI is what enforces "non-interactive."

The node has no message history, no user/assistant turn-taking, no conversational threading. Each execution is independent: instruction plus inputs in, single response out. Editing the instruction and re-running produces a new result that replaces the old one, not a new entry in a conversation.

### ac-streaming-feedback: Progressive output display during execution **(E)**
> **Center:** A low-friction step that shows no sign of life for 5-15 seconds undermines user trust; streaming feedback is what makes "running" a credible state rather than an anxious one.

While the LLM is generating its response, the node progressively displays output as it arrives rather than waiting for the complete response. This criterion passes if implemented coherently enough to assess the experience, not if the streaming is optimally smooth.

## Scope

**IN (building):**
- AI Transform as a new node type in the workspace
- Instruction field with persistence
- Pipeline input resolution (free text and named modes)
- Pipeline output compatible with existing downstream consumption
- Status indicator (idle, running, success, error)
- Auto/manual execution toggle (per-node, persisted)
- Model/provider selection (per-node, persisted)
- Error surfacing (LLM errors and upstream errors)
- Visual distinction from Chat node

**OUT (explicitly not building):**
- Prompt history or instruction versioning
- Output quality assessment or scoring
- Multi-turn memory across executions
- Conversational UI or turn-taking
- Special chaining orchestration beyond existing pipeline behavior
- Approval gates or human-in-the-loop review steps
- Prompt templates library or sharing

**DEFERRED (future):**
- Cost or token usage display per execution
- Execution duration display
- Batch execution of multiple AI Transform nodes
- Input preview (showing what the node will send to the LLM before execution)

## Dependencies

1. **Pipeline execution infrastructure** — the existing system that resolves inputs from connected nodes, orders execution topologically, and passes results between stages
2. **Connection system** — connections with labels that identify inputs by name
3. **LLM provider infrastructure** — the existing chat API route, provider routing, and model roster
4. **Workspace persistence** — the save/load system that serializes workspace state including node data
5. **Node type system** — the existing discriminated union of node types and the canvas adapter that maps domain nodes to visual nodes
6. **TransformResult type** — the existing status/output/error type used by the pipeline to represent execution results

## User Scenarios

**Scenario 1: Single-source summarization.** A user has a long markdown node with meeting notes. They create an AI Transform node and connect the markdown node to it. They write the instruction "Summarize the key decisions and action items in 3 bullet points." They click the execute button (manual mode, the default). The status indicator shows running. After a few seconds, the node displays the summary. The user reads it, tweaks the instruction to "...in 5 bullet points with owners," and clicks execute again. The new summary replaces the old one. At no point does the node show a message list or conversation history. (ac-pipeline-input, ac-instruction-field, ac-execution-status, ac-output-display, ac-visual-distinction, ac-no-conversation-ui)

**Scenario 2: Multi-input comparison with named references.** A user has two markdown nodes — one with a project proposal, one with evaluation criteria. They connect both to an AI Transform node, labeling the connections "proposal" and "criteria." They switch the node to named input mode and write: "Evaluate {{proposal}} against each criterion in {{criteria}}. Score each criterion 1-5 with justification." They execute. The node resolves both named inputs, sends them with the instruction to the LLM, and displays the structured evaluation. They then connect this AI Transform's output to a downstream deterministic Transform that extracts the scores into a table. (ac-input-mode-named, ac-pipeline-input, ac-pipeline-output, ac-instruction-field)

**Scenario 3: Pipeline with upstream error.** A user has a chain: Markdown -> AI Transform A (set to auto) -> AI Transform B (set to auto). The user edits the markdown node. AI Transform A begins re-executing automatically. While A is running, B shows that it is waiting on upstream input. A completes successfully, and B automatically begins executing with A's new output. Now the user deletes the connection between Markdown and A. A shows an error state ("No source connected"). B does not execute; it indicates its upstream input is in error. (ac-execution-toggle, ac-upstream-error-halt, ac-execution-status, ac-error-surfacing)

**Scenario 4: Model selection for cost control.** A user is building a pipeline with three AI Transform nodes. The first two do simple extraction tasks (pull dates, pull names). The third does nuanced analysis. The user sets the first two to use a fast, inexpensive model. The third is set to a more capable model. Each node retains its model selection across page reloads. The user's choice of model does not affect how the nodes participate in the pipeline. (ac-model-selection, ac-instruction-field persistence)
