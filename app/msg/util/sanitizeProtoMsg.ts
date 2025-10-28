import { EncodeObject } from '@cosmjs/proto-signing';

const U32_FIELDS = new Set([
  'issuerGrantorValidationValidityPeriod',
  'verifierGrantorValidationValidityPeriod',
  'issuerValidationValidityPeriod',
  'verifierValidationValidityPeriod',
  'holderValidationValidityPeriod',
]);

// Consider blank: undefined, null, or empty string
const isBlank = (v: unknown) =>
  v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

// Convert to uint32, or return undefined if invalid or zero
const toUint32OrUndefined = (v: unknown): number | undefined => {
  if (isBlank(v)) return undefined;

  const n = typeof v === 'string' ? Number(v) : (v as number);

  // Reject invalid numbers (NaN, negative, infinite)
  if (!Number.isFinite(n) || n < 0) return undefined;

  const u = (n >>> 0); // force uint32

  // NEW behavior: omit zero as well
  if (u === 0) return undefined;

  return u;
};

export function sanitizeProtoMsg(msg: EncodeObject): EncodeObject {
  // Copy original payload to avoid mutating it
  const src: Record<string, unknown> = { ...(msg.value as Record<string, unknown>) };
  const out: Record<string, unknown> = {};

  for (const [key, rawValue] of Object.entries(src)) {
    if (U32_FIELDS.has(key)) {
      const sanitizedValue = toUint32OrUndefined(rawValue);

      // Only include the field if sanitizedValue is defined
      if (sanitizedValue !== undefined) out[key] = sanitizedValue;

      // Skip to next field
      continue;
    }

    // Keep all other fields untouched
    out[key] = rawValue;
  }

  return { typeUrl: msg.typeUrl, value: out };
}