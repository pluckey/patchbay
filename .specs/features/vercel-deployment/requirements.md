---
feature: vercel-deployment
center: "Making a personal creative workspace available as a multi-user service by solving identity, isolation, and resource governance without degrading the qualities that make it valuable as a personal tool."
stage: requirements
intensity: standard
loop_iterations: 1
last_modified: 2026-04-04T00:00:00Z
---

## Expert Roundtable

**Panel:**

- **Donella Meadows** (1941--2001) -- systems scientist, lead author of *The Limits to Growth*, creator of *Leverage Points: Places to Intervene in a System*. Framework: stocks, flows, feedback loops, delays, system boundaries.
- **W. Edwards Deming** (1900--1993) -- statistician, management consultant, architect of the Japanese post-war manufacturing transformation. Framework: System of Profound Knowledge (appreciation for a system, knowledge of variation, theory of knowledge, psychology), constancy of purpose, operational definitions.
- **Steve Jobs** (1955--2011) -- co-founder of Apple, Pixar, and NeXT. Framework: radical simplicity, user experience as the starting point, design as how it works (not how it looks).

**Key points of agreement:**

1. The three-tier access model (anonymous, authenticated free, BYOK) is the most important product decision. Anonymous access IS the product demo. It must be indistinguishable from the authenticated experience in every capability except persistence.
2. The anonymous-to-authenticated transition is the highest-risk moment. If signing up loses your work, the funnel becomes a trapdoor. Migration must be atomic.
3. Tenant isolation must be enforced at the data layer, not just the application layer. Application-level guards alone are insufficient.
4. The save experience must remain invisible under normal conditions. Status indicators should appear only on failure, not on every save.
5. BYOK is a sustainability mechanism, not a power-user feature. Without it, the operator faces unbounded cost growth with no escape valve.
6. The data model must use workspace and user identifiers that permit future multi-workspace and organization features without structural rework.

**Key points of tension resolved:**

- Meadows wanted always-visible save status; Jobs wanted invisible persistence. Deming resolved: normal state is invisible, abnormal state is visible. ACs split between user-experience criterion (ac-invisible-persistence) and measurable engineering criterion (ac-data-loss-window).
- Jobs initially proposed cutting BYOK for launch. Deming argued it is structurally necessary for cost sustainability. Jobs conceded but insisted it remain a quiet capability (settings, not onboarding). BYOK stays, scoped within ac-tiered-ai-access.

**Whiteboard assessment:**

- The whiteboard captured the original intent faithfully. The center test (exclusion of collaborative editing, boundary discrimination against templates) is sound.
- The whiteboard correctly identified all four design tensions. The three-tier access model from the user's checkpoint resolves tension #3 (storage mode selection).
- The whiteboard under-specified transition dynamics: what the user experiences at tier boundaries (anonymous to authenticated), at rate limit boundaries (approaching vs. reached), and at persistence state boundaries (saved vs. saving vs. failed).
- The whiteboard did not over-scope. The deferrals (schema migration strategy, specific rate limit numbers, save failure UX for extended outages) are appropriate.
- The whiteboard missed: (a) the multi-workspace question -- resolved below as single-workspace-per-user for initial deployment; (b) operator model governance -- the ability to change the subsidized model without user impact; (c) the post-migration state of localStorage after anonymous-to-authenticated transition.

---

## Acceptance Criteria

### ac-zero-friction-start: Anonymous visitors use the full workspace without sign-in
> **Center:** "Zero-friction access" is the mechanism that makes the workspace available as a service to anyone with a URL -- gating capabilities behind sign-in degrades the personal-tool quality of immediate, barrier-free use.

A visitor who arrives at the application URL without an account can interact with the full workspace: creating nodes, editing content, connecting nodes, using AI features with the subsidized default model. No capability is gated behind sign-in except server-side persistence. The anonymous experience is functionally identical to the authenticated experience in every respect other than where data is stored.

**FAILS-when**: any workspace capability (node creation, AI chat, AI transform, pipeline execution, canvas interaction) requires sign-in before the user has experienced it.

---

### ac-anonymous-ephemeral-contract: Anonymous data carries no durability guarantee
> **Center:** Resource governance requires that the system not promise what it cannot enforce -- anonymous persistence is browser-local and outside the system's control, and misrepresenting this violates the trust relationship the service depends on.

The system stores anonymous workspace data in the browser only. The anonymous experience communicates that work is local to this browser and will not be available on other devices. The system does not promise durability for anonymous data beyond what the browser provides. The presence of server-side persistence is positioned as a reason to sign in, not as a default for all users.

**FAILS-when**: the anonymous experience implies or claims server-side persistence or cross-device availability without authentication.

---

### ac-seamless-tier-transition: Signing in preserves all anonymous work
> **Center:** The identity layer must not create a discontinuity -- if signing up destroys work, the transition from anonymous to authenticated user punishes exactly the behavior the service is trying to encourage.

When an anonymous user signs in for the first time, all workspace content created during the anonymous session (nodes, connections, content, canvas state) is migrated to server-side persistence. The migration is atomic: either all data migrates successfully or the local copy is preserved and the user is informed. After confirmed migration, the local anonymous copy is cleared to prevent split-state divergence. The user does not need to take any manual action to trigger or complete the migration.

**FAILS-when**: (a) any content, node, or connection created anonymously is missing after the user signs in, OR (b) migration partially succeeds, leaving some data on the server and some only in localStorage, OR (c) the user must manually export/import or take explicit action to preserve their work.

---

### ac-single-workspace-entry: Authenticated users land directly in their workspace
> **Center:** A personal workspace that requires navigation, selection, or creation before use has added friction that the single-user tool never had -- direct entry preserves the personal-tool quality.

Each authenticated user has a workspace that loads automatically upon sign-in. A first-time authenticated user (who did not migrate anonymous data) receives an empty workspace without being asked to create or name one. No workspace selection, listing, or management UI exists. The data model uses a workspace identifier internally so that future multi-workspace capability is not structurally precluded.

**FAILS-when**: an authenticated user must choose, name, create, or navigate to a workspace before they can begin working.

---

### ac-invisible-persistence: Workspace changes persist without explicit user action
> **Center:** The quality that makes the tool valuable as a personal instrument is that saving is not a task -- introducing a save action or persistent save-status chrome degrades the tool from instrument to application.

After authentication, workspace changes persist automatically without any explicit save action. Under normal operating conditions (network available, service healthy), the user is never asked to save, never shown a save button, and never needs to think about persistence. A persistence status indicator appears only when the system cannot confirm that recent changes have been persisted -- it surfaces failure, not routine operation.

**FAILS-when**: (a) an authenticated user must take explicit action to save their work, OR (b) routine successful saves produce visible UI indicators that demand attention, OR (c) a save failure occurs with no visible indication to the user.

---

### ac-data-loss-window: Unexpected termination loses minimal work **(E)**
> **Center:** The network-mediated persistence layer introduces a delay the local tool never had -- bounding that delay preserves the data-safety quality that makes a personal workspace trustworthy.

Under normal operating conditions, the maximum window of unrecoverable work after an unexpected session termination (tab close, browser crash, navigation away) is bounded and comparable to the current system's characteristics. A local write-behind mechanism ensures that data is captured synchronously before async remote persistence completes. The specific threshold is determined by benchmarking the current system's data loss window and iterating.

**FAILS-when**: an authenticated user loses substantially more work after an unexpected session termination than they would under the current single-user local system, under normal network conditions.

---

### ac-isolation-boundary: User data is inaccessible across tenant boundaries
> **Center:** Tenant isolation is the mechanism that makes a shared service feel like a personal tool -- if another user's data leaks in or your data leaks out, the workspace is no longer personal.

An authenticated user's stored data -- workspaces and binary assets -- is inaccessible to any other authenticated user or anonymous session. Isolation is enforced at the data layer, not solely at the application layer. Application-level access control is a necessary complement but not a sufficient substitute for data-layer enforcement. The isolation model uses a user identifier that does not structurally preclude future organization-level grouping.

**FAILS-when**: (a) a direct data-layer query (bypassing application code) can retrieve one user's workspace or assets using another user's identifier, OR (b) any API endpoint can be called with a valid session to access, modify, or enumerate another user's data.

---

### ac-tiered-ai-access: Each access tier has distinct, enforced AI constraints
> **Center:** Resource governance is the mechanism that makes subsidized AI sustainable -- without tiered enforcement, a single abusive user can exhaust the operator's subsidy and degrade the service for everyone.

Three access tiers exist with distinct AI resource constraints:

- **Anonymous**: AI features function with the subsidized default model. Usage is rate-limited by session identity (IP or equivalent). Rate limits are independent of authenticated-tier limits.
- **Authenticated free**: AI features function with the subsidized default model. Usage is rate-limited per authenticated user. Per-user limits are tracked and enforced independently of anonymous limits.
- **BYOK**: AI features function through the user's own credentials. The platform does not impose its own rate limits on AI usage for BYOK users (the user's provider may impose its own). BYOK requests do not consume the operator's AI subsidy.

Tier boundaries are enforced: an anonymous user cannot receive authenticated-tier rate allowances, and a BYOK user's requests are routed through their credentials, not the operator's.

**FAILS-when**: (a) tier boundaries are not enforced (e.g., anonymous user gets authenticated-tier rates), OR (b) a BYOK user's requests consume the operator's subsidized API allocation, OR (c) a BYOK user is rate-limited by the platform rather than only by their own provider.

---

### ac-default-model-works: AI functions immediately with no configuration
> **Center:** "Without degrading the qualities that make it valuable as a personal tool" -- the current tool's AI features work without configuration; the multi-user service must preserve this quality for every user in every tier.

AI features (chat, AI transform) function immediately for any user -- anonymous, authenticated free, or BYOK -- with the subsidized default model. No model selection, API key entry, or configuration step is required before a user's first AI interaction produces a response. The subsidized model is fast and inexpensive, optimized for the zero-configuration experience.

**FAILS-when**: a new user in any tier must configure, select, or acknowledge anything before their first AI interaction produces a response.

---

### ac-rate-limit-feedback: Rate limit activation is communicated with actionable information
> **Center:** Resource governance that manifests as silent failures degrades the tool experience more than visible limits do -- actionable communication preserves the user's agency, which is a quality of personal tools.

When a user reaches a rate limit, the system communicates this before or at the point of failure, not after a silent timeout. The communication includes enough information for the user to understand when they can try again (a time indication, not just "rate limited"). Rate limit feedback is visually consistent with the existing error-surfacing patterns in AI nodes.

**FAILS-when**: (a) an AI request fails due to rate limiting with no user-visible explanation, OR (b) the rate limit message provides no indication of when the user can retry.

---

### ac-operator-model-governance: Operator can change the subsidized default model without user impact
> **Center:** Resource governance includes the operator's ability to manage their own costs -- if the default model cannot be changed without disrupting users, the operator loses control of their primary cost lever.

The operator can change which model serves as the subsidized default without modifying stored user data, without requiring users to take any action, and without breaking existing workspaces. Users who have not explicitly chosen a different model automatically receive the current default. Users who have explicitly selected a model (e.g., BYOK users with a preferred model) are not affected by default model changes.

**FAILS-when**: changing the subsidized default model requires modifying stored workspace data, causes existing users' AI features to stop working, or overrides a user's explicit model selection.

---

### ac-configurable-rate-policy: Rate limit values are adjustable without code changes **(E)**
> **Center:** Resource governance that is hardcoded cannot respond to observed usage patterns -- adjustability is what makes governance adaptive rather than brittle.

Rate limit thresholds (per-IP for anonymous, per-user for authenticated free) can be changed by the operator without modifying application source code. Whether this requires a redeployment with new configuration values or can be changed at runtime is an implementation decision, but the values themselves are not embedded in application logic.

**FAILS-when**: changing a rate limit value requires modifying application source code (as opposed to configuration, environment, or external policy).

---

### ac-architecture-preservation: Dependency rule survives the multi-user adaptation **(E)**
> **Center:** The clean architecture is the structural quality that made the adapter-swap pattern possible in the first place -- violating it during the swap defeats the purpose of having built it.

The deployed multi-user system preserves the established dependency rule: the kernel imports nothing from client, server, or framework code; client domain imports nothing from client adapters; hooks receive adapters via dependency injection context. The multi-user adaptation (identity, persistence, AI gateway) does not introduce imports that violate these boundaries. This AC passes if the adaptation is implemented coherently enough to assess against the existing architectural rules, not if every boundary is proven theoretically optimal.

**FAILS-when**: the multi-user adaptation introduces source-code imports that violate the dependency rule documented in the project's architectural specification (CLAUDE.md).

---

### ac-versioned-storage-format: Stored workspaces include version metadata
> **Center:** The workspace is a coherent artifact -- version metadata is what makes that artifact evolvable without breaking, preserving the tool's long-term viability as a personal workspace.

The persisted workspace format includes version metadata sufficient to identify its schema generation. This metadata supports future migration (read-time or write-time, strategy deferred). A stored workspace can be unambiguously distinguished by version from workspaces stored under a different schema generation.

**FAILS-when**: a stored workspace cannot be distinguished by version from workspaces stored under a different schema, or version metadata is absent from the persisted format.

---

## Scope

**IN** (building):
- Dual-mode deployment: local (filesystem, no auth, direct API keys) and cloud (Clerk + Supabase + rate limiting)
- Authentication and identity gating for multi-user access (cloud mode)
- Tenant-isolated server-side persistence for workspaces (document-as-artifact, cloud mode)
- Tenant-isolated server-side persistence for binary assets (cloud mode)
- Three-tier access model (cloud mode): anonymous (localStorage, rate-limited AI), authenticated free (server persistence, rate-limited AI), authenticated BYOK (server persistence, user-credentialed AI)
- Rate limiting mechanism with per-IP (anonymous) and per-user (authenticated) enforcement (cloud mode)
- AI gateway with operator-subsidized default model (cloud mode)
- Anonymous localStorage persistence with no-durability contract (cloud mode)
- Atomic anonymous-to-authenticated workspace migration (cloud mode)
- Write-behind local cache for responsive save feel
- Save failure visibility (failure state only, not routine saves)
- Versioned workspace storage format
- Single workspace per user with auto-load on sign-in (cloud mode)
- Local development mode without external service dependencies (filesystem storage, no auth, direct API keys)

**OUT** (explicitly not building):
- Multi-workspace per user (data model permits, UI does not expose)
- Organization or team tenancy (schema permits, feature not built)
- Billing, payments, or subscription management
- Custom domains or white-labeling
- Real-time collaborative editing
- Monitoring or observability dashboards (system should be instrumentable, not instrumented)
- Offline-first or service worker persistence
- Workspace sharing or publishing

**DEFERRED** (future decision, not blocked):
- Schema migration strategy (mechanism -- read-time vs. write-time vs. hybrid)
- Specific rate limit threshold values
- Workspace and upload size limits (mechanism for enforcement is in scope; values are not)
- UX for persistent or extended save failures (transient retry is in scope; extended outage UX is not)
- Multi-workspace support
- Organization-level tenancy
- Model selection UI for authenticated free users beyond the default

## Dependencies

- **Existing StoragePort interface** (`src/client/domain/ports/storage-port.ts`): defines load/save contract. Will be extended or re-implemented for multi-user persistence.
- **Existing BlobStoragePort interface** (`src/client/domain/ports/blob-storage-port.ts`): defines binary asset storage. Will be re-implemented for tenant-isolated remote storage.
- **Existing workspace entity model** (`src/kernel/entities/`): includes versioned envelope pattern (currently version 7). Serves as the document format for document-as-artifact persistence.
- **Existing AI capabilities**: ChatPort, AiExecutorPort, ModelRosterPort, and their adapter implementations. AI gateway integration replaces or wraps these adapters.
- **Existing AdaptersContext / DI pattern** (`src/client/ui/app/adapters-context.tsx`): composition root that wires adapters. Multi-user adaptation changes what is wired, not the wiring pattern.
- **Existing canvas and node rendering**: all five node types (markdown, PDF, transform, chat, AI transform) and pipeline execution. These must continue to function unchanged.

## User Scenarios

**Scenario 1: The curious visitor**

Someone receives a URL to the application. They click it and land on an empty canvas (ac-zero-friction-start). No sign-in prompt blocks them. They create a markdown node, type some notes, and add an AI Transform node. They connect them, write an instruction, and execute it. The AI responds using the subsidized default model (ac-default-model-works). The workspace feels exactly like it would for an authenticated user -- same speed, same capabilities, same visual design. They notice a subtle indication that their work is stored in this browser only and will not be available elsewhere (ac-anonymous-ephemeral-contract). They close the tab. The next day, on the same browser, their work is still there (localStorage). On a different device, it is not.

**Scenario 2: The convert**

The curious visitor from Scenario 1 returns and decides to sign up. They click sign-in and authenticate through the social login provider. Upon completing authentication, their canvas reappears with every node, connection, and piece of content exactly as they left it (ac-seamless-tier-transition). They were not asked to name a workspace or perform any setup (ac-single-workspace-entry). Behind the scenes, their workspace has been migrated to server-side persistence. They continue working. Edits persist automatically -- they never see a save button or think about saving (ac-invisible-persistence). Later, they open the application on their phone. Their workspace is there. That evening, they are working intensively with AI transforms and hit the rate limit. The AI node shows a message indicating they have been rate-limited and suggests when they can try again (ac-rate-limit-feedback). They wait, then resume.

**Scenario 3: The returning user**

An authenticated user opens the application the next morning. Their workspace loads automatically (ac-single-workspace-entry). They make edits, add new nodes, rearrange the canvas. Every change persists without action. Their network drops momentarily while editing -- a subtle indicator appears noting that changes haven't synced (ac-invisible-persistence, failure state). The network returns, the indicator disappears, and their work is safe. They never lost more than a few seconds of edits even during the disruption, because the write-behind cache captured changes locally (ac-data-loss-window). At no point could another user on the platform see or access their workspace (ac-isolation-boundary).

**Scenario 4: The power user brings their own key**

An authenticated user who wants to use a more capable model navigates to their settings and enters their own API key. From this point, their AI requests route through their own credentials (ac-tiered-ai-access). They are no longer subject to the platform's rate limits on AI usage -- only their provider's own limits apply. Their requests do not consume the operator's subsidized allocation. Meanwhile, the operator decides to change the subsidized default model to a newer, cheaper option (ac-operator-model-governance). The BYOK user is unaffected -- they have explicitly chosen their own model. Free-tier users seamlessly begin using the new default without noticing the change.
