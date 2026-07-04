import { Buffer } from 'node:buffer'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next-runtime-env', () => ({ env: () => 'vna-testnet-1' }))

import {
  hasValidCredentialSchemaId,
  isValidSchemaIdPattern,
  MSG_SCHEMA_ID,
  normalizeJsonSchema,
  SCHEMA_ID_PREFIX,
  validateJSONSchema,
  validateJSONSchemaReturn,
} from '@/util/json_schema_util'

const validSchema = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  type: 'object',
  title: 'Example Credential',
  description: 'An example credential schema',
  properties: {
    name: { type: 'string' },
  },
  ...overrides,
})

describe('SCHEMA_ID_PREFIX / MSG_SCHEMA_ID constants', () => {
  it('exposes the placeholder prefix used before chain substitution', () => {
    expect(SCHEMA_ID_PREFIX).toBe('vpr:verana:VPR_CHAIN_ID/cs/v1/js/')
  })

  it('builds the placeholder message schema id from the prefix', () => {
    expect(MSG_SCHEMA_ID).toBe(`${SCHEMA_ID_PREFIX}VPR_CREDENTIAL_SCHEMA_ID`)
  })
})

describe('isValidSchemaIdPattern', () => {
  it('accepts the canonical placeholder schema id', () => {
    expect(isValidSchemaIdPattern(MSG_SCHEMA_ID)).toBe(true)
  })

  it('rejects an id with the right prefix but a non-placeholder suffix', () => {
    expect(isValidSchemaIdPattern(`${SCHEMA_ID_PREFIX}123`)).toBe(false)
    expect(isValidSchemaIdPattern(`${SCHEMA_ID_PREFIX}`)).toBe(false)
  })

  it('rejects ids that do not start with the prefix', () => {
    expect(isValidSchemaIdPattern('VPR_CREDENTIAL_SCHEMA_ID')).toBe(false)
    expect(isValidSchemaIdPattern('vpr:verana:other/cs/v1/js/VPR_CREDENTIAL_SCHEMA_ID')).toBe(false)
    expect(isValidSchemaIdPattern('')).toBe(false)
  })

  it('does not match when the placeholder appears only as a substring', () => {
    expect(isValidSchemaIdPattern(`${MSG_SCHEMA_ID}/extra`)).toBe(false)
  })
})

describe('hasValidCredentialSchemaId', () => {
  it('accepts an object whose $id is the valid placeholder', () => {
    expect(hasValidCredentialSchemaId({ $id: MSG_SCHEMA_ID })).toBe(true)
  })

  it('rejects an object whose $id has an invalid pattern', () => {
    expect(hasValidCredentialSchemaId({ $id: `${SCHEMA_ID_PREFIX}999` })).toBe(false)
    expect(hasValidCredentialSchemaId({ $id: 'not-a-schema-id' })).toBe(false)
  })

  it('rejects when $id is missing or not a string', () => {
    expect(hasValidCredentialSchemaId({})).toBe(false)
    expect(hasValidCredentialSchemaId({ $id: 42 })).toBe(false)
    expect(hasValidCredentialSchemaId({ $id: null })).toBe(false)
  })

  it('rejects non-object inputs', () => {
    expect(hasValidCredentialSchemaId(null)).toBe(false)
    expect(hasValidCredentialSchemaId(undefined)).toBe(false)
    expect(hasValidCredentialSchemaId('string')).toBe(false)
    expect(hasValidCredentialSchemaId(123)).toBe(false)
  })
})

describe('normalizeJsonSchema', () => {
  it('canonicalizes object key order so equivalent schemas produce identical output', () => {
    const a = normalizeJsonSchema('{"b":1,"a":2}')
    const b = normalizeJsonSchema('{"a":2,"b":1}')
    expect(a).toBe(b)
    expect(a).toBe('{"a":2,"b":1}')
  })

  it('strips insignificant whitespace from the input', () => {
    expect(normalizeJsonSchema('{ "a" :  1 }')).toBe('{"a":1}')
  })

  it('canonicalizes nested objects recursively', () => {
    const out = normalizeJsonSchema('{"outer":{"y":1,"x":2}}')
    expect(out).toBe('{"outer":{"x":2,"y":1}}')
  })

  it('returns the original string unchanged when the input is not valid JSON', () => {
    expect(normalizeJsonSchema('not json')).toBe('not json')
    expect(normalizeJsonSchema('{bad}')).toBe('{bad}')
  })

  it('returns the original string when canonicalize yields undefined (top-level undefined-like)', () => {
    expect(normalizeJsonSchema('')).toBe('')
  })
})

describe('validateJSONSchema', () => {
  it('accepts a well-formed schema without throwing', () => {
    expect(() => validateJSONSchema(JSON.stringify(validSchema()))).not.toThrow()
  })

  it('rejects empty input', () => {
    expect(() => validateJSONSchema('')).toThrow('json schema cannot be empty')
  })

  it('enforces the default max byte size', () => {
    const huge = JSON.stringify(validSchema({ description: 'x'.repeat(9000) }))
    expect(() => validateJSONSchema(huge)).toThrow('json schema exceeds maximum size of 8192 bytes')
  })

  it('honors a custom max byte size', () => {
    const schema = JSON.stringify(validSchema())
    expect(() => validateJSONSchema(schema, 10)).toThrow('json schema exceeds maximum size of 10 bytes')
  })

  it('measures size in UTF-8 bytes, not characters', () => {
    const multibyte = '€'.repeat(3)
    const schema = JSON.stringify(validSchema({ title: multibyte }))
    const byteLength = Buffer.byteLength(schema, 'utf8')
    expect(() => validateJSONSchema(schema, byteLength)).not.toThrow()
    expect(() => validateJSONSchema(schema, byteLength - 1)).toThrow('exceeds maximum size')
  })

  it('rejects malformed JSON with a descriptive message', () => {
    expect(() => validateJSONSchema('{not valid json')).toThrow(/invalid JSON format:/)
  })

  it('rejects a JSON array as the root', () => {
    expect(() => validateJSONSchema('[]')).toThrow('schema must be a JSON object')
  })

  it('rejects a JSON null as the root', () => {
    expect(() => validateJSONSchema('null')).toThrow('schema must be a JSON object')
  })

  it('rejects a JSON primitive as the root', () => {
    expect(() => validateJSONSchema('"a string"')).toThrow('schema must be a JSON object')
    expect(() => validateJSONSchema('42')).toThrow('schema must be a JSON object')
  })

  it('rejects when a required field is missing', () => {
    for (const field of ['$schema', 'type', 'title', 'description']) {
      const { [field]: _omitted, ...incomplete } = validSchema()
      expect(() => validateJSONSchema(JSON.stringify(incomplete))).toThrow(`missing required field: ${field}`)
    }
  })

  it("rejects when root type is not 'object'", () => {
    expect(() => validateJSONSchema(JSON.stringify(validSchema({ type: 'array' })))).toThrow(
      "root schema type must be 'object'"
    )
    expect(() => validateJSONSchema(JSON.stringify(validSchema({ type: 42 })))).toThrow(
      "root schema type must be 'object'"
    )
  })

  it('rejects an empty or whitespace-only title', () => {
    expect(() => validateJSONSchema(JSON.stringify(validSchema({ title: '' })))).toThrow(
      'title must be a non-empty string'
    )
    expect(() => validateJSONSchema(JSON.stringify(validSchema({ title: '   ' })))).toThrow(
      'title must be a non-empty string'
    )
  })

  it('rejects a non-string title', () => {
    expect(() => validateJSONSchema(JSON.stringify(validSchema({ title: 5 })))).toThrow(
      'title must be a non-empty string'
    )
  })

  it('rejects an empty or whitespace-only description', () => {
    expect(() => validateJSONSchema(JSON.stringify(validSchema({ description: '' })))).toThrow(
      'description must be a non-empty string'
    )
    expect(() => validateJSONSchema(JSON.stringify(validSchema({ description: '\t\n' })))).toThrow(
      'description must be a non-empty string'
    )
  })

  it('rejects when properties is missing, empty, or not a plain object', () => {
    const { properties: _props, ...missing } = validSchema()
    expect(() => validateJSONSchema(JSON.stringify(missing))).toThrow('schema must define non-empty properties')

    expect(() => validateJSONSchema(JSON.stringify(validSchema({ properties: {} })))).toThrow(
      'schema must define non-empty properties'
    )
    expect(() => validateJSONSchema(JSON.stringify(validSchema({ properties: [] })))).toThrow(
      'schema must define non-empty properties'
    )
    expect(() => validateJSONSchema(JSON.stringify(validSchema({ properties: 'nope' })))).toThrow(
      'schema must define non-empty properties'
    )
  })

  it('validates size before parsing, so an oversize invalid-JSON string fails on size', () => {
    const oversize = `{${'x'.repeat(9000)}`
    expect(() => validateJSONSchema(oversize)).toThrow('exceeds maximum size')
  })
})

describe('validateJSONSchemaReturn', () => {
  it('returns null for a valid schema', () => {
    expect(validateJSONSchemaReturn(JSON.stringify(validSchema()))).toBeNull()
  })

  it('returns an Error carrying the validation message instead of throwing', () => {
    const result = validateJSONSchemaReturn('')
    expect(result).toBeInstanceOf(Error)
    expect(result?.message).toBe('json schema cannot be empty')
  })

  it('forwards a custom max size to the underlying validator', () => {
    const result = validateJSONSchemaReturn(JSON.stringify(validSchema()), 10)
    expect(result).toBeInstanceOf(Error)
    expect(result?.message).toBe('json schema exceeds maximum size of 10 bytes')
  })

  it('surfaces JSON parse failures as a returned Error', () => {
    const result = validateJSONSchemaReturn('{bad')
    expect(result).toBeInstanceOf(Error)
    expect(result?.message).toMatch(/invalid JSON format:/)
  })
})
