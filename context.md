## System Identity

Context Canvas is a freeform spatial workspace for composing AI context, built with Next.js 16, TypeScript, Tailwind CSS 4, and @xyflow/react. It serves knowledge workers who need to spatially arrange source material (starting with editable markdown text nodes) to compose context for AI consumption. The codebase lives at `/Users/home/Documents/projects/context-canvas`. Current state: greenfield.

## Discovery Protocol

- Read `package.json` for dependencies and scripts
- Glob for `src/**/*.ts` and `src/**/*.tsx` to find source files
- Read `context.md` for system context
- Check `.specs/` for feature specifications

## Decomposition Patterns

### Atoms
- **Entity**: Domain model in `src/domain/entities/` — pure data structures, no framework dependencies
- **Use Case**: Application logic in `src/domain/use-cases/` — orchestrates entities, depends only on domain ports
- **Port**: Interface in `src/domain/ports/` — boundary contracts defined by the domain layer
- **Adapter**: Implementation of a port in `src/adapters/` — framework-specific (storage, UI serialization)
- **Component**: React component in `src/components/` — UI layer, depends on use cases via hooks
- **Hook**: React hook in `src/hooks/` — bridges UI components to domain use cases

### Decision Heuristics
| Signal in the requirement | Result |
|---|---|
| New data structure (node, canvas) | Create an Entity |
| New user action (create, delete, move) | Create a Use Case |
| New persistence need | Define a Port (domain), implement an Adapter (infrastructure) |
| New visual element | Create a Component |
| DON'T create a service class for simple state updates — use cases are functions, not classes |

## Construction Patterns

| Tool/Skill | Produces | When to use | Invocation |
|---|---|---|---|
| create-next-app | Project scaffold | Initial setup | `npx create-next-app@latest` |
| npm install | Dependencies | Adding packages | `npm install {package}` |
| Manual file creation | Source files | All feature code | Write tool |

## Verification Patterns

### Build
- `npm run build`: Verifies TypeScript compilation and Next.js build

### Test
- Manual browser testing: Canvas interactions, node CRUD, persistence

### Lint/Type Check
- `npx tsc --noEmit`: Type checking
- `npm run lint`: ESLint

### Manual Verification
- Open in browser, create nodes, edit markdown, reposition, close and reopen to verify persistence

## Conventions

### Naming
- Files: kebab-case (`markdown-node.ts`, `create-node.ts`)
- Components: PascalCase (`MarkdownNode.tsx`, `Canvas.tsx`)
- Entities/types: PascalCase (`CanvasNode`, `NodePosition`)
- Use cases: camelCase functions (`createNode`, `moveNode`, `deleteNode`)
- Ports: PascalCase interfaces with `Port` suffix (`StoragePort`)

### File Structure
```
src/
  domain/
    entities/       # Pure domain models
    use-cases/      # Application logic (functions)
    ports/          # Boundary interfaces
  adapters/
    storage/        # StoragePort implementations (localStorage, etc.)
  components/       # React components (UI layer)
  hooks/            # React hooks (bridge UI to domain)
  app/              # Next.js App Router pages
```

### Architectural Rules
- Dependency Rule: dependencies point inward (entities ← use cases ← adapters ← UI)
- Domain layer has ZERO imports from React, Next.js, or any framework
- UI components never directly access storage — always through use cases
- Ports are defined by the domain layer, implemented by adapters
- No classes unless unavoidable — prefer plain functions and interfaces

## Known Traps

- @xyflow/react node data updates require immutable state updates (new object references) or the canvas won't re-render
- localStorage has a ~5MB limit — sufficient for text nodes but will need migration when adding binary sources
- Next.js App Router: client components must be marked with 'use client' directive
- Tailwind CSS v4 uses the new `@import "tailwindcss"` syntax, not the v3 `@tailwind` directives
