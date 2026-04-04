<!-- Feature Architect context module. Architecture, conventions, and rules live in CLAUDE.md. This file supplements it with protocol-specific sections that CLAUDE.md doesn't cover. -->

## System Identity

Context Canvas is a spatial workspace for composing AI context, built with Next.js 16, TypeScript, Tailwind CSS 4, and @xyflow/react. It serves knowledge workers who spatially arrange source material — markdown text, PDFs, JS transforms, AI chat, and AI transforms — to compose and test context for AI consumption. The codebase lives at `/Users/home/Documents/projects/context-canvas`. Current state: functional single-user application with 5 node types, visible pipeline execution, server-side persistence, multi-provider AI chat (Anthropic native + OpenAI-compatible direct), and structured output mode for AI transforms.

## Discovery Protocol

- Read `CLAUDE.md` for authoritative architectural rules, conventions, and known traps
- Read `package.json` for dependencies and scripts
- Glob `src/kernel/entities/*.ts` for domain types
- Glob `src/kernel/transforms/*.ts` for pure transform functions
- Glob `src/client/domain/ports/*.ts` for port interfaces (StoragePort, BlobStoragePort, PdfRendererPort, TransformExecutorPort, ChatPort, ModelRosterPort, AiExecutorPort — AiExecutorPort accepts optional schema for structured output)
- Glob `src/client/domain/use-cases/*.ts` for orchestration logic (execute-pipeline, send-chat-message, execute-ai-transform, etc.)
- Glob `src/client/ui/components/*.tsx` for UI components (MarkdownNode, PdfNode, TransformNode, ChatNode, AiTransformNode, etc.)
- Check `.specs/archive/` for completed feature specs
- Check `.specs/features/` for active feature specs

## Decomposition Patterns

### Atoms
- **Kernel Entity**: Pure data type in `src/kernel/entities/`
- **Kernel Transform**: Pure function in `src/kernel/transforms/`
- **Port**: Interface in `src/client/domain/ports/`
- **Use Case**: Orchestration in `src/client/domain/use-cases/`
- **Adapter**: Port implementation in `src/client/adapters/`
- **Component**: React component in `src/client/ui/components/`
- **Hook**: React hook in `src/client/ui/hooks/`

### Decision Heuristics
| Signal in the requirement | Result |
|---|---|
| New data structure (node type, connection variant) | Kernel Entity in `kernel/entities/` |
| New pure data transformation | Kernel Transform in `kernel/transforms/` |
| New external capability (storage, rendering, execution) | Port in `client/domain/ports/`, Adapter in `client/adapters/` |
| New orchestration across ports + transforms | Use Case in `client/domain/use-cases/` |
| New visual element | Component in `client/ui/components/` |
| New UI-to-domain bridge | Hook in `client/ui/hooks/` (compose in `useWorkspace` like `usePdfOperations`, `useAiTransformHandlers`) |
| New server-side capability | Adapter in `server/adapters/` or `server/storage/` |
| DON'T create a service class — use cases are functions, not classes |
| DON'T import concrete adapters in hooks — use `useAdapters()` context |

## Construction Patterns

| Tool/Skill | Produces | When to use | Invocation |
|---|---|---|---|
| npm install | Dependencies | Adding packages | `npm install {package}` |
| shadcn | UI components | Standard UI elements | `npx shadcn@latest add <component>` |
| feature-architect-v6 | Feature spec + implementation | New features | `/feature-architect-v6` |
