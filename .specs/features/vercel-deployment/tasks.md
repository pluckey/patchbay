---
feature: vercel-deployment
center: "Making a personal creative workspace available as a multi-user service by solving identity, isolation, and resource governance without degrading the qualities that make it valuable as a personal tool."
stage: tasks
intensity: standard
execution_mode: parallel
loop_iterations: 1
last_modified: 2026-04-04T20:00:00Z
---

## Expert Roundtable

**Panel:**

- **Robert C. Martin (Uncle Bob)** -- SOLID principles, clean architecture, component cohesion
- **Martin Fowler** -- refactoring, enterprise patterns, evolutionary design
- **John Carmack** -- systems optimization, shipping discipline, first-principles engineering

**Question:** "What's the optimal build order, what are the dependency traps, and where will things go wrong?"

### Round 1 -- Problem Frame

The kernel is untouched. Port interfaces are unchanged. This is entirely an adapter/infrastructure concern -- the clean architecture pays its dividend here. Identity, isolation, and rate limiting are injected at exactly two boundaries: the composition root (adapter selection) and server middleware (request authorization). The build order must respect inside-out (domain -> use cases -> adapters -> frameworks) while acknowledging that infrastructure prerequisites (database schemas, auth provider setup) are Wave 0 preconditions, not code layers.

### Round 2 -- Uncle Bob: Dependency Rule During Construction

"The Dependency Rule must hold at every intermediate build step, not just the final state. Each wave must produce code that compiles and can be verified independently.

**Trap 1 -- Server store signature change.** The current `readWorkspace(): Promise<string | null>` has no userId parameter. The Supabase store needs `readWorkspace(userId: string)`. This means the auth middleware (da-04) and the Supabase store (da-05) are co-dependent -- you need auth to get the userId, and you need the store to accept it. Build auth middleware BEFORE the Supabase stores, because the stores need userId as a parameter and the auth middleware provides it.

**Trap 2 -- Adapter selection scope.** The adapter selection hook (da-08) decides which StoragePort implementation to use based on Clerk auth state. This is a composition concern, not a domain concern. It MUST live at the composition root level (`app/`), not in `client/domain/`. It has a framework dependency (Clerk). Putting it in `client/ui/hooks/` would violate the dependency rule.

**Common Closure Principle:** Group the Supabase stores (da-05, da-06) together -- they change together. Group auth + Clerk middleware (da-04, da-25) together. Group API route modifications (da-12, da-13, da-14) together -- they all need auth + new stores."

### Round 3 -- Martin Fowler: Strangler Fig and Migration Seams

"This is a Strangler Fig migration. The key question: at what point does the system stop working as a personal tool during the transition?

**Seam 1 -- Storage backend swap.** The client already goes through `/api/workspace` HTTP endpoints. The swap is entirely server-side. The client does not know whether the route writes to filesystem or Supabase. The architecture pays off here.

**Seam 2 -- Adapter proliferation.** The design specifies `supabase-storage-adapter.ts` (da-09) as a new file. But the behavioral difference from the existing `server-storage-adapter.ts` is ONE thing: an `Authorization` header on fetch calls. A factory function -- `createAuthenticatedStorageAdapter(getToken)` -- is the Parameterize from Above pattern. One adapter, configured at the composition root. The same applies to da-10 for blob storage.

**Seam 3 -- Migration reuse.** The codebase already has `migrateToServer` in `page.tsx` that migrates localStorage to server filesystem. The anonymous-to-authenticated migration (da-11) is structurally identical: load from localStorage, save via authenticated API. The migration use case is a composition of existing pieces with an auth token. Blob migration is harder -- enumerate IndexedDB blobs, upload each via POST /api/blobs with auth token. Use the existing `X-Blob-Id` header to preserve IDs so workspace data needs no updating."

### Round 4 -- John Carmack: What Will Break at Runtime

"**Problem 1 -- Supabase in the hot path.** Load on page refresh goes from `fs.readFile` (~2ms) to Supabase SELECT (~50-200ms). Acceptable for web app cold start. But Supabase being DOWN is the real risk. The write-behind localStorage fallback already handles this -- the client falls back to localStorage if the server returns non-200. Do not optimize this away. It is the crash recovery buffer.

**Problem 2 -- Clerk token expiry during long sessions.** A user works for 4 hours. JWT expires after ~60 minutes. Next save sends expired token, server rejects. Workspace is in localStorage but NOT in Supabase. Silent data desync. Fix: Clerk's `getToken()` auto-refreshes. But if the session itself expires, `getToken()` returns null. The client adapter MUST degrade to localStorage-only mode. The SaveStatusIndicator (da-16) must show this state.

**Problem 3 -- Adapter swap causes full re-render.** The `adapters` object in `page.tsx` is created with `useMemo`. Swapping adapters on sign-in creates a new object reference, causing the entire tree (including canvas with hundreds of nodes) to re-render. Fix: the adapter selection hook should return a ref-stable proxy that internally delegates to the current adapter. The StoragePort reference stays constant; its internal implementation pointer changes.

**Problem 4 -- Rate limit race condition.** Two concurrent requests both read counter as 9 (limit 10), both increment, both proceed. 11 requests pass a limit of 10. Use Supabase RPC with atomic INSERT ON CONFLICT DO UPDATE, not read-then-write.

**Problem 5 -- Auth middleware is an extractor, not a gatekeeper.** Anonymous users get full AI access (ac-zero-friction-start). The auth middleware extracts userId if present but does NOT reject anonymous requests. Individual routes decide whether auth is required. The rate limit middleware accepts either userId or IP as the rate key."

### Round 5 -- Consensus

1. **Kernel untouched, ports unchanged** -- unanimous.
2. **Inside-out build order with infrastructure as Wave 1** -- Uncle Bob + Carmack.
3. **Factory-parameterized adapters over new files** -- Fowler + Carmack. Modify existing `server-storage-adapter` and `server-blob-adapter` to accept optional token provider. But Supabase server stores (da-05, da-06) ARE new files -- they replace filesystem I/O.
4. **Auth middleware is an extractor, not a gatekeeper** -- Carmack, endorsed by all. Anonymous users never blocked.
5. **Ref-stable adapter proxy at composition root** -- Carmack. Prevents full-tree re-render on tier transition.
6. **Migration reuses existing pattern** -- Fowler. `migrateToServer` already proves the approach.
7. **Atomic rate limit operations** -- Carmack. Supabase RPC with atomic INSERT ON CONFLICT.
8. **Write-behind localStorage is non-negotiable for all tiers** -- Carmack. The crash recovery buffer.

---

## Task List

### t-install-packages: Install Clerk and Supabase dependencies | npm install
> **Center:** Authentication and tenant-isolated persistence are the two pillars of multi-user service; these packages provide the framework integration for both.
> **Traces:** ac-zero-friction-start, ac-isolation-boundary, ac-architecture-preservation
> **Depends:** (none)
> **Files:** `package.json`
> **Wave:** 1
> **Status:** pending

- **Implements**: da-01, da-05, da-06 (prerequisites)
- **Done when**: `@clerk/nextjs` and `@supabase/supabase-js` are in `dependencies`; `npm install` succeeds; `npm run build` still compiles (no import errors, packages only in `package.json`)

---

### t-supabase-migrations: Create Supabase schema for workspaces, blobs, and rate limits | SQL migration
> **Center:** Tenant-isolated storage at the data layer is the foundational guarantee that one user's workspace is inaccessible to another -- without these tables and RLS policies, isolation is application-level only and insufficient.
> **Traces:** ac-isolation-boundary, ac-single-workspace-entry, ac-versioned-storage-format, ac-tiered-ai-access, ac-configurable-rate-policy
> **Depends:** (none)
> **Files:** `supabase/migrations/001_workspaces.sql`, `supabase/migrations/002_storage_bucket.sql`, `supabase/migrations/003_rate_limits.sql`
> **Wave:** 1
> **Status:** pending

- **Implements**: da-21, da-22, da-23
- **Done when**: (1) `workspaces` table exists with `id UUID PK DEFAULT gen_random_uuid()`, `user_id UUID NOT NULL`, `data JSONB NOT NULL`, `version INTEGER GENERATED ALWAYS AS ((data->>'version')::integer) STORED`, `revision INTEGER NOT NULL DEFAULT 1`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ` columns; CHECK constraint enforces `data ? 'version' AND data ? 'nodes' AND jsonb_typeof(data->'nodes') = 'array'`; UNIQUE index on `user_id` (single workspace per user for now; drop when multi-workspace needed); RLS enabled with `auth.uid() = user_id` policy for all operations; trigger auto-updates `updated_at` and increments `revision` on every UPDATE. (2) `workspace-blobs` storage bucket exists with private access; RLS policy enforces path-prefix isolation `(storage.foldername(name))[1] = auth.uid()::text`. (3) `rate_limits` table exists with `key TEXT PK`, `count INTEGER`, `window_start TIMESTAMPTZ`. (4) An atomic `check_rate_limit(p_key TEXT, p_max INTEGER, p_window_seconds INTEGER)` Supabase RPC function using INSERT ON CONFLICT DO UPDATE returns `{allowed: boolean, remaining: integer, reset_at: timestamptz}`.

---

### t-rate-policy-config: Define rate limit tiers and default model via environment variables | server config
> **Center:** Configurable rate policy and default model are the mechanisms that let the operator adapt resource governance and cost to observed usage without code changes -- hardcoded limits and model selection are brittle governance.
> **Traces:** ac-configurable-rate-policy, ac-tiered-ai-access, ac-operator-model-governance
> **Depends:** (none)
> **Files:** `src/server/config/rate-policy.ts`, `src/server/config/providers.ts`
> **Wave:** 1
> **Status:** pending

- **Implements**: da-24
- **Done when**: (1) `rate-policy.ts` exports `ratePolicyConfig` with `{ anonRpm: number, freeRpm: number, windowSeconds: number }` read from `RATE_LIMIT_ANON_RPM`, `RATE_LIMIT_FREE_RPM`, `RATE_LIMIT_WINDOW_SECONDS` env vars with sensible defaults (e.g., 10, 30, 60). Imports only Node.js builtins. (2) `providers.ts` modified so `DEFAULT_MODEL` is read from `DEFAULT_MODEL_PROVIDER` and `DEFAULT_MODEL_ID` env vars with current values as fallback defaults. Operator can change subsidized model via env var without code changes.

---

### t-clerk-provider: Wrap application in ClerkProvider | framework integration
> **Center:** Identity is the prerequisite for isolation, persistence, and tiered access -- ClerkProvider makes auth state available throughout the React tree without coupling domain code to the auth framework.
> **Traces:** ac-zero-friction-start, ac-seamless-tier-transition
> **Depends:** (none)
> **Files:** `src/app/layout.tsx`
> **Wave:** 1
> **Status:** pending

- **Implements**: da-01
- **Done when**: `layout.tsx` conditionally wraps children in `ClerkProvider` from `@clerk/nextjs` when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` env var is present. In local mode (no Clerk keys), children render directly without auth wrapper. In cloud mode, application renders identically for unauthenticated visitors (no sign-in wall, no loading state that blocks the workspace). `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` env vars documented in `.env.example`.

---

### t-clerk-middleware: Add Clerk Next.js middleware for API route auth | framework integration
> **Center:** The middleware layer makes Clerk session data available on every request without requiring each API route to independently verify tokens -- it is the single choke point for identity extraction.
> **Traces:** ac-zero-friction-start, ac-isolation-boundary
> **Depends:** (none)
> **Files:** `src/app/middleware.ts`
> **Wave:** 1
> **Status:** pending

- **Implements**: da-25
- **Done when**: `middleware.ts` uses `clerkMiddleware()` from `@clerk/nextjs/server` in cloud mode. In local mode (no `CLERK_SECRET_KEY`), middleware is a no-op pass-through. In cloud mode: runs on `/api/*` routes, anonymous page access is NOT blocked, `/api/chat` is accessible to anonymous users (rate-limited, not auth-gated), middleware does NOT redirect unauthenticated visitors away from the page.

---

### t-supabase-client-singleton: Create server-side Supabase client factory | server config
> **Center:** A centralized Supabase client factory prevents credential duplication across server stores and ensures all database access uses consistent configuration -- it is the single source of truth for database connectivity.
> **Traces:** ac-isolation-boundary, ac-architecture-preservation
> **Depends:** (none)
> **Files:** `src/server/config/supabase.ts`
> **Wave:** 1
> **Status:** pending

- **Implements**: da-05, da-06 (shared prerequisite)
- **Done when**: File exports `createSupabaseClient(clerkToken: string)` that returns a Supabase client initialized with `NEXT_PUBLIC_SUPABASE_URL` and the provided JWT (for RLS). Also exports `createServiceClient()` for non-user-scoped operations (rate limits). Imports only `@supabase/supabase-js` and env vars. No Clerk imports. No client-side imports.

---

### t-clerk-containment-lint: Enforce Clerk and Supabase import containment rules | architecture constraint
> **Center:** The clean architecture is what made the adapter-swap pattern possible -- if Clerk or Supabase imports leak past their containment boundaries during implementation, the architecture erodes and future adaptations become harder. This lint rule must be in place BEFORE any Clerk or Supabase code is written.
> **Traces:** ac-architecture-preservation
> **Depends:** (none)
> **Files:** `.eslintrc` or `eslint.config.mjs` (existing lint config)
> **Wave:** 1
> **Status:** pending

- **Implements**: da-02, da-03
- **Done when**: ESLint rules (or documented manual checklist if ESLint rule is impractical) enforce: (1) CLIENT `@clerk/nextjs` imports only in `app/layout.tsx`, `app/page.tsx`, `app/use-adapter-selection.ts`, `ui/components/AuthButton.tsx`, `ui/components/SettingsDialog.tsx`. (2) SERVER `@clerk/nextjs/server` imports only in `server/middleware/auth.ts`. (3) `@supabase/supabase-js` imports only in `server/storage/`, `server/middleware/`, `server/config/supabase.ts`, `app/api/`. (4) No Clerk or Supabase imports in `kernel/`, `client/domain/`, `client/adapters/` (except the contained files), or `client/ui/hooks/`.

---

### t-env-example: Document all required environment variables | configuration
> **Center:** A deployable service requires clear configuration documentation -- missing env vars are the most common deployment failure, and a single example file prevents it.
> **Traces:** ac-configurable-rate-policy, ac-default-model-works
> **Depends:** (none)
> **Files:** `.env.example`
> **Wave:** 1
> **Status:** pending

- **Implements**: da-01, da-05, da-24 (configuration prerequisites)
- **Done when**: `.env.example` lists all required env vars with placeholder values and comments: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `RATE_LIMIT_ANON_RPM`, `RATE_LIMIT_FREE_RPM`, `RATE_LIMIT_WINDOW_SECONDS`, plus existing `ANTHROPIC_API_KEY` and any OpenAI-compatible keys. Each var has a one-line comment explaining its purpose.

---

### t-deployment-mode-config: Deployment mode detection utility | server config
> **Center:** Dual-mode support (local filesystem vs. cloud Supabase) requires a single source of truth for which mode is active -- this prevents scattered env checks and ensures consistent dispatch across all API routes and middleware.
> **Traces:** ac-architecture-preservation
> **Depends:** (none)
> **Files:** `src/server/config/deployment.ts`
> **Wave:** 1
> **Status:** pending

- **Implements**: da-27
- **Done when**: File exports `isCloudMode(): boolean` that returns `true` when `CLERK_SECRET_KEY` env var is set and non-empty, `false` otherwise. Imports only Node.js builtins. No framework imports. No Clerk or Supabase imports.

---

### t-auth-middleware: Extract userId from Clerk session in API routes | server middleware
> **Center:** The auth middleware bridges the identity provider to the application's server boundary -- it extracts the user identity that enables tenant-scoped storage and per-user rate limiting without coupling route handlers to Clerk's API.
> **Traces:** ac-isolation-boundary, ac-tiered-ai-access
> **Depends:** t-clerk-middleware
> **Files:** `src/server/middleware/auth.ts`
> **Wave:** 2
> **Status:** pending

- **Implements**: da-04, da-26
- **Done when**: File exports `extractAuth(request: Request): Promise<{ userId: string | null, clerkToken: string | null }>`. Uses `auth()` from `@clerk/nextjs/server` (or equivalent). Returns `{ userId: null, clerkToken: null }` for anonymous requests -- never throws, never rejects anonymous. This file is the ONLY server-side file that imports from `@clerk/nextjs/server`. All API routes import auth utilities from this file, never from Clerk directly. Does NOT import from `client/` or `kernel/`.

---

### t-supabase-workspace-store: Supabase-backed workspace persistence with RLS | server storage
> **Center:** Per-user workspace isolation at the database level is the structural guarantee that makes a shared service feel personal -- filesystem storage cannot scope by user, Supabase with RLS can.
> **Traces:** ac-isolation-boundary, ac-single-workspace-entry, ac-invisible-persistence, ac-versioned-storage-format
> **Depends:** t-supabase-client-singleton, t-supabase-migrations
> **Files:** `src/server/storage/supabase-workspace-store.ts`
> **Wave:** 2
> **Status:** pending

- **Implements**: da-05
- **Done when**: File exports `readWorkspace(clerkToken: string): Promise<{ data: string | null, revision: number | null }>` and `writeWorkspace(clerkToken: string, json: string, expectedRevision: number): Promise<{ success: true, newRevision: number } | { success: false, conflict: true }>`. Uses `createSupabaseClient(clerkToken)` for RLS-enforced access. `readWorkspace` returns the `data` JSONB column as a string and current `revision`, or `{ data: null, revision: null }` if no row exists. `writeWorkspace` does an UPSERT for first save (INSERT with `revision = 1`); for subsequent saves, UPDATE uses `WHERE revision = expectedRevision` -- if 0 rows affected, returns `{ success: false, conflict: true }`. Imports only from `server/config/supabase.ts` and `@supabase/supabase-js` types. No kernel imports needed (operates on raw JSON strings).

---

### t-integration-smoke-test: JWT bridge and workspace CRUD smoke test | integration test
> **Center:** The Clerk-Supabase JWT bridge is a one-time configuration that is easy to get wrong -- verifying it works end-to-end before building on top of it catches the most likely misconfiguration at the earliest possible moment.
> **Traces:** ac-isolation-boundary, ac-architecture-preservation
> **Depends:** t-auth-middleware, t-supabase-workspace-store
> **Files:** `tests/integration/jwt-bridge.test.ts` (or equivalent test location)
> **Wave:** 3
> **Status:** pending

- **Implements**: Testing Strategy (JWT bridge smoke test)
- **Done when**: Test verifies: (1) A Clerk-issued JWT can authenticate against Supabase and read/write via RLS. (2) Workspace CRUD through API routes works end-to-end (create, read, update, read-back). (3) A JWT for user A cannot read user B's workspace (RLS enforcement). Test can run against Supabase local or staging instance. Catches JWT bridge misconfiguration (wrong secret, missing Clerk template, RLS policy errors) before any dependent code is built.

---

### t-supabase-blob-store: Supabase Storage-backed blob persistence with path-prefix isolation | server storage
> **Center:** Binary asset isolation (PDFs, images) requires the same tenant boundary as workspace data -- Supabase Storage with path-prefix policies extends the isolation guarantee to binary content.
> **Traces:** ac-isolation-boundary
> **Depends:** t-supabase-client-singleton, t-supabase-migrations
> **Files:** `src/server/storage/supabase-blob-store.ts`
> **Wave:** 2
> **Status:** pending

- **Implements**: da-06
- **Done when**: File exports `storeBlob(clerkToken: string, userId: string, id: string, buffer: Buffer): Promise<void>`, `retrieveBlob(clerkToken: string, userId: string, id: string): Promise<Buffer | null>`, `deleteBlob(clerkToken: string, userId: string, id: string): Promise<void>`. Storage path is `{userId}/{id}`. Uses `createSupabaseClient(clerkToken)` for RLS-enforced access. Input validation on blob ID matches existing `SAFE_ID_PATTERN`. No kernel imports.

---

### t-rate-limit-middleware: Per-tier rate limiting with atomic check-and-increment | server middleware
> **Center:** Rate limiting is the enforcement mechanism that makes subsidized AI sustainable -- without it, a single user can exhaust the operator's budget and degrade the service for all users.
> **Traces:** ac-tiered-ai-access, ac-rate-limit-feedback, ac-configurable-rate-policy
> **Depends:** t-rate-policy-config, t-supabase-migrations, t-supabase-client-singleton
> **Files:** `src/server/middleware/rate-limit.ts`
> **Wave:** 2
> **Status:** pending

- **Implements**: da-07
- **Done when**: File exports `checkRateLimit(params: { userId: string | null, ip: string, isByok: boolean }): Promise<{ allowed: boolean, remaining: number, resetAt: Date }>`. BYOK users always pass (`allowed: true`). Anonymous users rate-limited by `ip:` prefixed key using `anonRpm`. Authenticated non-BYOK users rate-limited by `user:` prefixed key using `freeRpm`. Uses the Supabase `check_rate_limit` RPC function (atomic INSERT ON CONFLICT). Returns `Retry-After` compatible data. Reads config from `ratePolicyConfig`. No Clerk imports. No kernel imports.

---

### t-workspace-route-auth: Add auth extraction and Supabase dispatch to workspace API | API route modification
> **Center:** The workspace API is the server-side boundary where identity meets persistence -- routing authenticated requests to Supabase while rejecting anonymous server persistence enforces the tier contract.
> **Traces:** ac-isolation-boundary, ac-single-workspace-entry, ac-invisible-persistence
> **Depends:** t-auth-middleware, t-supabase-workspace-store
> **Files:** `src/app/api/workspace/route.ts`
> **Wave:** 3
> **Status:** pending

- **Implements**: da-13
- **Done when**: Route dispatches to Supabase store in cloud mode, filesystem store in local mode. Both imports retained. **Cloud mode**: GET calls `extractAuth()`, if `userId` is null returns 401, otherwise calls Supabase `readWorkspace(clerkToken)` and returns `{ data, revision }`. PUT calls `extractAuth()`, if `userId` is null returns 401, otherwise calls `writeWorkspace(clerkToken, body, expectedRevision)` — returns 409 on conflict, `{ revision: newRevision }` on success. **Local mode**: GET/PUT call filesystem `readWorkspace()` / `writeWorkspace(json)` directly with no auth check (existing behavior). Uses `isCloudMode()` for dispatch. Error responses do not leak internal details.

---

### t-blob-routes-auth: Add auth extraction and Supabase dispatch to blob API routes | API route modification
> **Center:** Binary asset storage must enforce the same tenant boundary as workspace data -- without auth on blob routes, an anonymous user could overwrite an authenticated user's PDF.
> **Traces:** ac-isolation-boundary
> **Depends:** t-auth-middleware, t-supabase-blob-store
> **Files:** `src/app/api/blobs/route.ts`, `src/app/api/blobs/[id]/route.ts`
> **Wave:** 3
> **Status:** pending

- **Implements**: da-14
- **Done when**: Route dispatches to Supabase Storage in cloud mode, filesystem in local mode. Both imports retained. **Cloud mode**: All three handlers call `extractAuth()` and return 401 if `userId` is null. POST/GET/DELETE pass `clerkToken` and `userId` to Supabase blob store. **Local mode**: POST/GET/DELETE call filesystem blob store directly with no auth check (existing behavior). Uses `isCloudMode()` for dispatch.

---

### t-chat-route-auth-ratelimit: Add auth extraction and rate limiting to chat API | API route modification
> **Center:** The chat route is the gateway to the operator's AI subsidy -- rate limiting here is what prevents a single user from exhausting the budget, while auth extraction enables per-user tracking and BYOK resolution.
> **Traces:** ac-tiered-ai-access, ac-rate-limit-feedback, ac-default-model-works
> **Depends:** t-auth-middleware, t-rate-limit-middleware
> **Files:** `src/app/api/chat/route.ts`
> **Wave:** 3
> **Status:** pending

- **Implements**: da-12 (auth + rate limit portion)
- **Done when**: **Cloud mode**: POST handler calls `extractAuth()` to get userId (may be null for anonymous). Extracts client IP from request headers. Calls `checkRateLimit({ userId, ip, isByok: false })`. If `allowed` is false, returns 429 with `Retry-After` header and JSON body `{ error: "rate_limited", retryAfter: seconds, remaining: 0 }`. If allowed, proceeds with existing chat logic. Anonymous users (userId null) are allowed but rate-limited by IP. The `X-RateLimit-Remaining` header is included in all responses. **Local mode**: No auth extraction, no rate limiting. Uses env var API keys directly (existing behavior). Uses `isCloudMode()` for dispatch.

---

### t-byok-keys-route: CRUD endpoint for BYOK API keys via Clerk privateMetadata | API route
> **Center:** BYOK is the sustainability mechanism that lets power users self-fund their AI usage -- storing keys in Clerk's privateMetadata keeps them server-side only, never transmitted to or stored in the client.
> **Traces:** ac-tiered-ai-access
> **Depends:** t-auth-middleware
> **Files:** `src/app/api/user/keys/route.ts`
> **Wave:** 3
> **Status:** pending

- **Implements**: da-19
- **Done when**: GET returns provider names that have keys configured (e.g., `{ providers: ["anthropic", "openai"] }`) -- never returns the key values themselves. PUT accepts `{ provider: string, key: string }` and stores in Clerk `privateMetadata.apiKeys[provider]` via `clerkClient.users.updateUserMetadata`. DELETE accepts `{ provider: string }` and removes the key. All three require authenticated user (return 401 if anonymous). Keys are never logged, never included in error messages.

---

### t-chat-route-byok: Resolve BYOK keys in chat route for authenticated users | API route modification
> **Center:** BYOK key resolution is what makes the three-tier model real -- when a user provides their own key, their requests bypass the operator's subsidy entirely, making the service economically sustainable.
> **Traces:** ac-tiered-ai-access, ac-default-model-works
> **Depends:** t-chat-route-auth-ratelimit, t-byok-keys-route
> **Files:** `src/app/api/chat/route.ts`
> **Wave:** 4
> **Status:** pending

- **Implements**: da-12 (BYOK portion)
- **Done when**: If `userId` is present, chat route reads `privateMetadata.apiKeys[provider]` from Clerk. If a BYOK key exists for the selected provider, it is used INSTEAD of the env var key (never falls back to operator key -- that would be a billing surprise). If BYOK key is used, rate limiting is bypassed (re-calls `checkRateLimit` with `isByok: true`). If BYOK key fails (auth error from provider), returns 502 with clear error (does NOT silently fall back to operator key).

---

### t-parameterized-storage-adapter: Add optional auth token injection to server storage adapter | client adapter modification
> **Center:** A single parameterized adapter avoids duplicating the write-behind localStorage pattern -- the token is the only thing that changes between anonymous and authenticated, and parameterizing it preserves DRY while enabling tenant isolation.
> **Traces:** ac-invisible-persistence, ac-data-loss-window, ac-versioned-storage-format
> **Depends:** t-workspace-route-auth
> **Files:** `src/client/adapters/storage/server-storage-adapter.ts`
> **Wave:** 4
> **Status:** pending

- **Implements**: da-09
- **Done when**: File exports `createServerStorageAdapter(getToken?: () => Promise<string | null>): StoragePort`. When `getToken` is provided and returns a non-null token, all fetch calls include `Authorization: Bearer ${token}` header. When `getToken` is absent or returns null, fetch calls have no auth header (existing behavior). Write-behind localStorage is preserved for BOTH configurations. The existing `serverStorageAdapter` export is preserved as `createServerStorageAdapter()` (no token) for backward compatibility during migration. On 409 conflict response from workspace API, adapter reloads from remote and retries the save with the updated revision. Tracks current `revision` from server responses.

---

### t-parameterized-blob-adapter: Add optional auth token injection to server blob adapter | client adapter modification
> **Center:** Binary asset storage follows the same parameterization pattern as workspace storage -- the auth token is the only difference between anonymous and authenticated blob access.
> **Traces:** ac-isolation-boundary
> **Depends:** t-blob-routes-auth
> **Files:** `src/client/adapters/storage/server-blob-adapter.ts`
> **Wave:** 4
> **Status:** pending

- **Implements**: da-10
- **Done when**: File exports `createServerBlobAdapter(getToken?: () => Promise<string | null>): BlobStoragePort`. When `getToken` is provided and returns a non-null token, all fetch calls include `Authorization: Bearer ${token}` header. Existing `serverBlobAdapter` export preserved as `createServerBlobAdapter()` for backward compatibility.

---

### t-adapter-selection-hook: Composition hook that selects adapters based on auth state | composition logic
> **Center:** The adapter selection state machine is the mechanism that makes the tier transition seamless -- it decides which adapters the React tree receives without causing re-renders or losing canvas state.
> **Traces:** ac-zero-friction-start, ac-seamless-tier-transition, ac-anonymous-ephemeral-contract
> **Depends:** t-parameterized-storage-adapter, t-parameterized-blob-adapter, t-clerk-provider
> **Files:** `src/app/use-adapter-selection.ts`
> **Wave:** 5
> **Status:** pending

- **Implements**: da-08
- **Done when**: Hook exports `useAdapterSelection(): { adapters: Adapters, authState: 'local' | 'loading' | 'anonymous' | 'migrating' | 'authenticated' | 'error' }`. First checks if Clerk is configured (cloud mode). States: (0) `local` -- no Clerk configured (local mode), returns existing `localStorageAdapter` + `serverStorageAdapter` (no token) + `serverBlobAdapter` (no token) + existing chat/modelRoster/aiExecutor adapters. This is exactly today's behavior. (1) `loading` -- Clerk initializing, returns null adapters. (2) `anonymous` -- no Clerk session, returns `localStorageAdapter` + `indexedDbBlobAdapter` + existing chat/modelRoster/aiExecutor adapters. (3) `migrating` -- signed in with localStorage data, migration in progress. (4) `authenticated` -- signed in, returns `createServerStorageAdapter(getToken)` + `createServerBlobAdapter(getToken)` + chat/modelRoster/aiExecutor adapters. (5) `error` -- auth failed, falls back to anonymous adapters. **Critical:** The returned `adapters` object uses a ref-stable proxy pattern -- the object reference does not change when the internal adapter pointers change. This prevents full-tree re-renders on tier transition.

---

### t-migrate-anonymous-workspace: Use case for atomic anonymous-to-authenticated data migration | domain use case
> **Center:** The migration is the bridge between anonymous and authenticated tiers -- if it fails or loses data, the tier transition punishes exactly the behavior the service is trying to encourage.
> **Traces:** ac-seamless-tier-transition
> **Depends:** t-parameterized-storage-adapter, t-parameterized-blob-adapter
> **Files:** `src/client/domain/use-cases/migrate-anonymous-workspace.ts`
> **Wave:** 5
> **Status:** pending

- **Implements**: da-11
- **Done when**: Function exports `migrateAnonymousWorkspace(source: { storage: StoragePort, blobStorage: BlobStoragePort }, dest: { storage: StoragePort, blobStorage: BlobStoragePort }): Promise<{ success: boolean, blobsMigrated: number }>`. Migration uses a localStorage `migration_state` key tracking: `{ phase: 'workspace' | 'blobs' | 'verify' | 'complete', blobsCompleted: string[] }`. Phases: (1) `workspace` -- save workspace JSON to dest. (2) `blobs` -- for each blob: retrieve from source, store to dest with same ID; add to `blobsCompleted` after each success. (3) `verify` -- load workspace from dest and confirm it is readable. (4) `complete` -- clear source workspace and migration state. On interruption and re-auth, migration resumes from saved phase (workspace not re-saved if already in `blobs` phase; already-completed blobs not re-uploaded). Never clears local until remote verification succeeds. On full success, clears source workspace and `migration_state`. On partial failure, does NOT clear source -- returns `{ success: false }`. Takes port interfaces as arguments (dependency injection). Imports only from `kernel/entities` and port interfaces. No framework imports.

---

### t-auth-button: Sign-in / user avatar component in toolbar | UI component
> **Center:** The sign-in button is the only visible artifact of the identity system in the anonymous experience -- it must be unobtrusive enough to not feel like a gate, but discoverable enough that users who want persistence can find it.
> **Traces:** ac-zero-friction-start
> **Depends:** t-clerk-provider
> **Files:** `src/client/ui/components/AuthButton.tsx`, `src/client/ui/components/Toolbar.tsx`
> **Wave:** 5
> **Status:** pending

- **Implements**: da-15
- **Done when**: `AuthButton` renders Clerk's `SignInButton` (wrapped in a shadcn Button with `variant="outline"` and size `"sm"`) when unauthenticated, and Clerk's `UserButton` when authenticated. Component uses `useAuth()` from `@clerk/nextjs` (Clerk containment rule allows this file per da-02). `Toolbar.tsx` modified to include `AuthButton` in the toolbar layout. Uses semantic color tokens only (no hardcoded colors). Clerk imports contained to this file.

---

### t-save-status-indicator: Persistence status dot component | UI component
> **Center:** Invisible persistence means the user never thinks about saving -- but when persistence fails, silence would be data loss. The status indicator surfaces failure without adding noise to success.
> **Traces:** ac-invisible-persistence, ac-data-loss-window
> **Depends:** (none)
> **Files:** `src/client/ui/components/SaveStatusIndicator.tsx`
> **Wave:** 5
> **Status:** pending

- **Implements**: da-16
- **Done when**: Component accepts `status: 'synced' | 'saving' | 'error' | 'local-only'` prop. `synced`: hidden (no visual presence). `saving`: small amber dot, no text. `error`: small red dot with tooltip "Changes not synced". `local-only`: small muted dot with tooltip "Saved in this browser only". Uses semantic color tokens. Component has no adapter or port imports. Note: Toolbar.tsx integration (adding this to the toolbar) happens in t-composition-root-rewiring in Wave 6.

---

### t-rate-limit-toast: Toast notification for rate limit activation | UI component
> **Center:** Rate limit feedback preserves the user's agency -- silent failures are worse than visible limits because they leave the user guessing why the tool stopped working.
> **Traces:** ac-rate-limit-feedback
> **Depends:** (none)
> **Files:** `src/client/ui/components/RateLimitToast.tsx`
> **Wave:** 5
> **Status:** pending

- **Implements**: da-17
- **Done when**: Component renders a toast/notification with message "AI request limit reached. Try again in {N}s." when triggered. Includes a "Settings" link/button that opens the settings dialog for BYOK configuration. Accepts `retryAfterSeconds: number` prop and shows a countdown. Uses shadcn toast/sonner pattern. Visually consistent with existing error patterns in AI nodes. Component has no adapter or port imports.

---

### t-settings-dialog: BYOK API key management dialog | UI component
> **Center:** BYOK is the escape valve that makes subsidized AI economically sustainable -- the settings dialog is where a power user opts into self-funded, unlimited AI access.
> **Traces:** ac-tiered-ai-access
> **Depends:** t-byok-keys-route
> **Files:** `src/client/ui/components/SettingsDialog.tsx`
> **Wave:** 5
> **Status:** pending

- **Implements**: da-18
- **Done when**: Dialog component with API key input fields per provider. Fetches current key status from GET `/api/user/keys` (shows which providers have keys configured, never displays key values). Save sends PUT `/api/user/keys`. Delete sends DELETE `/api/user/keys`. Uses shadcn Dialog component. Key input uses `type="password"`. Only visible to authenticated users. Success/error feedback after save. Component fetches via `fetch()` directly (this is a settings-only concern, not a port-mediated operation). Uses semantic color tokens only.

---

### t-composition-root-rewiring: Rewire page.tsx to use adapter selection state machine | composition root
> **Center:** The composition root is the single place where the identity system, adapter selection, and migration converge -- getting this right means every component below receives the correct adapters for the user's current tier without knowing or caring about tiers.
> **Traces:** ac-zero-friction-start, ac-seamless-tier-transition, ac-anonymous-ephemeral-contract, ac-invisible-persistence
> **Depends:** t-adapter-selection-hook, t-migrate-anonymous-workspace, t-auth-button, t-save-status-indicator
> **Files:** `src/app/page.tsx`, `src/client/ui/components/Toolbar.tsx`
> **Wave:** 6
> **Status:** pending

- **Implements**: da-20
- **Done when**: `page.tsx` uses `useAdapterSelection()` to get adapters and auth state. Removes direct adapter imports (localStorageAdapter, serverStorageAdapter, etc.). Removes the existing `migrateToServer` effect (replaced by adapter selection hook's migration logic). Passes `adapters` from the hook to `AdaptersProvider`. Shows appropriate loading state during `loading` and `migrating` states. Shows full workspace for `anonymous`, `authenticated`, and `error` states. The existing `migrateToServer` import and effect are removed. `useMemo` for adapters is removed (adapters come from the hook). System works identically for anonymous visitors as it does today for all visitors. `Toolbar.tsx` modified to include `SaveStatusIndicator` (created standalone in Wave 5).

---

## Execution Waves

| Wave | Tasks | Depends on waves | Shared file risks |
|------|-------|-------------------|-------------------|
| 1 | t-install-packages, t-supabase-migrations, t-rate-policy-config, t-clerk-provider, t-clerk-middleware, t-supabase-client-singleton, t-env-example, t-clerk-containment-lint, t-deployment-mode-config | (none) | `package.json` (t-install-packages only); `src/app/layout.tsx` (t-clerk-provider only) |
| 2 | t-auth-middleware, t-supabase-workspace-store, t-supabase-blob-store, t-rate-limit-middleware | Wave 1 | No shared files within wave |
| 3 | t-workspace-route-auth, t-blob-routes-auth, t-chat-route-auth-ratelimit, t-byok-keys-route, t-integration-smoke-test | Wave 2 | `src/app/api/chat/route.ts` shared with Wave 4 (t-chat-route-byok) |
| 4 | t-chat-route-byok, t-parameterized-storage-adapter, t-parameterized-blob-adapter | Wave 3 | `src/app/api/chat/route.ts` (t-chat-route-byok modifies what Wave 3 created) |
| 5 | t-adapter-selection-hook, t-migrate-anonymous-workspace, t-auth-button, t-save-status-indicator, t-rate-limit-toast, t-settings-dialog | Wave 4 (t-adapter-selection-hook, t-migrate-anonymous-workspace); Wave 1 (t-auth-button depends on t-clerk-provider); (none) for standalone UI components | `src/client/ui/components/Toolbar.tsx` modified by t-auth-button only; t-save-status-indicator is standalone (no Toolbar.tsx) |
| 6 | t-composition-root-rewiring | Wave 5 | `src/app/page.tsx` (t-composition-root-rewiring only); `src/client/ui/components/Toolbar.tsx` (SaveStatusIndicator integration) |

### Wave Execution Notes

**Wave 1** -- All eight tasks are fully independent. They can execute in any order or in parallel. Infrastructure setup (packages, migrations, env vars) alongside framework integration (Clerk) and the containment lint rule. The lint rule is established here -- before any Clerk or Supabase code is written -- to prevent import boundary violations from the start.

**Wave 2** -- Four tasks, all independent of each other within the wave. Each creates a new file in `server/`. No existing files are modified. All depend on Wave 1 outputs (packages installed, Supabase tables exist, Clerk available).

**Wave 3** -- Five tasks: four API route modifications plus the integration smoke test that verifies the JWT bridge works before client code builds on it. `chat/route.ts` is the riskiest -- it is modified in both Wave 3 (auth + rate limit) and Wave 4 (BYOK). The Wave 3 modification adds auth extraction and rate limiting; the Wave 4 modification adds BYOK key resolution. These must be sequential, not parallel. The other three route modifications are independent.

**Wave 4** -- Three tasks. `t-chat-route-byok` adds BYOK to the chat route (depends on Wave 3's auth changes). `t-parameterized-storage-adapter` and `t-parameterized-blob-adapter` modify existing adapter files to accept token providers and handle conflict responses. These two are independent of each other and of `t-chat-route-byok`.

**Wave 5** -- Six tasks with mixed dependencies. `t-adapter-selection-hook` and `t-migrate-anonymous-workspace` depend on Wave 4's parameterized adapters. `t-auth-button` depends only on Wave 1's Clerk setup. `t-save-status-indicator` is a standalone presentational component with no dependencies (Toolbar.tsx integration deferred to Wave 6). The remaining UI components (rate limit toast, settings dialog) have no code dependencies on prior waves -- they are presentational components that receive data via props. **Shared file risk:** `Toolbar.tsx` is modified by `t-auth-button` only in this wave; `t-save-status-indicator` does NOT touch Toolbar.tsx.

**Wave 6** -- One task. `t-composition-root-rewiring` is the integration task that connects everything, including adding `SaveStatusIndicator` to `Toolbar.tsx`. It depends on all of Wave 5.
