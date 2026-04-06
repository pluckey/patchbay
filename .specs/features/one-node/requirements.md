---
feature: one-node
center: "The one node is a perspective — a spatial participant that observes its context on the canvas, contributes understanding shaped by what it attends to, and makes the canvas a medium for collective thinking rather than a surface for arranging content."
stage: requirements
intensity: focused
loop_iterations: 1
last_modified: 2026-04-04T00:00:00Z
---

## Acceptance Criteria

### ac-blank-creation: Node starts as undifferentiated potential
> **Center:** Eliminates type-as-prison — the perspective emerges from use, not from a predetermined category

A new node appears with no predetermined type or mode. The user's first meaningful interaction (typing prose, writing a viewpoint instruction, dropping a file) determines the node's initial character. No type-selection menu is required at creation time. The initial differentiation is a starting state, not a commitment — the user can always change it later.

### ac-human-perspective: User can author a viewpoint directly
> **Center:** The human voice is a first-class perspective — spatial thinking starts with what the user believes, knows, or questions

A node accepts free-form text authored by the user. This text represents the user's perspective — their assertion, question, hypothesis, or observation. The authored content contributes downstream as context shaped by the human viewpoint.

### ac-ai-perspective: Node can hold an AI-driven viewpoint
> **Center:** AI perspectives are first-class participants alongside human perspectives, not tools invoked inside containers

A node can be given a viewpoint instruction that defines how it interprets what it attends to. When connected to other nodes, it produces output shaped by both its instruction (its viewpoint) and its inputs (its attention). The output reads as a perspective — an interpretation with a stance — not a generic summary or completion. Two AI perspectives given different instructions and the same inputs produce recognizably different analytical voices.

### ac-attention-shapes-voice: Output character changes with connections **(E)**
> **Center:** Attention is what makes a perspective spatial — the node's contribution is shaped by where it sits in the topology

When the set of connections to an AI perspective node changes (a new input is added, an existing one is removed), the character of its output changes — not just the content (what it says) but the voice (how it says it). Connecting a technical perspective to user research shifts it toward empathy. Connecting it to performance data shifts it toward precision. The perspective adapts to what it attends to. *Evaluate-and-iterate: passes if the character shift is recognizable to a human reader, not if it meets a quantitative threshold.*

### ac-viewpoint-legible: Each node's perspective is visible at a glance
> **Center:** A medium for collective thinking requires that each participant's viewpoint is legible — hidden perspectives can't be composed

Every node on the canvas visibly communicates: (a) whether it is human-voiced or AI-voiced, (b) what its viewpoint is (instruction or authored stance), and (c) what it currently attends to (its connections). This information is available without opening a configuration panel or inspector — it is part of the node's visible presence on the canvas.

### ac-mutable-character: A node's perspective can evolve
> **Center:** Perspectives are alive — they evolve through use, not frozen at creation time

A node that started as a human perspective (authored text) can be given an AI viewpoint instruction, becoming a hybrid or AI perspective. A node that started as an AI perspective can have its instruction changed, shifting its viewpoint. Mode transitions preserve relevant state (authored content is retained, not destroyed). The node's visual presentation updates to reflect its evolved character.

### ac-context-staleness: Node signals when its context has shifted
> **Center:** The minimum viable form of "noticing" — the seed of the perspective's awareness of its environment

When the content of a node's connected inputs changes, the node displays a subtle indicator that its current output may no longer reflect its current context. The user can then choose to let the node re-process (update its perspective) or dismiss the indicator. The node does not auto-update — the user remains the conductor. The indicator is subtle: a gentle visual shift, not a badge or toast notification.

## Scope

**IN (building)**:
- The single node primitive (the perspective cell)
- Human-voiced and AI-voiced modes
- Attention-shaped output (connections influence character, not just content)
- Viewpoint legibility (visible perspective without opening panels)
- Mutable character (mode can evolve)
- Context staleness signaling

**OUT (explicitly not building)**:
- Unsolicited contribution beyond staleness signaling (no autonomous observations, gap detection, or contradiction flagging)
- Spatial awareness based on proximity (nearby nodes influencing each other without explicit connections)
- Inter-node dialogue (perspectives talking to each other autonomously)
- Emergent mode detection (inferring user intent from typing patterns)
- Replacing all current node types (existing types may coexist during transition)
- File/PDF import mode (the "evidence perspective" is a future mode)

**DEFERRED (future)**:
- Unsolicited observations ("I notice A and B contradict")
- Proximity-based influence (spatial position affecting perspective)
- Emergent mode selection (node infers its own mode from usage)
- Evidence/import perspective (PDF equivalent)
- Volume control (muting/activating perspectives)
- Canvas-level reflexivity (the system observing its own composition)
- Agent integration (agents as particularly active perspectives)

## Dependencies

- Existing canvas infrastructure (spatial layout, node creation, connection management)
- Existing AI execution capability (ability to send instructions + context to an AI model and receive output)
- Existing node shell (resize, duplicate, delete, drag behaviors)

## User Scenarios

### sc-problem-explorer: The problem explorer
*References: ac-blank-creation, ac-human-perspective, ac-ai-perspective, ac-attention-shapes-voice*

A developer is debugging a latency issue. They create a node and type: "API response times spike to 3s during deployments. Normal is 200ms. Happens across all regions." This is their human perspective. They create a second node with the instruction: "You are a site reliability engineer. Share your perspective on what's connected to you." They connect the first to the second. The SRE perspective responds with infrastructure-focused analysis. They create a third: "You are a product manager concerned with user impact." Same connection from the problem statement. The PM perspective responds differently — focusing on user-facing impact, SLA implications, customer communication. The developer now sees their problem from three angles simultaneously.

### sc-evolving-perspective: The evolving perspective
*References: ac-mutable-character, ac-context-staleness*

A researcher starts a node as authored text: notes from a paper they're reading. Later, they realize they want this node to actively analyze, not just hold notes. They add an instruction: "You are a methodology critic. Evaluate the research methods described in your content and inputs." The node evolves from a human-voiced container to an AI-voiced perspective — but their original notes are preserved as the node's internal content, now serving as primary material the AI perspective analyzes.

### sc-attention-shift: The attention shift
*References: ac-attention-shapes-voice, ac-context-staleness, ac-viewpoint-legible*

A user has an AI perspective with the instruction: "You are a strategic advisor." It's connected to three nodes: a market analysis, a competitor review, and a financial projection. The advisor produces strategy-focused output. The user disconnects the financial projection and connects a customer feedback summary instead. The node shows a staleness indicator. The user triggers a re-process. The advisor's output shifts — less quantitative, more empathy-driven — reflecting the changed attention.

### sc-legible-canvas: The legible canvas
*References: ac-viewpoint-legible*

A user opens a workspace with 6 perspectives. Without clicking on any node, they scan the canvas and understand the topology: "I have my problem statement (human), three analytical perspectives (AI: SRE, PM, architect), my notes (human), and a synthesis perspective (AI) that attends to all three analysts." The viewpoints and attention patterns are legible from the canvas layout itself. The arrangement reads as an argument: problem, multiple analyses, synthesis.
