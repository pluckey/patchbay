---
feature: agent-canvas-awareness
center: "This feature gives an AI coding agent ongoing structural awareness of the user's spatial workspace so that both can reason about the same evolving arrangement without the user having to manually describe it."
center_test:
  excludes: "Version history for the workspace — a good feature that improves individual recovery of past states but contributes nothing to an agent's ongoing awareness of the current arrangement."
  boundary: "A user takes a screenshot of their canvas and pastes it into a chat with the coding agent — almost serves the center because the agent receives spatial information, but fails on two counts: it is a one-time snapshot (not ongoing), and it provides pixel-level impression rather than structural access."
archetypes: [integration-wiring, surface-redesign]
stage: whiteboard
intensity: deep
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## Center

This feature gives an AI coding agent ongoing structural awareness of the user's spatial workspace so that both can reason about the same evolving arrangement without the user having to manually describe it.

## Center Test

**Exclusion test:** "Version history for the workspace — the ability to rewind the canvas to a previous state." This is a genuinely good feature that does not serve the center. It improves the individual user's ability to recover past states but contributes nothing to an AI agent's ongoing awareness of the current arrangement.

**Boundary discrimination:** A user takes a screenshot of their canvas and pastes it into a chat with the coding agent. This almost serves the center — the agent receives visual information about the spatial arrangement. But it fails on two counts: it is a one-time snapshot (not ongoing), and it provides pixel-level impression rather than structural access (the agent cannot reason about individual elements, their content, or their connections). The spec should say no to screenshot-based approaches as the primary mechanism.

## Context

The timing is driven by a broader shift in how AI agents are used: from tools you invoke with explicit instructions to collaborators who accompany your work. The user has already internalized the idea that spatial arrangement carries meaning that linear text cannot — they built an entire workspace around this premise. Now they have hit a specific wall: the tool they designed to compose context for AI consumption cannot itself share its context with AI. The canvas is a context-composition instrument that is mute to its intended audience.

What exists in adjacent domains: pair programming tools and collaborative editors have long solved the "shared visual field" problem for human-human collaboration. Screen sharing, cursors, co-editing — these are mature patterns. The novelty here is human-AI collaboration, where one party processes structure rather than perceiving visually. Chat-based AI assistants exist but require the user to serve as a manual translator between what they see spatially and what they can express sequentially. Some AI-enabled design tools offer agent observation of the canvas, but these are domain-specific and do not generalize to freeform context composition.

The user has also signaled willingness to upgrade the persistence layer, which removes what would otherwise be the most significant constraint. Currently all state is browser-local, meaning no external process can access it. The user recognizes this must change.

## Intent

In the user's own words, they want "direct, real-time visibility" so they can "rapidly iterate and get help from the coding agent in real time without having to describe the application state via text."

The picture in the user's head is pair programming. They imagine a colleague looking over their shoulder at the canvas — someone who already knows what nodes exist, how they are connected, what content they contain, and how the workspace is arranged. They imagine pointing at something and saying "this connection here isn't working" and the agent already knowing what "this" and "here" refer to. They want every conversation to start from shared understanding rather than from a cold description of the current state.

The deeper intent is to collapse the communication overhead of collaboration. Currently, getting help requires a full context dump: "I have a node called X connected to Y, and the content is Z, and when I run the pipeline it does W..." The user envisions a world where this preamble is unnecessary because the agent is already pre-loaded with structural awareness of the workspace at all times.

## Assumptions

1. **Structure is legible.** The user assumes that the spatial arrangement of nodes and connections carries meaning an agent can interpret. But spatial meaning is often personal — the user knows why node A is placed above node B, but that placement may be arbitrary or habitual rather than semantic. The user assumes their spatial choices are self-documenting. They may not be.

2. **More data means better help.** The user assumes that if the agent can "see everything," it will understand better. But information without salience is noise. A human looking over your shoulder naturally filters — they attend to what you are attending to. An agent receiving a full state dump has no attentional filter unless one is explicitly designed.

3. **The canvas state IS the relevant context.** The user assumes that what is on the canvas is what the agent needs to know. But the user's intent, frustration, hypothesis, and goal are not on the canvas. The canvas shows WHAT but not WHY. The user may overestimate how much the agent can infer from state alone.

4. **Real-time means better.** The user assumes that faster synchronization produces better collaboration. But there is a cadence to productive collaboration — sometimes you need to work privately, think, rearrange, and then invite observation. Always-on observation eliminates the editorial moment where the user decides "this is ready to be seen."

5. **The coding agent is the right observer.** The user currently works with a coding agent and assumes this same agent should observe the canvas. But the skills needed to help with canvas content (understanding context composition, node relationships, pipeline logic) may differ from the skills needed to help with code.

6. **Observation is passive.** The user says "visibility" — they imagine the agent watching. But in any coupled system, observation changes the observed. Once the agent can see the canvas, the user will begin to organize the canvas partly for the agent's benefit. The workspace will become a communication artifact, not just a thinking artifact.

The dominant analogy the user is drawing — "human looking over my shoulder" — smuggles in four properties: (a) spatial perception, (b) temporal continuity (the observer saw you build it), (c) attentional alignment (the observer notices what you are focused on), and (d) social modeling (the observer infers your intent from your actions). The feature request explicitly asks for (a) but implicitly expects all four.

## Design Tensions

**Tension 1: Fidelity vs. Comprehension.** The user wants the agent to see "what they see." But what the user sees is a rich visual gestalt — spatial proximity, color, grouping, overlap. Converting this to a structural representation necessarily loses some of this richness. Higher fidelity (more data) does not mean better comprehension — it may mean more noise. There is a tension between "give the agent everything" and "give the agent what matters."

**Tension 2: Always-on vs. Intentional.** The user says "real-time," implying continuous awareness. But productive collaboration has rhythm. Sometimes you want to say "look at this NOW" — which requires the agent not to have been watching your messy intermediate states. Always-on observation eliminates the editorial moment where the user decides what is ready to be seen. The tension is between ambient awareness and curated presentation.

**Tension 3: Privacy of process vs. Transparency of state.** Creative and analytical work involves false starts, dead ends, and ugly intermediate states. A spatial workspace is partly a thinking tool — you arrange and rearrange as you reason. If the agent observes continuously, the user's process is exposed. Some users will self-censor their exploration, keeping the canvas "tidy" for the observer. This is the panopticon effect: observation changes behavior, and not always for the better.

**Tension 4: Personal instrument vs. Shared medium.** Currently the canvas is an extension of the user's mind — it externalizes spatial reasoning for personal use. Adding an observer transforms it into a communication channel between two parties. These are fundamentally different media with different design requirements. A personal instrument optimizes for the user's cognitive flow. A communication channel optimizes for mutual intelligibility. You cannot fully optimize for both.

**Tension 5: Responsiveness vs. Coherence.** If the agent's reasoning depends on real-time canvas state, what happens when the state changes mid-response? The agent begins reasoning about one arrangement, but by the time it responds, the user has moved to a different arrangement. Tight temporal coupling creates race conditions in reasoning, not just in data. The tension is between responsiveness (tight coupling) and coherence (loose coupling with stable snapshots).

**Tension 6: Map richness vs. Map navigability.** The richer the agent's representation of the canvas, the more it mirrors reality — but the harder it is for the agent to navigate, prioritize, and respond concisely. A map that reproduces the territory at full fidelity is unwieldy. The agent needs a representation at the right level of abstraction for the task at hand. But the right level varies: troubleshooting needs different granularity than design feedback.

## Open Questions

1. **What is the unit of observation?** Is the agent aware of individual nodes? Connections? Spatial layout? Content within nodes? The user's cursor or viewport? Each carries different information at different cost. The feature request does not specify, and the answer shapes everything downstream.

2. **When does the agent observe vs. when does the user invoke?** Is this truly ambient (the agent always knows the current state) or is it triggered (the user says "help me" and the agent then reads the current state)? The user says "real-time" but may actually mean "on-demand without the description step." These produce very different designs.

3. **Does the agent only read, or can it also write?** The user mentions "collaborative design" — does this imply the agent should be able to modify the canvas? Add nodes? Rearrange connections? Suggest layout changes? If so, this is a fundamentally different feature than passive observation. If not, the collaboration is asymmetric in a way the user may not have fully considered.

4. **What does "help" look like in response to spatial state?** The user mentions troubleshooting, design, and diagnostics. But how does the agent respond? In text only? By highlighting elements? By suggesting modifications? The response modality shapes the observation modality.

5. **Is spatial arrangement meaningful or incidental?** Does position carry semantic meaning (proximity equals relatedness) or is it just where things landed during work? If spatial arrangement is meaningful, the agent needs spatial reasoning. If incidental, transmitting position data is waste.

6. **What happens to the user's relationship with the canvas?** Once the canvas becomes observed, does the user lose the sense of it as a private thinking space? Will they create separate draft and shared workspaces?

**Unresolved panel dissent:**

- *Hofstadter vs. McLuhan*: Hofstadter believes the core challenge is representational — how to create a structural encoding of spatial state that preserves the analogical relationships the user perceives. McLuhan believes the core challenge is social — how to introduce an observer into a personal space without destroying what makes it personal. These lead to different design priorities and the panel did not converge.

- *Von Foerster vs. Korzybski*: Von Foerster insists that the bidirectional coupling (agent observation changing user behavior) must be a first-class design concern from the start. Korzybski believes the primary problem remains the abstraction gap — making the agent's structural model match the user's spatial reality — and that behavioral coupling is a second-order effect to be managed after the primary problem is solved.

## Alternatives Considered

**Alternative 1: Snapshot-on-demand.** The user triggers a "share state" action that serializes the current workspace and provides it to the agent. Eliminates always-on coupling and privacy concerns. But reintroduces a manual step — the user must remember to share and share again after each change. Reduces the abstraction tax but does not eliminate the synchronization tax.

**Alternative 2: Structured periodic export.** The workspace is periodically exported as a structured document that the agent can reference. Simpler, avoids real-time complexity, but introduces staleness. The agent's model may lag behind reality, reintroducing "let me tell you what changed."

**Alternative 3: Agent as a node on the canvas.** Instead of the agent observing externally, the agent is a participant within the canvas — it receives explicitly wired connections as its context. The user controls what the agent can see through the same spatial metaphor used for everything else. Gives editorial control and makes scope of awareness explicit. But requires the user to actively manage the agent's context.

**Alternative 4: Improved text summarization.** Auto-generate a text summary of the workspace that the user can copy into any conversation. Least invasive, maintains separation between workspace and agent interface. But does not achieve the experiential shift the user is seeking.

The user rejected the current workflow (manual text description) and is asking for something experientially different. Alternatives 1, 2, and 4 are improvements to the current experience but do not change its fundamental character. The reason for this direction over the alternatives is the user's correct diagnosis that the manual translation step is the limiting factor in their iteration speed.

## Non-Functional Context

**Audience:** The immediate user is the builder of the tool — a technical knowledge worker who is also the developer. High tolerance for rough edges and deep system knowledge. However, if the tool is intended to serve other knowledge workers eventually, the feature must not assume developer-level understanding of what is being shared.

**Scale:** Currently single-user, single-workspace, browser-local. The feature implicitly requires state to be accessible from outside the browser — at minimum two consumers of the same state. This is a significant shift from a self-contained application to a system with shared state.

**Performance:** "Real-time" collaboration implies latency sensitivity. The acceptable latency is tied to conversational rhythm rather than animation frame rates. The agent's awareness needs to be current enough that when the user asks a question, the agent is not working from a stale model. This likely means seconds, not milliseconds.

**Timeline:** Not specified, but the user is in an exploratory design phase.

**Infrastructure preferences:** The user explicitly noted that a more robust persistence layer is on the table. No specific approach preferences expressed.

**Risk of misunderstanding — the panel's final warnings:**

The gravest risk is building a data pipe when the user wants a collaborator. If this is understood as "synchronize state to an external consumer," the result will be technically correct but experientially hollow.

The second risk is overwhelming the agent with undifferentiated state, producing responses that are technically informed but contextually tone-deaf.

The third risk is the strange loop: the canvas is for composing context for AI, the AI observes the canvas, the AI's responses influence what the user puts on the canvas, and the canvas thus becomes partly composed by the AI for the AI. This recursive loop could be generative or degenerative depending on whether the user maintains critical distance from the agent's suggestions.
