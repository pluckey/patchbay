import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SourceKindRegistry } from '../../../kernel/source-kinds/registry.ts'
import type { SourceKindContribution } from '../../../kernel/source-kinds/contribution.ts'

/**
 * CSV dry-run test — proves the registry's open-closed property by
 * defining a hypothetical CSV source kind contribution as a fresh,
 * isolated example and exercising the contract end-to-end through a
 * fresh registry instance.
 *
 * This test is designed to fail if the contract has been corrupted in
 * a way that adding a third kind requires changes outside the contribution
 * file itself. If a developer can't read this single file and infer the
 * contract, the contract has gotten too complex.
 *
 * The test uses a tiny hand-rolled CSV parser to avoid pulling in
 * papaparse for a test fixture. A real CSV contribution would use a
 * proper parser library loaded via dynamic import.
 */

interface CsvParseResult {
  rows: Record<string, string>[]
  headers: string[]
}

function parseCsv(text: string): CsvParseResult {
  const lines = text.trim().split('\n')
  if (lines.length === 0) return { rows: [], headers: [] }
  const headers = lines[0].split(',').map((h) => h.trim())
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, j) => {
      row[h] = values[j] ?? ''
    })
    rows.push(row)
  }
  return { rows, headers }
}

const csvSourceKind: SourceKindContribution = {
  kind: 'csv',
  bindingName: 'csv',

  loadLibrary: async () => {
    // In a real contribution this would dynamic-import a CSV parser.
    // For the dry-run we use the hand-rolled parser above, so loadLibrary
    // is a no-op that just satisfies the contract.
    return undefined
  },

  parse: async (rawArtifact: unknown) => {
    if (typeof rawArtifact !== 'string') {
      throw new Error('csv: expected string raw artifact')
    }
    return parseCsv(rawArtifact)
  },

  typeDefFragment: `interface CsvParseResult {
  rows: Record<string, string>[]
  headers: string[]
}`,

  bindingTypeExpression: 'CsvParseResult',

  presentation: {
    label: 'CSV',
    glyph: 'csv',
  },
}

test('csv dry-run: contribution conforms to the SourceKindContribution shape', () => {
  // If this compiles and runs, the contract type accepts CSV without
  // any changes — proving the contract is generic over kinds.
  assert.equal(csvSourceKind.kind, 'csv')
  assert.equal(csvSourceKind.bindingName, 'csv')
  assert.equal(typeof csvSourceKind.loadLibrary, 'function')
  assert.equal(typeof csvSourceKind.parse, 'function')
  assert.ok(csvSourceKind.typeDefFragment.length > 0)
})

test('csv dry-run: registry accepts the new kind without code modification', () => {
  // A fresh registry, register the CSV contribution. If the registry
  // had any kind-specific code, this would fail. It doesn't.
  const registry = new SourceKindRegistry()
  registry.register(csvSourceKind)
  assert.equal(registry.get('csv'), csvSourceKind)
  assert.equal(registry.list().length, 1)
})

test('csv dry-run: parser produces the typed object cell code would consume', async () => {
  // Walk the full contract: load library (no-op), parse a raw artifact,
  // observe the resulting object. This is what the cell worker does
  // internally for every input on every cell execution.
  await csvSourceKind.loadLibrary()
  const raw = 'name,age\nAlice,30\nBob,25'
  const result = (await csvSourceKind.parse(raw, undefined)) as CsvParseResult
  assert.deepEqual(result.headers, ['name', 'age'])
  assert.equal(result.rows.length, 2)
  assert.deepEqual(result.rows[0], { name: 'Alice', age: '30' })
  assert.deepEqual(result.rows[1], { name: 'Bob', age: '25' })
})

test('csv dry-run: type-def fragment is a non-empty TypeScript declaration string', () => {
  // The fragment is what the type-def generator would concatenate into
  // the Monaco lib. We don't compile it here (no TS compiler in node:test),
  // but we verify it's a non-trivial declaration that mentions the type
  // the binding will be assigned to.
  assert.match(csvSourceKind.typeDefFragment, /interface CsvParseResult/)
  assert.equal(csvSourceKind.bindingTypeExpression, 'CsvParseResult')
})

test('csv dry-run: contribution is self-contained — every field needed to plug in is in this file', () => {
  // Meta-test: a developer reading just this file (without other docs)
  // can see exactly what's required to add a new kind. This test exists
  // as documentation more than verification.
  const requiredFields: (keyof SourceKindContribution)[] = [
    'kind',
    'bindingName',
    'loadLibrary',
    'parse',
    'typeDefFragment',
  ]
  for (const field of requiredFields) {
    assert.ok(
      csvSourceKind[field] !== undefined,
      `csv contribution must define ${field}`,
    )
  }
})
