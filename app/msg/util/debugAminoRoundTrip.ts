import { logger } from '@/lib/logger'
import deepEqual from 'fast-deep-equal';
import { veranaAmino, veranaRegistry } from '@/config/veranaChain.sign.client';
import { EncodeObject } from '@cosmjs/proto-signing';
import { toHex } from '@cosmjs/encoding';

/**
 * Validates the Amino JSON structure:
 * - uint64 fields must be decimal strings
 * - uint32 fields must be finite numbers within [0, 2^32-1]
 */
// biome-ignore lint/suspicious/noExplicitAny: legacy any usage
function assertAminoShape(a: any) {
  const v = a?.value ?? {};

  // uint64 fields should always be string (decimal)
  const u64Keys = ['id', 'tr_id'];
  for (const k of u64Keys) {
    if (k in v) {
      if (typeof v[k] !== 'string') {
        throw new Error(`Field ${k} must be string (uint64), got ${typeof v[k]}`);
      }
      if (!/^\d+$/.test(v[k])) {
        throw new Error(`Field ${k} is not a valid decimal string: ${v[k]}`);
      }
    }
  }

  // uint32 fields should always be number
  const u32Keys = [
    'issuer_grantor_validation_validity_period',
    'verifier_grantor_validation_validity_period',
    'issuer_validation_validity_period',
    'verifier_validation_validity_period',
    'holder_validation_validity_period',
    'issuer_perm_management_mode',
    'verifier_perm_management_mode',
  ];
  for (const k of u32Keys) {
    if (k in v) {
      if (typeof v[k] !== 'number') {
        throw new Error(`Field ${k} must be number, got ${typeof v[k]}`);
      }
      if (!Number.isFinite(v[k])) {
        throw new Error(`Field ${k} is not a finite number: ${v[k]}`);
      }
      if (v[k] < 0 || v[k] > 0xffffffff) {
        throw new Error(`Field ${k} is out of uint32 range: ${v[k]}`);
      }
    }
  }
}

/**
 * Debug helper: round-trip Amino <-> Proto and check consistency.
 */
export function debugAminoRoundTrip(msg: EncodeObject) {
  logger.info('[PROTO typeof] ->', msg);
  // biome-ignore lint/suspicious/noExplicitAny: legacy any usage
  const pv: any = msg.value as any;
  logger.info('[PROTO typeof] ->', {
    issuerGrantorValidationValidityPeriod: typeof pv?.issuerGrantorValidationValidityPeriod,
    verifierGrantorValidationValidityPeriod: typeof pv?.verifierGrantorValidationValidityPeriod,
    issuerValidationValidityPeriod:       typeof pv?.issuerValidationValidityPeriod,
    verifierValidationValidityPeriod:     typeof pv?.verifierValidationValidityPeriod,
    holderValidationValidityPeriod:       typeof pv?.holderValidationValidityPeriod,
    id: typeof pv?.id,   // esperado Long | string | number -> se normaliza por ts-proto
  });

  // 1) Proto -> Amino
  // biome-ignore lint/suspicious/noExplicitAny: legacy any usage
  const aminoAny = (veranaAmino as any).toAmino(msg);
  // biome-ignore lint/suspicious/noExplicitAny: legacy any usage
  const v = (aminoAny as any).value;

  logger.info('.toAmino typeof fields ->', {
    issuer_grantor_validation_validity_period: typeof v?.issuer_grantor_validation_validity_period,
    verifier_grantor_validation_validity_period: typeof v?.verifier_grantor_validation_validity_period,
    issuer_validation_validity_period: typeof v?.issuer_validation_validity_period,
    verifier_validation_validity_period: typeof v?.verifier_validation_validity_period,
    holder_validation_validity_period: typeof v?.holder_validation_validity_period,
    id: typeof v?.id,     // expected string (uint64)
  });

  // 2) Type + range validation
  assertAminoShape(aminoAny);

  // 3) Pretty-print the Amino JSON for inspection
  logger.info('AMINO JSON →', JSON.stringify(aminoAny, null, 2));

  // 4) Amino -> Proto
  // biome-ignore lint/suspicious/noExplicitAny: legacy any usage
  const back = (veranaAmino as any).fromAmino(aminoAny);
  logger.info('FROM AMINO →', back);

  // 5) Check typeUrl consistency
  logger.info('typeUrl ok?', back.typeUrl === msg.typeUrl);

  // 6) Compare encoded Any bytes (Proto)
  const bytesOriginal = veranaRegistry.encodeAsAny(msg).value;
  // const bytesToAmino = veranaRegistry.encodeAsAny(aminoAny).value;
  const bytesBack = veranaRegistry.encodeAsAny(back).value;
  const bytesEqual =
    bytesOriginal.length === bytesBack.length &&
    bytesOriginal.every((b: number, i: number) => b === bytesBack[i]);
  logger.info('Proto Any bytes equal?', bytesEqual);

  logger.info('Original Any (hex):', toHex(bytesOriginal));
  // logger.info('aminoAny (hex):', toHex(bytesToAmino));
  logger.info('Back Any (hex):    ', toHex(bytesBack));

  // 7) Deep equality of values (watch out for Long vs number mismatches)
  logger.info(
    'Equal value?',
    deepEqual(msg.value, back.value)
  );
}
