---
feature: transform-node-polish
center: "The transform node is a reliable, configurable execution environment that never blocks the user and surfaces enough information to debug and iterate."
center_test:
  excludes: "AI-powered transforms — changes the transform mechanism, not the execution environment"
  boundary: "Prettier code editor theme — improves aesthetics but doesn't address execution reliability or debuggability"
mode: express
analogues: []
---

## Acceptance Criteria

### ac-per-node-timeout: User can configure timeout per transform node
Timeout is stored on the TransformNodeData entity (default 5s). The user can adjust it via the transform node UI. The executor receives the timeout value and uses it instead of the hardcoded constant.

### ac-execution-state: Transform node shows execution state (idle, running, success, error, timed-out)
The status dot currently shows 3 states (gray/green/red). Add "running" (animated/pulsing) and distinguish "timed out" from other errors. The user can see at a glance whether a transform is executing, succeeded, failed, or timed out.

### ac-manual-rerun: User can manually re-trigger a transform execution
A "run" button in the transform node header re-executes the transform without requiring a source content change. Useful after fixing code or changing timeout.

### ac-output-preview: Transform node shows a truncated preview of its output
The transform node currently shows only code and error. Add a collapsible output preview (first ~200 chars of output) so the user can see results without clicking the downstream target node.

### ac-execution-duration: Transform node shows how long the last execution took
Displayed in the header or footer — e.g., "42ms" or "3.2s". Helps the user understand if their transform is slow and whether the timeout needs adjusting.

### ac-error-detail-expanded: Error messages are fully visible, not truncated
Currently errors are truncated with `truncate` CSS. Errors should be scrollable or expandable so the user can read the full stack trace.

## Tasks

### t-timeout-entity: Add timeoutMs field to TransformNodeData and createTransformNode
> **Traces:** ac-per-node-timeout
> **Status:** complete

- Add `timeoutMs: number` (default 5000) to `TransformNodeData` in `kernel/entities/workspace-node.ts`
- Update `createTransformNode` in `kernel/transforms/` to include `timeoutMs: 5000`
- Add `updateTransformTimeout(nodes, nodeId, timeoutMs)` kernel transform
- **Done when**: `npx tsc --noEmit` passes

### t-executor-timeout-param: Pass timeout to executor instead of hardcoded constant
> **Traces:** ac-per-node-timeout
> **Status:** complete

- Change `TransformExecutorPort.execute` signature to accept `timeoutMs?: number`
- Update `js-evaluator.ts` to use passed timeout (fallback to 5000)
- Update `execute-pipeline.ts` to pass `transformNode.timeoutMs` through
- **Done when**: `npx tsc --noEmit` passes, timeout is respected per-node

### t-execution-state: Add running/timed-out states to TransformResult and pipeline hook
> **Traces:** ac-execution-state, ac-execution-duration
> **Status:** complete

- Extend `TransformResult` with `{ status: "running" }` and add `durationMs?: number` to success/error variants
- Update `use-pipeline-execution.ts` to set "running" state before execution starts and record duration on completion
- Update `js-evaluator.ts` to distinguish timeout errors (e.g., include `timedOut: true` in error result)
- **Done when**: pipeline results include running state and duration

### t-transform-node-ui: Update TransformNode with timeout config, re-run, output preview, duration, full errors
> **Traces:** ac-per-node-timeout, ac-manual-rerun, ac-output-preview, ac-execution-duration, ac-error-detail-expanded, ac-execution-state
> **Status:** complete

- Add timeout selector to header (dropdown or input: 1s / 5s / 10s / 30s / 60s)
- Add "run" button to header that triggers re-execution
- Add collapsible output preview section (first 200 chars, "show more" expands)
- Show execution duration in header (e.g., "42ms")
- Replace `truncate` on error with `overflow-auto max-h-24` for scrollable errors
- Status dot: gray (idle), pulsing blue (running), green (success), red (error), orange (timed out)
- Thread new callbacks through flow-node-mapper: `onRerun(nodeId)`, `onTimeoutChange(nodeId, ms)`
- **Done when**: all UI elements visible and functional, `npm run build` passes

### t-verify: Type check, build, manual smoke test
> **Traces:** ac-per-node-timeout, ac-execution-state, ac-manual-rerun, ac-output-preview, ac-execution-duration, ac-error-detail-expanded
> **Status:** complete

- `npx tsc --noEmit` and `npm run build` pass
- Manual: create pipeline, verify running state appears briefly, verify duration shown, change timeout, trigger manual re-run, write bad code and verify full error is visible, verify output preview shows
