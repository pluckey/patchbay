---
feature: geist-design-guardrails
center: "The UI uses Geist design system conventions exclusively, enforced by documented guardrails that prevent visual drift."
center_test:
  excludes: "Adding a colorful brand theme — Geist is deliberately neutral grayscale"
  boundary: "Installing a Geist icon package — relates to the system but the center is about conventions and guardrails"
mode: express
analogues: []
---

## Acceptance Criteria

### ac-geist-token-mapping: shadcn tokens are mapped to Geist's semantic gray scale
The relationship between shadcn color tokens and Geist's 10-level gray system is documented so future changes use the right token for the right purpose.

### ac-guardrails-documented: CLAUDE.md contains Geist design rules
CLAUDE.md includes enforceable rules: which tokens to use for backgrounds, borders, and text; which fonts for which contexts; what to avoid.

### ac-no-hardcoded-colors: Existing components use semantic tokens only
All components use shadcn semantic tokens (bg-card, text-foreground, etc.) not hardcoded colors (bg-white, text-gray-500, etc.).

### ac-typography-conventions: Font usage follows Geist conventions
Geist Sans for UI text, Geist Mono for code/technical content. Documented with examples.

## Tasks

### t-audit-hardcoded: Audit and fix any remaining hardcoded colors in components
> **Traces:** ac-no-hardcoded-colors
> **Status:** complete

- **Done when**: grep for hardcoded color classes (bg-white, bg-gray-*, text-gray-*, bg-red-*, bg-blue-*) in src/components/ returns zero matches; all replaced with semantic tokens

### t-geist-guardrails: Document Geist design conventions in CLAUDE.md
> **Traces:** ac-geist-token-mapping, ac-guardrails-documented, ac-typography-conventions
> **Status:** complete

- **Done when**: CLAUDE.md contains a Design System section with: Geist gray scale mapping to shadcn tokens, allowed/forbidden patterns, typography rules, and a "when adding UI" checklist
