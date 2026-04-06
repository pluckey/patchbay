---
feature: vercel-deployment
center: "Making a personal creative workspace available as a multi-user service by solving identity, isolation, and resource governance without degrading the qualities that make it valuable as a personal tool."
stage: design
intensity: standard
loop_iterations: 1
last_modified: 2026-04-04T20:00:00Z
---

## Panel

- **Robert C. Martin (Uncle Bob)** — SOLID principles, clean architecture, component cohesion
- **Martin Fowler** — refactoring, enterprise patterns, evolutionary design
- **Kent Beck** — extreme programming, simple design, test-driven development

## Key Consensus

1. **Kernel is inviolate.** Zero changes to `src/kernel/`. Identity is infrastructure, not domain.
2. **No new port for auth.** Clerk provides its own context. Auth consumed at exactly two boundaries: composition root (adapter selection) and server middleware (request authorization). Adding a port would be gold plating.
3. **Port interfaces are unchanged.** StoragePort: load()/save(). BlobStoragePort: store()/retrieve()/delete(). Multi-user concern handled entirely by swapping adapter implementations.
4. **Write-behind localStorage survives for all tiers.** Synchronous localStorage write first, async server persist. Crash-recovery buffer for ac-data-loss-window.
5. **Server-mediated Supabase access.** Client never imports Supabase. All database access through existing API routes. Client adapters include Clerk auth token in fetch headers. Clerk JWT bridged to Supabase tokens.
6. **Five of 14 ACs already satisfied** by current implementation or config-only changes: ac-anonymous-ephemeral-contract, ac-versioned-storage-format, ac-default-model-works, ac-operator-model-governance, ac-invisible-persistence (save indicator is only new UI).
7. **Dual-mode: local and cloud.** Filesystem stores (`fs-workspace-store.ts`, `fs-blob-store.ts`) are retained for local development mode. They are not deleted or replaced — cloud mode adds Supabase stores alongside them. Mode is detected by the presence of `CLERK_SECRET_KEY` env var. In local mode, the app works exactly as it does today: no auth, filesystem storage, direct API keys.

## System Decomposition

| ID | Name | Type | Action | Key Attributes | Traces to ACs |
|----|------|------|--------|----------------|---------------|
| da-01 | ClerkProvider wrapper | Infra/Config | Add in `app/layout.tsx` | Conditional: wraps children only when `CLERK_SECRET_KEY` is set (cloud mode). In local mode, children render without auth wrapper | ac-zero-friction-start, ac-seamless-tier-transition |
| da-02 | Clerk containment rule | Constraint | Enforce: CLIENT Clerk imports only in `app/layout.tsx`, `app/page.tsx`, `app/use-adapter-selection.ts`, `ui/components/AuthButton.tsx`, `ui/components/SettingsDialog.tsx`. SERVER Clerk imports only in `server/middleware/auth.ts` | Same pattern as xyflow containment. Client vs server distinction avoids false positives | ac-architecture-preservation |
| da-03 | Supabase containment rule | Constraint | Enforce: Supabase imports only in `server/storage/`, `server/middleware/`, `server/config/supabase.ts`, `app/api/` | Client never sees Supabase | ac-architecture-preservation |
| da-04 | `server/middleware/auth.ts` | Server middleware | Create | Verifies Clerk JWT, extracts userId, attaches to request context. This is the ONLY server-side file that imports from `@clerk/nextjs/server`. All API routes import auth utilities from this file, never from Clerk directly | ac-isolation-boundary, ac-tiered-ai-access |
| da-05 | `server/storage/supabase-workspace-store.ts` | Server adapter | Create | Per-request Supabase client with Clerk JWT, RLS defense-in-depth. `writeWorkspace` accepts `expectedRevision` for optimistic concurrency — UPDATE uses `WHERE revision = expectedRevision`; returns conflict if 0 rows affected | ac-isolation-boundary, ac-single-workspace-entry, ac-invisible-persistence |
| da-06 | `server/storage/supabase-blob-store.ts` | Server adapter | Create | Path-prefix isolation `{user_id}/{blob_id}` | ac-isolation-boundary |
| da-07 | `server/middleware/rate-limit.ts` | Server middleware | Create | Per-tier budgets (IP for anon, userId for auth, bypass for BYOK). Uses Supabase RPC with atomic INSERT ON CONFLICT for check-and-increment. Returns 429 + Retry-After | ac-tiered-ai-access, ac-rate-limit-feedback, ac-configurable-rate-policy |
| da-08 | `app/use-adapter-selection.ts` | Composition hook | Create | Reads Clerk auth, determines tier, returns adapters. State machine: loading → anonymous / checking-migration → migrating → authenticated | ac-zero-friction-start, ac-seamless-tier-transition |
| da-09 | `client/adapters/storage/supabase-storage-adapter.ts` | Client adapter | Create | Implements StoragePort. localStorage cache + async fetch with Clerk token. Handles conflict response from workspace API by reloading | ac-invisible-persistence, ac-data-loss-window, ac-versioned-storage-format |
| da-10 | `client/adapters/storage/supabase-blob-adapter.ts` | Client adapter | Create | Implements BlobStoragePort. Fetch with Clerk token | ac-isolation-boundary |
| da-11 | `client/domain/use-cases/migrate-anonymous-workspace.ts` | Use case | Create | Reads from localStorage ports, writes to Supabase ports. Idempotent, resumable. Takes source + dest ports as args | ac-seamless-tier-transition |
| da-12 | `app/api/chat/route.ts` | API route | Modify | Add auth + rate-limit middleware. BYOK key resolution from Clerk privateMetadata | ac-tiered-ai-access, ac-default-model-works, ac-rate-limit-feedback |
| da-13 | `app/api/workspace/route.ts` | API route | Modify | Swap fs for Supabase store. Add auth middleware. Anonymous returns 401 | ac-isolation-boundary, ac-single-workspace-entry |
| da-14 | `app/api/blobs/` routes | API routes | Modify | Swap filesystem for Supabase Storage. Add auth middleware | ac-isolation-boundary |
| da-15 | `ui/components/AuthButton.tsx` | UI component | Create | Sign-in for anonymous, Clerk UserButton for authenticated. In Toolbar | ac-zero-friction-start |
| da-16 | `ui/components/SaveStatusIndicator.tsx` | UI component | Create | Hidden when synced, amber saving, red on failure. In Toolbar | ac-invisible-persistence, ac-rate-limit-feedback |
| da-17 | `ui/components/RateLimitToast.tsx` | UI component | Create | "Limit reached. Try again in Xs." with BYOK settings link | ac-rate-limit-feedback |
| da-18 | `ui/components/SettingsDialog.tsx` | UI component | Create | BYOK API key input. Saves to Clerk privateMetadata via API | ac-tiered-ai-access |
| da-19 | `app/api/user/keys/route.ts` | API route | Create | GET/PUT for BYOK keys via Clerk privateMetadata. Keys never sent to client after save | ac-tiered-ai-access |
| da-20 | `app/page.tsx` | Composition root | Modify | Use useAdapterSelection() hook. Render based on state machine | ac-zero-friction-start, ac-seamless-tier-transition |
| da-21 | workspaces table + RLS | Database migration | Create | See Data Plan for full DDL. `id UUID PK`, `user_id UUID NOT NULL` with UNIQUE index, `data JSONB`, `version GENERATED`, `revision` for optimistic concurrency, CHECK constraint on JSONB shape. RLS: `auth.uid() = user_id` | ac-isolation-boundary, ac-versioned-storage-format |
| da-22 | workspace-blobs bucket + policy | Storage migration | Create | Bucket with path-prefix policy: users access only `{user_id}/*` | ac-isolation-boundary |
| da-23 | rate_limits RPC function | Database migration | Create | Supabase RPC `check_rate_limit` with atomic INSERT ON CONFLICT DO UPDATE. No separate table needed beyond what the RPC manages | ac-tiered-ai-access, ac-configurable-rate-policy |
| da-24 | `server/config/rate-policy.ts` | Server config | Create | Reads limits from env vars: `RATE_LIMIT_ANON_RPM`, `RATE_LIMIT_FREE_RPM` | ac-configurable-rate-policy |
| da-25 | `app/middleware.ts` | Next.js middleware | Create | Clerk auth for `/api/*` routes. Does NOT block anonymous page access | ac-zero-friction-start, ac-isolation-boundary |
| da-26 | Server auth utility wrapper | Constraint | Clarify | `server/middleware/auth.ts` (da-04) is the sole server-side Clerk import point. All API routes import auth utilities from this file. This is the server-side counterpart to da-02's client containment rule | ac-architecture-preservation, ac-isolation-boundary |
| da-27 | `server/config/deployment.ts` | Server config | Create | Exports `isCloudMode(): boolean` — returns true when `CLERK_SECRET_KEY` is set. API routes and middleware use this to dispatch between filesystem and Supabase stores | ac-architecture-preservation |

## Relationship Map

```
da-01 (ClerkProvider)
  └── wraps entire app, provides auth context
      ├── da-08 (useAdapterSelection) reads auth state
      │     ├── anonymous → localStorageAdapter + indexedDbBlobAdapter (existing)
      │     ├── migrating → da-11 (migrate-anonymous-workspace)
      │     │     ├── reads from: localStorageAdapter, indexedDbBlobAdapter
      │     │     └── writes to: da-09 (supabaseStorageAdapter), da-10 (supabaseBlobAdapter)
      │     └── authenticated → da-09 + da-10 + chat/modelRoster/aiExecutor adapters
      └── da-15 (AuthButton) renders sign-in / user-avatar
            └── da-18 (SettingsDialog) → da-19 (user/keys API) → Clerk privateMetadata

da-25 (Next.js middleware)
  └── intercepts /api/* requests
      ├── da-04 (auth middleware) extracts userId from Clerk JWT
      │     ├── da-07 (rate-limit middleware) checks tier, applies limits
      │     │     └── da-24 (rate-policy config) provides values
      │     ├── da-13 (workspace API) → da-05 (supabase-workspace-store) → da-21 (table)
      │     ├── da-14 (blobs API) → da-06 (supabase-blob-store) → da-22 (bucket)
      │     └── da-12 (chat API) → resolves key (env or BYOK) → providers
      └── anonymous: rate limit by IP, no database access

da-09 (supabaseStorageAdapter): StoragePort
  ├── save(): localStorage.setItem() sync → fetch PUT /api/workspace async
  │     └── on conflict (revision mismatch): reload from remote, retry
  └── load(): fetch GET /api/workspace → fallback to localStorage

da-16 (SaveStatusIndicator) ← observes save state
da-17 (RateLimitToast) ← triggered by 429 from adapters
```

## Behavior Plan

| Behavior | Description | Traces to |
|----------|-------------|-----------|
| Anonymous adapter selection | Composition root detects no Clerk session, wires localStorage + IndexedDB adapters. Full workspace, zero auth prompts | ac-zero-friction-start, ac-anonymous-ephemeral-contract |
| Tier transition state machine | On sign-in: check localStorage for existing workspace. If present, run migration use case. Then switch to Supabase adapters | ac-seamless-tier-transition |
| Migration saga with checkpoints | Migration is a saga with checkpoints: (1) save workspace to remote, (2) for each blob: upload to remote, (3) verify remote workspace loads correctly, (4) clear local. Tracks progress via `migration_state` key in localStorage: `{ phase: 'workspace' \| 'blobs' \| 'verify' \| 'complete', blobsCompleted: string[] }`. If interrupted (browser crash, network loss), next load detects incomplete migration. On re-authentication, check for pending migration and resume from last checkpoint. Partial failure: workspace saved but blobs failed = blobs re-uploaded on next attempt, workspace not re-saved. Never clear local until remote verification succeeds | ac-seamless-tier-transition |
| Write-behind cache | All StoragePort adapters write localStorage synchronously before async remote. beforeunload flushes synchronously | ac-data-loss-window, ac-invisible-persistence |
| Optimistic concurrency | `writeWorkspace` accepts an `expectedRevision` parameter. UPDATE query includes `WHERE revision = expectedRevision`. If 0 rows affected, return conflict error. Client adapter handles conflict by reloading from remote and retrying | ac-data-loss-window, ac-invisible-persistence |
| Three-tier rate limiting | No auth = IP bucket (low limit), auth = user bucket (moderate), BYOK = bypass. Returns 429 + Retry-After | ac-tiered-ai-access, ac-rate-limit-feedback |
| BYOK key resolution | Chat API checks Clerk privateMetadata for user keys. Present = user key (no limit). Absent = platform key (limited) | ac-tiered-ai-access, ac-default-model-works |
| Rate limit env config | Values from env vars. Change + redeploy = new limits, no code change | ac-configurable-rate-policy |
| Save status observation | Adapter save() promise tracked. UI shows indicator only on error | ac-invisible-persistence |
| Rate limit feedback | Adapters catch 429, parse Retry-After. Toast renders with countdown + BYOK link | ac-rate-limit-feedback |
| Model governance | DEFAULT_MODEL in server config. Change + redeploy. Users with stored model selection unaffected | ac-operator-model-governance |

## UI Plan

**Anonymous**: Exact same workspace as today. "Sign In" button in toolbar is only new element. Full functionality, localStorage persistence, subsidized AI (IP rate limited).

**Sign-in flow**: Click "Sign In" → Clerk modal (hosted UI, no custom forms) → brief "Migrating..." indicator if localStorage has data → workspace continues seamlessly.

**Authenticated**: Same workspace plus user avatar (Clerk UserButton), Settings with BYOK, save status dot (hidden when synced, visible on error).

**Rate limit**: Toast: "AI request limit reached. Try again in {N}s. Add your own API key for unlimited access." with Settings link.

**NOT in UI**: No workspace picker, no save button, no signup wall, no pricing page, no "upgrade" nag.

## Data Plan

**Migration 001: workspaces table**
```sql
CREATE TABLE public.workspaces (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  version    INTEGER GENERATED ALWAYS AS ((data->>'version')::integer) STORED,
  revision   INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_workspace CHECK (
    data ? 'version' AND data ? 'nodes' AND jsonb_typeof(data->'nodes') = 'array'
  )
);

-- Single workspace per user for now; drop UNIQUE when multi-workspace needed
CREATE UNIQUE INDEX workspaces_user_id_idx ON public.workspaces (user_id);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspace_owner ON public.workspaces
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.revision = OLD.revision + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

**Migration 002: storage bucket**
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('workspace-blobs', 'workspace-blobs', false);
CREATE POLICY blob_owner ON storage.objects
  FOR ALL USING (bucket_id = 'workspace-blobs' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'workspace-blobs' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Migration 003: rate limit RPC**
```sql
CREATE TABLE public.rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_max INTEGER,
  p_window_seconds INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_now TIMESTAMPTZ := now();
  v_result RECORD;
BEGIN
  INSERT INTO rate_limits (key, count, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE
      WHEN rate_limits.window_start + (p_window_seconds || ' seconds')::interval < v_now
      THEN 1
      ELSE rate_limits.count + 1
    END,
    window_start = CASE
      WHEN rate_limits.window_start + (p_window_seconds || ' seconds')::interval < v_now
      THEN v_now
      ELSE rate_limits.window_start
    END
  RETURNING count, window_start INTO v_result;

  RETURN jsonb_build_object(
    'allowed', v_result.count <= p_max,
    'remaining', GREATEST(0, p_max - v_result.count),
    'reset_at', v_result.window_start + (p_window_seconds || ' seconds')::interval
  );
END;
$$ LANGUAGE plpgsql;
```

**Data format**: `data` JSONB stores the same StorageEnvelope structure. `version` column is GENERATED from the JSONB envelope (no dual source of truth). `revision` column enables optimistic concurrency control. CHECK constraint enforces JSONB shape invariants. Migration logic reads version from inside JSONB.

## Integration Plan

| Service | Integration Point | Env Vars |
|---------|-------------------|----------|
| Clerk | Client auth context (`ClerkProvider` in layout) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| Clerk | Server auth (`auth()` in `server/middleware/auth.ts` only, consumed by API routes) | Same |
| Clerk | BYOK storage (`clerkClient.users.updateUserMetadata`) | Same |
| Clerk-Supabase | JWT bridge (Clerk template → Supabase-compatible tokens) | `SUPABASE_JWT_SECRET` |
| Supabase | Workspace persistence (server-side client, per-request JWT) | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Supabase | Blob storage (Storage API, path-prefix isolation) | Same |
| Supabase | Rate limit counters (atomic RPC `check_rate_limit`) | Same |
| Vercel | Deployment (standard Next.js) | All above |

## Testing Strategy

| Test | Type | Wave | Description |
|------|------|------|-------------|
| JWT bridge smoke test | Integration | 2 | After Clerk+Supabase setup, verify a Clerk-issued JWT can read/write via Supabase RLS. Catches JWT bridge misconfiguration early |
| Adapter selection state machine | Unit | 5 | Covers all state transitions: loading→anonymous, loading→migrating→authenticated, token expiry→degraded, error→anonymous fallback |
| Migration saga | Integration | 5 | Happy path, interrupted migration (resume from checkpoint), partial blob failure (retry without re-saving workspace), re-authentication after anonymous work |
| Optimistic concurrency | Integration | 3 | Verifies concurrent writes produce conflict response, not silent overwrite. Verifies client handles conflict by reloading |
| Isolation boundary | API | 3 | Two users: verify cross-tenant access blocked at both application layer (API returns 401/403) and RLS level (direct Supabase query returns empty) |
| Rate limiting | API | 3 | Per-IP and per-user limits enforced, BYOK bypass works, 429 response includes correct Retry-After and JSON body format |

## Verification Strategy

| AC | Method | Automation |
|----|--------|-----------|
| ac-zero-friction-start | E2E: load unauthenticated, create nodes, use AI | Playwright |
| ac-anonymous-ephemeral-contract | Network: zero PUT/POST to /api/workspace for anonymous | Network mock |
| ac-seamless-tier-transition | E2E: create nodes anonymous, sign in, verify all present | Playwright + Supabase |
| ac-single-workspace-entry | UI audit: no workspace list. API: returns single workspace | Manual + static |
| ac-invisible-persistence | E2E: edit, wait, navigate away, return. Simulate error → dot | Playwright |
| ac-data-loss-window | Integration: save, block server, verify localStorage has data | Network interception |
| ac-isolation-boundary | Security: User A token → never returns User B data. RLS test | API test |
| ac-tiered-ai-access | Integration: exhaust limits per tier, verify 429 boundaries | API test |
| ac-default-model-works | E2E: new user, AI transform, verify Haiku response | Playwright |
| ac-rate-limit-feedback | E2E: exhaust limit, verify toast + Retry-After header | Playwright + API |
| ac-operator-model-governance | Deploy: change DEFAULT_MODEL, verify new default | Manual |
| ac-configurable-rate-policy | Deploy: change env var, verify new limit | Manual |
| ac-architecture-preservation | Static analysis: dependency-cruiser or ESLint rules | CI |
| ac-versioned-storage-format | Unit: save, read raw JSONB, assert version field | Unit test |

## Architectural Risks

1. **Clerk SDK leaking past containment** — Highest risk. Mitigation: containment rule + CI lint (in place from Wave 1, before any Clerk code is written).
2. **Composition root complexity** — State machine (loading/anon/migrating/auth) must stay in `use-adapter-selection.ts`, not spread across page.tsx.
3. **Blob migration reliability** — Large PDFs over slow connections. Mitigation: idempotent, resumable, per-blob tracking with checkpoint-based saga.
4. **Two-tab last-write-wins** — Mitigated for V1 by optimistic concurrency (`revision` column). Concurrent writes produce a conflict, not silent overwrite.
5. **Rate limit counter precision on serverless** — Stateless functions. Supabase RPC with atomic INSERT ON CONFLICT provides consistency without additional operational dependencies.
6. **Clerk-Supabase JWT bridge** — One-time config, easy to get wrong. Verify with integration smoke test in Wave 2.
