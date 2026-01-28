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


const DefaultCredentialSchemaSchemaMaxSize = 8192; // set your real parameter

export function validateJSONSchema(schemaJSON: string): void {
  // Reject empty input
  if (!schemaJSON) {
    throw new Error("json schema cannot be empty");
  }

  // Enforce max size in bytes (UTF-8), similar to Go's len([]byte(...))
  const byteLength = new TextEncoder().encode(schemaJSON).length;
  if (byteLength > DefaultCredentialSchemaSchemaMaxSize) {
    throw new Error(
      `json schema exceeds maximum size of ${DefaultCredentialSchemaSchemaMaxSize} bytes`
    );
  }

  // Parse JSON
  let schemaDoc: unknown;
  try {
    schemaDoc = JSON.parse(schemaJSON);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`invalid JSON format: ${msg}`);
  }

  // Ensure the root is a JSON object (not null, not an array)
  if (schemaDoc === null || typeof schemaDoc !== "object" || Array.isArray(schemaDoc)) {
    throw new Error("schema must be a JSON object");
  }

  const doc = schemaDoc as Record<string, unknown>;

  // Check required fields (excluding $id since it's optional and will be set)
  const requiredFields = ["$schema", "type", "title", "description"] as const;
  for (const field of requiredFields) {
    if (!(field in doc)) {
      throw new Error(`missing required field: ${field}`);
    }
  }

  // Validate type is 'object'
  if (typeof doc.type !== "string" || doc.type !== "object") {
    throw new Error("root schema type must be 'object'");
  }

  // Validate title is a non-empty string
  if (typeof doc.title !== "string" || doc.title.trim() === "") {
    throw new Error("title must be a non-empty string");
  }

  // Validate description is a non-empty string
  if (typeof doc.description !== "string" || doc.description.trim() === "") {
    throw new Error("description must be a non-empty string");
  }

  // Validate properties exist and are non-empty
  const props = doc.properties;
  const isPlainObject =
    props !== null && typeof props === "object" && !Array.isArray(props);

  if (!isPlainObject || Object.keys(props as Record<string, unknown>).length === 0) {
    throw new Error("schema must define non-empty properties");
  }
}

export function validateJSONSchemaReturn(schemaJSON: string): Error | null {
  try {
    validateJSONSchema(schemaJSON);
    return null;
  } catch (e) {
    return e instanceof Error ? e : new Error(String(e));
  }
}