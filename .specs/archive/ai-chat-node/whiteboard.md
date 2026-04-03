---
feature: ai-chat-node
center: "The chat node closes the feedback loop between spatial context arrangement and AI interpretation, letting users discover what their composition actually communicates and refine it conversationally."
center_test:
  excludes: "A batch export feature that renders canvas content to a static document — produces output but closes no feedback loop and enables no conversational refinement"
  boundary: "A context preview pane that shows the linearized prompt before sending — reveals what the composition produces but provides visibility without conversational feedback that drives discovery"
archetypes: [modality-addition, integration-wiring]
stage: whiteboard
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

# Whiteboard: AI Chat Node

## Center

The chat node closes the feedback loop between spatial context arrangement and AI interpretation, letting users discover what their composition actually communicates and refine it conversationally.

## Center Test

**Exclusion test:** A "batch export" feature that renders canvas content to a static document — it produces output but closes no feedback loop and enables no conversational refinement.

**Boundary discrimination:** A "context preview" pane that shows the linearized prompt text before sending — it reveals what the composition produces but provides visibility without the conversational feedback that drives discovery. Supporting capability, not the feature itself.

## Context

The pipeline system works end-to-end: source nodes feed transform nodes, transforms compose text. But the composed output has nowhere to go. The user has a separate earlier tool (incremental-reader-v2) with working AI conversation — multi-provider, streaming, prompt templates, per-page history. That tool is sequential and page-bound; this tool is spatial and freeform. The chat node is where the spatial tool becomes functionally complete.

The environment matters: conversational AI interfaces are ubiquitous. The risk of building "just another chat window, but embedded" is high. What makes this different is the spatial context composition that precedes the conversation — no existing tool lets users spatially arrange and transform source material and then converse with an AI about it while maintaining awareness of how the arrangement shaped the conversation.

## Intent

The user wants to complete their pipeline. Their picture: source nodes feed transform nodes, transforms compose text, that text flows into a chat node, the chat node sends it to an AI provider, and the conversation is displayed within the node on the canvas. They see this as plumbing — connecting the last pipe.

They imagine: a PDF on the left, a markdown note above, a transform node connecting both to a chat node on the right, the chat node showing an ongoing conversation that intelligently synthesizes the PDF content and the notes.

## Assumptions

1. **The hard part is the plumbing.** The user assumes the challenge is getting text to an AI. But the harder problem is helping the user understand whether their composition produced GOOD context.

2. **The chat node is a terminal.** The user calls it "the terminal node in the pipeline." But the panel's analysis shows it closes a feedback loop. Terminals don't loop.

3. **Context composition and conversation are sequential phases.** In practice, conversation reveals that context needs changing, and the user modifies upstream. The phases interleave.

4. **Multi-provider support is primary.** Because it mattered in their sequential tool. But in a system where composition is the main variable, provider choice is secondary.

5. **The spatial tool should replicate the sequential tool's model.** Per-page persistence becomes "per-what?" in a spatial world. Prompt template versioning assumes a stable template; spatial composition may make templates fluid or unnecessary.

## Design Tensions

**Conversation persistence vs. context fluidity.** Conversations accumulate history. But the canvas is mutable — the user can rearrange nodes mid-conversation. Earlier messages were responses to DIFFERENT context. Does the conversation become incoherent?

**Pipeline determinism vs. conversational emergence.** The pipeline model implies context is determined BEFORE conversation. But real conversations emerge — after the opening exchange, has the conversation evolved beyond the original context?

**Transparency vs. simplicity.** Users need to see what was actually sent to the AI. But showing the raw prompt adds cognitive load.

**Canvas primacy vs. conversation gravity.** The chat node will become the gravitational center. Users will focus on conversation, and the canvas fades to background. But the canvas IS the product.

**"Just works" vs. composition skill curve.** The AI always responds. It responds BETTER with well-composed context. But without feedback on composition quality, the user may never learn the difference.

## Open Questions

1. **Terminal or loop closure?** Does the chat node need output connections (to feed responses back as source material) or only input connections? The panel didn't resolve this.

2. **What happens when upstream context changes during an active conversation?** Options: freeze at conversation start; re-inject on each message; mark the change; show a diff. Most architecturally consequential open question.

3. **What is composed context relative to user messages?** System instruction? Preamble? Visible or hidden?

4. **One chat node or many?** User implies one. Panel argues for multiple — enabling comparative conversation across different compositions.

5. **How does conversation history persist?** Anchored to what? The node itself? Its connections? The composed context at start?

6. **When does pipeline-composed context stop mattering?** Re-inject on every message? Only the first? User-controlled?

7. **What does "well-composed context" look like?** Should the chat node signal context quality, or is the AI's response the only feedback?

## Alternatives Considered

**Clipboard export.** Copy composed context to external AI tool. Simple, but severs the feedback loop. Rejected.

**Sidebar panel.** Chat outside the spatial medium. Avoids figure/ground reversal but forecloses spatial conversation. Rejected.

**Chat as canvas node (chosen).** Highest risk, highest ceiling. Risks conversation gravity but enables the spatial conversation medium and preserves the tight feedback loop.

## Non-Functional Context

**Audience:** Single power user who reads deeply and converses with AI about complex material. High tolerance for configuration. Low tolerance for limitations vs. existing tools.

**Performance:** Canvas interaction must remain fluid while AI response streams. If streaming blocks canvas interaction, the spatial medium is destroyed.

**Cost awareness:** Multi-provider support signals cost-capability reasoning. Per-chat-node provider selection desirable.

**Migration path:** First version establishes the feedback loop. Sophistication (sycophancy detection, template versioning) added iteratively.

**Unstated critical requirement:** The chat node must not make the canvas feel like it exists to serve the chat. Spatial arrangement remains the primary creative act.
