---
feature: ai-gateway
center: "Enabling per-conversation model selection so that the same composed context can engage different AI models."
center_test:
  excludes: "A feature that automatically selects the best model based on prompt content — good, but doesn't serve user-driven choice"
  boundary: "Simultaneous multi-model fan-out to compare outputs side-by-side — involves multiple models but the center specifies one model per conversation at a time"
stage: whiteboard
intensity: standard
loop_iterations: 1
last_modified: 2026-04-03T00:00:00Z
---

## Center

**Enabling per-conversation model selection so that the same composed context can engage different AI models.**

## Center Test

**Exclusion test:** A feature that *automatically* selects the best model based on the content of the prompt is a good feature idea -- but it does NOT serve this center. The center is about user-driven choice, not automated optimization. Auto-routing is a separate feature.

**Boundary discrimination:** A user who wants to send the same prompt to three models *simultaneously* and compare outputs side-by-side. This almost applies -- it involves multiple models and composed context -- but the center specifies "per-conversation" selection, meaning one model per conversation at a time. Simultaneous multi-model fan-out is beyond the boundary, and the spec should say no to it.

## Context

**Why now?** Six months ago there was one dominant model worth integrating. Now there are dozens of capable models from multiple providers, each with different strengths, pricing, and context windows. The AI ecosystem moved from monopoly to marketplace. Users who compose context carefully -- the kind of users a spatial workspace attracts -- are precisely the ones who care about *which* model receives their carefully composed work.

**What exists that's related?** The system already stores model and provider information per conversation -- it is carried in the data but inert. The request pathway already accepts provider and model fields but ignores them, dispatching everything to a single provider. The architecture anticipated this capability and left a slot for it. This is not a new need being imposed from outside; it is a latent capability the system's own structure is ready to express.

## Intent

**What the user wants, in their words:** "Add multi-model capability by sending requests to an AI gateway." They picture a routing layer -- a switchboard -- where a single integration point dispatches requests to any provider. They named two specific gateway products, indicating they have already researched the infrastructure and have a preferred approach.

**The picture in their head:** Configure a gateway once, then freely select models from a picker in each conversation. The workspace stays the same; only the destination changes. Infrastructure-first thinking: solve the plumbing, and model selection falls out naturally.

**The deeper intent beneath the surface request:** Freedom from provider lock-in. The ability to evaluate and switch models as the landscape evolves. Future-proofing. The analogy is a printer that works with any brand of ink, not just the one it shipped with.

## Assumptions

1. **"Model" is a sufficient unit of selection.** The user assumes picking a model by name is enough. But models differ along many axes -- capability, speed, cost, context window size, tool-use support, output format. The word "model" hides a multi-dimensional selection space that a simple dropdown may not adequately represent.

2. **A gateway abstraction normalizes provider differences.** The user assumes that routing through a gateway makes all models interchangeable. But providers differ not just in API shape but in semantics: how system prompts are interpreted, how tokens are counted, how streaming behaves, what happens under rate limits. Gateways handle routing, not semantic normalization.

3. **The interaction paradigm stays constant.** The user assumes compose-send-receive remains unchanged when multiple models are available. But the presence of choice changes behavior. Users may find themselves wanting model-specific prompt strategies, A/B testing, or different conversation patterns per model. The assumption that adding model choice is purely additive, with zero cost to the existing experience, is the most dangerous one.

4. **The workspace is ready for this without UI changes.** The user's framing is entirely about backend infrastructure (gateways). But model selection requires a user-facing mechanism -- something in the conversation that lets users see what's available and choose. The UI dimension is unmentioned but unavoidable.

5. **Both gateways are interchangeable.** The user says "support both" as if the two named gateway products are equivalent alternatives. But different gateways have different philosophies, capabilities, configuration models, and model catalogs. "Support both" may mean maintaining two distinct integration surfaces.

## Design Tensions

**Tension 1: Universality vs. Fidelity.** A single abstraction that works for all providers must either reduce to the lowest common denominator (losing provider-specific strengths like extended thinking, vision, or specialized output formats) or leak provider-specific details through the abstraction (undermining its universality). The more general the abstraction, the less it captures about any specific model's unique value.

**Tension 2: Per-node flexibility vs. Workspace coherence.** If each conversation can talk to a different model, the workspace becomes a heterogeneous system. But users expect coherent behavior -- similar prompts should yield responses with similar character. Different models interpret the same composed context very differently. Flexibility at the node level may undermine predictability at the workspace level.

**Tension 3: User control vs. Configuration complexity.** Each model may require different credentials, have different pricing, and support different features. Per-conversation model selection means the user must understand these differences to make informed choices. The feature promises empowerment but may deliver cognitive burden. There is a tension between freedom and overwhelm.

**Tension 4: Dual-gateway support vs. Unified experience.** The two named gateway products have different architectures and capabilities. Supporting both means either building to the intersection of their capabilities (limiting what's available) or building gateway-specific code paths (fragmenting the integration). The user wants "support both" but may not realize that "both" creates a maintenance surface that multiplies rather than adds.

## Open Questions

1. **What does "model" mean at selection time?** Just a name from a list? Or does the user need to see capabilities, pricing, context window limits? The answer determines whether model selection is a simple picker or a rich comparison interface.

2. **What happens to an existing conversation when the model changes?** Does history carry over? Is it a fresh start? Different models may not interpret prior responses well -- this is the "switching translators mid-document" problem.

3. **Who manages credentials and configuration for multiple providers?** Is this per-user, per-workspace, or per-deployment? The user mentioned gateway products, suggesting external configuration, but the workspace needs to discover what models are available. The boundary between workspace concerns and infrastructure concerns is undrawn.

4. **Is this for a solo user or a broader audience?** A solo developer testing models has very different needs from a team workspace where model access might be governed. Feature scope depends on the answer.

5. **Are the two named gateways alternatives or simultaneous?** "Support both" is ambiguous. Does it mean "work with either one depending on deployment" or "work with both at the same time, different conversations routing through different gateways"?

6. **What happens when a previously-selected model becomes unavailable?** Users will develop preferences and workflows around specific models. If a gateway drops a model from its catalog or a provider deprecates one, existing conversations break. Graceful degradation needs a strategy.

**Unresolved panel dissent:**

- **Scope of change (McLuhan vs. Korzybski):** McLuhan insists this feature fundamentally transforms the workspace from single-voice to multi-voice medium, and the design must acknowledge that shift. Korzybski argues the user asked for model selection, not a paradigm change, and the spec should deliver the capability without over-engineering for a transformation that may or may not emerge.

- **Abstraction depth (Hofstadter vs. Von Foerster):** Hofstadter argues the gateway abstraction should be thin -- just route requests, don't normalize model behavior. Von Foerster argues some normalization is essential -- the workspace needs a common vocabulary for model capabilities so the user can make informed choices. They agree on minimum: request routing and response streaming. They disagree on whether capability metadata belongs in the abstraction.

## Alternatives Considered

**Direct provider integration (no gateway).** Build a separate integration for each provider without a gateway intermediary. Maximum fidelity to each provider's strengths, no third-party dependency. But the maintenance burden scales linearly with providers, and it directly contradicts the user's stated approach.

**Single gateway commitment.** Pick one gateway product instead of abstracting across two. Simpler integration, no abstraction layer needed. But it creates vendor lock-in at the gateway level -- ironic for a feature motivated by avoiding model lock-in.

**Thin custom routing layer.** Build a minimal routing layer that maps provider and model to the right endpoint and credentials, with no gateway product dependency. Zero third-party dependency, full control. But this rebuilds what gateways already provide: rate limiting, fallbacks, observability, unified billing.

**Why the gateway direction prevails:** The user's choice signals they want the operational benefits gateways provide beyond simple routing -- observability, fallback chains, rate limit management, unified access.

## Non-Functional Context

**Audience:** Power users who compose AI context deliberately -- developers, researchers, content professionals who already understand model differences. They do not need hand-holding on model selection. They need the mechanism to be fast and non-intrusive.

**Scale:** Single-user workspace. The scale concern is not concurrent users but concurrent models -- a user might have 5-10 conversations, each potentially engaging a different model. The system must handle multiple concurrent streaming responses without interference.

**Performance:** Model selection must not add latency to the request path. The routing decision should be fully resolved before the request is dispatched. Streaming responses must behave uniformly regardless of which provider sits behind the gateway.

**Timeline:** The user named specific products and has clearly researched the approach. This reads as a "next feature" request, not a "someday" aspiration. The phasing question matters: the minimum viable slice is likely model selection in the UI plus one gateway backend, with the second gateway added once the abstraction is validated.

**Infrastructure:** The mention of specific gateway products implies the user may already have accounts or established preferences. Credential and endpoint configuration is an infrastructure concern that lives outside the workspace -- likely environment-level configuration. The workspace needs to discover what is available, not manage the infrastructure itself.
