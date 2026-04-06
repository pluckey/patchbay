import type { SourceKindContribution } from "./contribution.ts"

/**
 * The single shared registry of source kind contributions. Both the main
 * thread and the cell worker import the same registration module which
 * populates this registry as a side effect; the registry itself is a
 * pure-data structure with no framework dependencies.
 *
 * The four named consumers (cell worker, cell executor, type-def generator,
 * cascade) ALL go through this registry — they never import a specific
 * contribution file directly. Adding a new source kind is one new
 * contribution file plus one `register(...)` call in the registration
 * module.
 */

export class SourceKindRegistryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SourceKindRegistryError"
  }
}

export class SourceKindRegistry {
  private readonly byKind = new Map<string, SourceKindContribution>()
  private readonly byBindingName = new Map<string, string>() // bindingName → kind

  /**
   * Registers a contribution. Idempotent for re-registration of the same
   * contribution object, AND for hot-reload of a fresh object instance for
   * the same (kind, bindingName) pair — Next.js Fast Refresh re-evaluates
   * contribution modules, producing new object references for what is
   * semantically the same contribution. Treating those as a real conflict
   * would break dev-time edits to contribution files.
   *
   * Throws SourceKindRegistryError when the conflict is real:
   *   - Same kind, different binding name (the contribution actually changed
   *     identity in a way that breaks the cell author's mental model)
   *   - Same binding name, different kind (two unrelated kinds fighting for
   *     the same variable name in cell code)
   */
  register(contribution: SourceKindContribution): void {
    const existing = this.byKind.get(contribution.kind)
    if (existing) {
      if (existing === contribution) return // idempotent re-registration
      if (existing.bindingName === contribution.bindingName) {
        // Hot-reload replacement: same kind, same binding name, fresh object
        // reference. Update the byKind entry; byBindingName already maps to
        // this kind, no change needed.
        this.byKind.set(contribution.kind, contribution)
        return
      }
      throw new SourceKindRegistryError(
        `Source kind "${contribution.kind}" is already registered with a different binding name ` +
          `("${existing.bindingName}" vs incoming "${contribution.bindingName}").`,
      )
    }

    const bindingOwner = this.byBindingName.get(contribution.bindingName)
    if (bindingOwner !== undefined) {
      throw new SourceKindRegistryError(
        `Binding name "${contribution.bindingName}" is already claimed by source kind "${bindingOwner}". ` +
          `Source kind "${contribution.kind}" cannot also use it.`,
      )
    }

    this.byKind.set(contribution.kind, contribution)
    this.byBindingName.set(contribution.bindingName, contribution.kind)
  }

  /**
   * Returns the contribution for a kind, or throws SourceKindRegistryError
   * with the missing kind name if not registered. The throw is the loud
   * failure path — consumers must not silently fall back when a kind is
   * missing.
   */
  get(kind: string): SourceKindContribution {
    const contribution = this.byKind.get(kind)
    if (!contribution) {
      throw new SourceKindRegistryError(
        `Source kind "${kind}" is not registered. Known kinds: ${this.list().map((c) => c.kind).join(", ") || "(none)"}.`,
      )
    }
    return contribution
  }

  /**
   * Returns true if a kind is registered. Use sparingly — most consumers
   * should call `get` and let the error path handle missing kinds.
   */
  has(kind: string): boolean {
    return this.byKind.has(kind)
  }

  /**
   * Returns all registered contributions in registration order.
   */
  list(): readonly SourceKindContribution[] {
    return Array.from(this.byKind.values())
  }

  /**
   * Test-only: clears all registrations. Used to keep test fixtures
   * isolated. Not intended for production use.
   */
  __clear(): void {
    this.byKind.clear()
    this.byBindingName.clear()
  }
}

/**
 * The shared registry singleton. Both main thread and cell worker import
 * this module and get the same instance (within their respective contexts).
 * Cross-context state is NOT shared — each context has its own copy that
 * the registration module populates identically on import.
 */
export const sourceKindRegistry = new SourceKindRegistry()
