---
feature: structured-output-mode
center: "Letting users declare the expected shape of an AI node's output so downstream consumption — by humans or other nodes — requires less interpretation."
stage: requirements
intensity: standard
loop_iterations: 1
last_modified: 2026-04-04T00:00:00Z
---

### ac-output-format-toggle: User switches between text and structured output modes
> **Center:** The toggle is the entry point to structured output — without it, the user has no way to declare that they expect shaped output rather than freeform text.

The AI Transform node offers a toggle between two output format modes: **text** (existing freeform behavior) and **structured** (new mode). Default is text, preserving backward compatibility. Toggle is persisted.

### ac-schema-field-definition: User declares named fields via a schema builder
> **Center:** Declaring the expected shape requires a mechanism for defining that shape — named fields are the atomic unit of structure that downstream consumers can reference without interpretation.

In structured mode, the node presents a schema builder where the user can add, remove, and name output fields. Visible alongside the instruction field. Empty schema cannot execute.

### ac-schema-field-types: Each field declares a type from a constrained set
> **Center:** Types reduce interpretation per field — a field typed as "number" eliminates ambiguity about whether the value is text or a quantity.

Each field has a type from: **string**, **number**, **boolean**. Single-interaction type selection. Persisted with field definition.

### ac-structured-output-conformance: Successful output matches the declared schema
> **Center:** A shape declaration that the output ignores is theater — conformance makes the declaration meaningful.

When execution succeeds, output keys match declared field names and values conform to declared types. No extra fields, no missing fields.

### ac-nonconformance-error: Schema validation failure produces a visible error state
> **Center:** Hidden nonconformance is false precision — worse than having no schema at all.

Parse failure or schema mismatch = error state. Error message indicates nature of failure. No partial success display.

### ac-structured-output-display: Structured output is rendered as labeled field-value pairs
> **Center:** Humans consuming the output need a representation matching the shape they declared — seeing fields filled proves the declaration worked.

Output panel shows each field as a labeled value. Human-readable, not raw JSON. Type-appropriate rendering.

### ac-structured-pipeline-output: Downstream nodes receive structured output as a JSON string
> **Center:** Machine consumers require a parseable format — JSON serialization preserves the text-based pipeline contract while encoding the declared shape.

Content delivered to downstream nodes is the JSON string serialization. Preserves existing pipeline contract.

### ac-schema-persistence: Schema definition persists across save, load, and reload
> **Center:** A shape declaration that vanishes on reload is not a declaration — persistence makes it durable.

Complete schema stored in node data. Survives save/load/reload. Storage migration handles existing nodes.

### ac-schema-guides-llm: The declared schema shapes the LLM's output generation
> **Center:** A schema that only validates after the fact catches failures but does not prevent them — guiding the LLM reduces nonconformance rate.

Schema provided as a structural constraint at the provider API level (tool-use for Anthropic, JSON schema for OpenAI-compat). Not prompt-only hinting.

### ac-mode-transition-clarity: Switching output format modes produces a clear state (E)
> **Center:** A mode switch that leaves ambiguous state undermines the user's ability to understand what the node will produce.

Mode switch clears stale output. Schema preserved when switching to text mode (hidden, not destroyed). Switching back restores prior schema.

## Scope

**IN:** Output format toggle, schema builder, three field types, provider-level schema constraint, validation, error state, human-readable display, JSON pipeline output, persistence, storage migration.

**OUT:** Nested objects, arrays, enums, schema inference, per-field output ports, retry-on-nonconformance, field descriptions, schema templates.

**DEFERRED:** Array field type, enum field type, nested objects, field descriptions, schema diff/migration, optional fields.

## Dependencies

1. AI Transform node (complete)
2. Pipeline text contract
3. Workspace persistence (version 7 envelope → 8)
4. LLM provider infrastructure
5. TransformResult type (output remains string)
