import { env } from 'next-runtime-env';

const CHAIN_ID = env('NEXT_PUBLIC_VERANA_CHAIN_ID') || process.env.NEXT_PUBLIC_VERANA_CHAIN_ID;
// export const SCHEMA_ID_PREFIX = CHAIN_ID
//   ? `vpr:verana:${CHAIN_ID}/cs/v1/js/`
//   : '';

export const SCHEMA_ID_PREFIX = `vpr:verana:VPR_CHAIN_ID/cs/v1/js/`;

export const MSG_SCHEMA_ID = `${SCHEMA_ID_PREFIX}VPR_CREDENTIAL_SCHEMA_ID`;

export function hasValidCredentialSchemaId(schema: unknown): boolean {
  if (!CHAIN_ID || !schema || typeof schema !== 'object') {
    return false;
  }

  const idValue = (schema as Record<string, unknown>)['$id'];
  return typeof idValue === 'string' && isValidSchemaIdPattern(idValue);
}

export function isValidSchemaIdPattern(schemaId: string): boolean {
  if (!SCHEMA_ID_PREFIX || !CHAIN_ID || typeof schemaId !== 'string') {
    return false;
  }

  if (!schemaId.startsWith(SCHEMA_ID_PREFIX)) {
    return false;
  }

  const suffix = schemaId.slice(SCHEMA_ID_PREFIX.length);
  return suffix === 'VPR_CREDENTIAL_SCHEMA_ID';// || /^\d+$/.test(suffix);
}

export function normalizeJsonSchema(jsonSchema: string): string {
  try {
    // console.info('[json-schema] Original length', jsonSchema.length);
    const parsed = JSON.parse(jsonSchema);
    const normalized = JSON.stringify(parsed);
    // console.info('[json-schema] Normalized length', normalized.length);
    return normalized;
  } catch {
    return jsonSchema;
  }
}
