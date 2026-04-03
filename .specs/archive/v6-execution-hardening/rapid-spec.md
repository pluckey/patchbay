---
feature: v6-execution-hardening
center: "The wave execution protocol must handle the failure modes that its first real-world execution exposed — infrastructure failures, semantic quality gaps, and minimum viable parallelism thresholds — without adding ceremony to the common case."
center_test:
  excludes: "Adding empirical self-analysis before self-redesign — valuable but a different feature (process change, not execution fix)"
  boundary: "Setting a minimum wave size threshold — initially scoped as platform concern but is actually a protocol concern because the protocol decides when to parallelize"
archetypes: [quality-gate]
mode: express
analogues: [feature-architect-v6]
---

## Acceptance Criteria

### ac-infrastructure-retry: Agent infrastructure failures trigger retry before escalation
When a parallel agent fails due to infrastructure (API error, timeout, no response) rather than a task-level BLOCKED verdict, the orchestrator retries the task once. If the retry also fails, the orchestrator executes the task directly (inline fallback). Infrastructure failures are logged but do not trigger the wave boundary gate's failure attribution — they are not task-level errors.

### ac-prompt-iteration: Prompt-template tasks acknowledge post-execution iteration
Tasks that produce prompt templates (roundtable prompts, gate prompts) include a done-when addendum: "Prompt quality is verified by a single test invocation or manual review. If the prompt structurally satisfies done-when criteria but produces hollow output, post-execution refinement is expected and does not constitute a task failure."

### ac-minimum-wave-size: Parallelism requires 3+ independent tasks per wave
Waves with fewer than 3 tasks execute sequentially even if tasks are independent. The overhead of agent dispatch, briefing, and result collection exceeds the parallelism benefit for 2-task waves. Single-task waves already execute sequentially (v6 ac-sequential-equivalence). This extends that principle: 2-task waves also execute sequentially.

### ac-brief-completeness: Agent briefs enumerate all cross-references requiring update
When a task renames or replaces a concept (e.g., Destroyer → Jacobi), the agent brief must list every file location where the old concept is referenced — not just the primary file being edited. The Files field scopes write access; the brief must also scope awareness of downstream references.

## Tasks

### t-execution-retry: Add infrastructure failure retry to execution.md wave dispatch
> **Traces:** ac-infrastructure-retry
> **Status:** pending

- **Done when**: `phases/execution.md` Wave Execution section includes: after agent dispatch, if an agent returns an infrastructure error (non-BLOCKED failure), retry once. If retry fails, orchestrator executes the task inline. Infrastructure failures logged as `INFRA-RETRY` or `INFRA-FALLBACK` in log.md. Wave boundary gate does not process infrastructure failures as task-level errors.

### t-prompt-iteration-note: Add prompt iteration guidance to execution.md and spec-model.md
> **Traces:** ac-prompt-iteration
> **Status:** pending

- **Done when**: (1) `phases/execution.md` Build section includes a note that prompt-template tasks may require post-execution quality review beyond structural done-when criteria. (2) `spec-model.md` Element Format section includes guidance that done-when criteria for prompt-producing tasks should include "test invocation or manual review confirms the prompt produces the intended analytical behavior, not just the intended output structure."

### t-minimum-wave-size: Add 3-task minimum for parallel dispatch to execution.md
> **Traces:** ac-minimum-wave-size
> **Status:** pending

- **Done when**: `phases/execution.md` Wave Planning section states that waves with fewer than 3 tasks execute sequentially regardless of independence. The wave plan display still shows the wave structure (for transparency) but labels 1-2 task waves as `(sequential)`.

### t-brief-cross-references: Add cross-reference enumeration to agent brief template in execution.md
> **Traces:** ac-brief-completeness
> **Status:** pending

- **Done when**: The Agent Brief Template in `phases/execution.md` includes a `CROSS-REFERENCES` section: "The following locations reference concepts this task modifies: {list of file:line references}. Verify these are consistent with your changes before reporting COMPLETE."
