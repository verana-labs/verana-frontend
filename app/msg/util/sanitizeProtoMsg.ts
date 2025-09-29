// import Long from 'long';
import { EncodeObject } from '@cosmjs/proto-signing';

const U32_FIELDS = new Set([
  'issuerGrantorValidationValidityPeriod',
  'verifierGrantorValidationValidityPeriod',
  'issuerValidationValidityPeriod',
  'verifierValidationValidityPeriod',
  'holderValidationValidityPeriod',
]);

export function sanitizeProtoMsg(msg: EncodeObject): EncodeObject {
  const v: any = { ...(msg.value as any) }; // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const k of Object.keys(v)) {
    if (U32_FIELDS.has(k) && v[k] != null) v[k] = (Number(v[k]) >>> 0);
    // if (U64_FIELDS.has(k) && v[k] != null) v[k] = Long.fromValue(v[k]);
  }
  return { typeUrl: msg.typeUrl, value: v };
}