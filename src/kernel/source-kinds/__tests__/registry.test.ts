import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SourceKindRegistry, SourceKindRegistryError } from '../registry.ts'
import type { SourceKindContribution } from '../contribution.ts'

function makeContribution(kind: string, bindingName: string): SourceKindContribution {
  return {
    kind,
    bindingName,
    loadLibrary: async () => undefined,
    parse: async (raw: unknown) => raw,
    typeDefFragment: '',
  }
}

test('SourceKindRegistry: register + get round-trip', () => {
  const registry = new SourceKindRegistry()
  const c = makeContribution('foo', 'foo')
  registry.register(c)
  assert.equal(registry.get('foo'), c)
})

test('SourceKindRegistry: get throws SourceKindRegistryError naming the missing kind', () => {
  const registry = new SourceKindRegistry()
  registry.register(makeContribution('foo', 'foo'))
  assert.throws(
    () => registry.get('bar'),
    (err: unknown) => err instanceof SourceKindRegistryError && /"bar"/.test(String(err)),
  )
})

test('SourceKindRegistry: re-registering the same contribution is idempotent', () => {
  const registry = new SourceKindRegistry()
  const c = makeContribution('foo', 'foo')
  registry.register(c)
  registry.register(c) // should not throw
  assert.equal(registry.list().length, 1)
})

test('SourceKindRegistry: re-registering a different contribution under the same kind throws', () => {
  const registry = new SourceKindRegistry()
  registry.register(makeContribution('foo', 'foo'))
  assert.throws(
    () => registry.register(makeContribution('foo', 'foo2')),
    SourceKindRegistryError,
  )
})

test('SourceKindRegistry: binding-name collision is rejected at registration time', () => {
  const registry = new SourceKindRegistry()
  registry.register(makeContribution('foo', 'shared'))
  assert.throws(
    () => registry.register(makeContribution('bar', 'shared')),
    (err: unknown) => err instanceof SourceKindRegistryError && /"shared"/.test(String(err)) && /"foo"/.test(String(err)),
  )
})

test('SourceKindRegistry: has() returns true for registered, false for unknown', () => {
  const registry = new SourceKindRegistry()
  registry.register(makeContribution('foo', 'foo'))
  assert.equal(registry.has('foo'), true)
  assert.equal(registry.has('bar'), false)
})

test('SourceKindRegistry: list() preserves registration order', () => {
  const registry = new SourceKindRegistry()
  registry.register(makeContribution('a', 'a'))
  registry.register(makeContribution('b', 'b'))
  registry.register(makeContribution('c', 'c'))
  assert.deepEqual(registry.list().map((c) => c.kind), ['a', 'b', 'c'])
})

test('SourceKindRegistry: get error message lists known kinds for diagnosability', () => {
  const registry = new SourceKindRegistry()
  registry.register(makeContribution('alpha', 'a'))
  registry.register(makeContribution('beta', 'b'))
  try {
    registry.get('gamma')
    assert.fail('expected throw')
  } catch (err) {
    const msg = String(err)
    assert.match(msg, /"gamma"/)
    assert.match(msg, /alpha/)
    assert.match(msg, /beta/)
  }
})

test('SourceKindRegistry: empty-registry get error names the missing kind even when registry is empty', () => {
  const registry = new SourceKindRegistry()
  try {
    registry.get('whatever')
    assert.fail('expected throw')
  } catch (err) {
    const msg = String(err)
    assert.match(msg, /"whatever"/)
    assert.match(msg, /\(none\)/)
  }
})
