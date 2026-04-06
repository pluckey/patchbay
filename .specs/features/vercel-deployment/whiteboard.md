---
feature: vercel-deployment
center: "Making a personal creative workspace available as a multi-user service by solving identity, isolation, and resource governance without degrading the qualities that make it valuable as a personal tool."
center_test:
  excludes: "Real-time collaborative editing — multiple users simultaneously editing the same workspace with cursor presence and conflict resolution. The center specifies isolated personal workspaces accessed as a service, not shared authorship."
  boundary: "Pre-built workspace templates for new users to clone. Almost serves the center (relates to accessibility) but addresses content onboarding, not identity/isolation/governance infrastructure."
stage: whiteboard
intensity: standard
loop_iterations: 1
last_modified: 2026-04-04T16:00:00Z
---

## Center

Making a personal creative workspace available as a multi-user service by solving identity, isolation, and resource governance without degrading the qualities that make it valuable as a personal tool.

## Center Test

**Exclusion test**: Real-time collaborative editing — multiple users simultaneously editing the same workspace with cursor presence and conflict resolution. The center excludes it because the center specifies isolated personal workspaces accessed as a service, not shared authorship. Collaborative editing solves a different problem and introduces complexity orthogonal to identity/isolation/governance.

**Boundary discrimination**: Pre-built workspace templates that new users can clone as a starting point. This almost serves the center — it relates to making the service accessible. But templates address content onboarding, not the identity/isolation/governance infrastructure the center defines as the core problem. Templates presuppose the hosting infrastructure already exists.

## Context

The tool works as a personal instrument. The trigger for this transition is a desire to share it with others — a small community of knowledge workers. A prior whiteboard exploration of remote persistence already resolved key design questions: the workspace is a single document artifact (not a collection of independently queryable records), stored as a coherent blob rather than relationally normalized.

The AI gateway dimension adds urgency: currently, every deployment requires the operator to obtain and configure API keys from multiple providers. The gateway pattern centralizes this. The subsidized default model enables a "try it without any setup" experience — likely the precipitating factor: the moment the user realized they could offer AI access without requiring each visitor to bring their own credentials.

The existing port-based architecture was built for adapter swappability. The current local storage implementation defines the quality bar — instantaneous save, zero-latency load — that the hosted version must match or visibly justify falling short of.

## Intent

The picture in the user's head: a deployed web application at a URL. A new visitor arrives, signs in with social login, and immediately sees an empty workspace. They add content — text, documents, AI interactions — and it saves automatically. They close the tab, come back the next day, everything is there. AI features work immediately without configuring anything.

The user sees themselves as the operator — deploying, monitoring, absorbing the AI cost. "Tenant isolation" language suggests platform thinking (many independent users), not just a personal cloud instance.

The deeper intent is demonstration — sending someone a URL and having them experience spatial AI context composition without any setup. The subsidized model and zero-config framing both support this.

## Assumptions

1. **The existing abstractions are sufficient for this swap.** Mostly true for workspace persistence (save/load) and model listing. May not hold for binary storage (files on disk vs. remote object stores have different semantics), streaming AI responses (a gateway may alter the streaming contract), or the synchronous beforeunload flush (no remote equivalent).

2. **Identity is a bolt-on concern.** But identity changes the data model (workspaces need an owner), the persistence path (user-scoped storage), and the interface (sign-in screen, user context, sign-out). It is cross-cutting, not peripheral.

3. **The local experience transfers to remote hosting.** The 300ms debounced save works locally because writes cost near-zero time. Over a network with variable latency, save timing, failure characteristics, and user-perceived reliability all change.

4. **"Adapter swap" means minimal scope.** But the composition root also changes, the data model gains a user dimension, API routes need authentication guards, and the deployment configuration is entirely new infrastructure.

5. **The document-in-a-column pattern works at this scale.** Viable for expected user base but constrains: no efficient querying inside documents, documents can grow large, schema migrations across stored documents require strategy.

6. **The AI gateway fully replaces direct provider configuration.** Broadly true but the gateway introduces its own capabilities and constraints — model availability, rate limiting, cost attribution — that differ from direct access.

## Design Tensions

1. **"Adapter swap" vs. "Cross-cutting identity."** User identity must flow through every layer that touches persistence or AI access. Either port interfaces change (adding a user parameter — honest but breaks existing contract) or adapters capture identity at construction time (preserving contract but hiding dependency).

2. **"Zero-friction access" vs. "Resource governance."** Subsidized AI without rate limiting is unsustainable and abuse-vulnerable. Rate limiting adds friction. The more generous the subsidy, the more governance required — and governance IS friction.

3. **"Keep both storage modes" vs. "Single coherent system."** Local storage (no auth needed) vs. remote storage (auth required) = two modes with different identity models. The system must select mode at deployment time or handle both.

4. **"Responsive feel" vs. "Network-mediated persistence."** Local saves in <1ms. Remote takes 50-500ms. Optimistic updates assume save succeeded — new failure mode: user believes work is saved when it is not. The synchronous beforeunload flush safety net does not exist remotely.

5. **"Architectural purity" vs. "Deployment complexity."** Deployment introduces concerns that resist clean layering: environment detection, auth middleware, cookie handling, SSR vs. CSR decisions. The composition root's complexity increases significantly.

## Open Questions

1. **How does user identity flow through the port architecture?**
   - Korzybski: Port interfaces must change. Making identity explicit is honest.
   - Hofstadter: Adapter captures user ID at construction time via closure/constructor injection. Port contract stays clean.
   - Von Foerster: Both viable, different failure modes. Explicit parameter = wrong ID can be passed. Closure = ID invisible in type system.
   - **Status**: Unresolved.

2. **What is the save contract over a network?**
   - McLuhan: Most dangerous assumption. Remote save is fundamentally different from local. What happens on failure? Retry? Notify? Queue locally? What replaces beforeunload flush?
   - **Status**: Unresolved. Must be addressed before implementation.

3. **What are the resource limits?**
   - How many workspaces per user? How large can workspace/uploads grow? AI usage per user per time period?
   - Von Foerster: A system without resource limits is a system without viability.
   - **Status**: Unresolved. At minimum, spec needs position on whether limits exist and where enforced.

4. **Is "tenant" a user or an organization?**
   - User description says "each user sees only their own workspaces" → user = tenant.
   - Korzybski: Confirm explicitly. Organization-with-members requires an entire additional access control layer.
   - **Status**: Probably resolved (user = tenant), needs confirmation.

5. **What is the local deployment's future?**
   - Auto-detection of mode? Configuration flag? Can someone run locally without auth? Which mode is primary development target?
   - **Status**: Unresolved.

6. **How do workspace schema migrations work across many users?**
   - Current: versioned envelope with read-time migration. With many users, every load of old workspace pays migration cost. Alternative: write-time migration on deploy touches every stored workspace.
   - **Status**: Unresolved.

7. **Where do binary files go?**
   - Database (simple but large rows), object store (separate service), client-side browser storage (limits cross-device).
   - **Status**: Unresolved.

## Alternatives Considered

1. **Self-hosted / downloadable.** Eliminates multi-tenancy. Rejected: doesn't solve zero-friction access.
2. **Browser-only with optional cloud sync.** Rejected: unreliable cross-device, doesn't solve API key barrier.
3. **Full relational normalization.** Rejected by prior whiteboard: workspace is a coherent document, not independent records.
4. **Bring-your-own-key.** Eliminates AI cost problem. Rejected: reintroduces the barrier. Viable as upgrade path for power users wanting premium models.
5. **Static export with serverless.** Rejected: application is inherently interactive and stateful.

## Non-Functional Context

**Timeline**: Near-term execution priority. User familiarity with stack, prior whiteboarding, and architectural readiness suggest this is imminent.

**Audience**: Knowledge workers. Early adopters. Small initial user base — tens of users, not thousands. Subsidized AI and absence of billing confirm this.

**Scale**: Small. Single-document storage, subsidized AI, no billing, no horizontal scaling = tool shared with a community, not sold as product. Design must evolve if scale increases.

**Performance**: Critical metric is perceived responsiveness of workspace canvas. Save latency, load time, AI streaming must feel no worse than local. This is the primary risk of the medium shift.

**Infrastructure**: User has stated clear service preferences (specific auth, database, and deployment platforms). These are constraints, not open decisions. Spec focuses on integration patterns and failure modes.
