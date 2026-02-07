'use client'

import type { OfflineSigner, OfflineDirectSigner } from '@cosmjs/proto-signing';

// Type guard: detects if signer exposes signDirect
export function isDirectSigner(signer: unknown): signer is OfflineDirectSigner {
  return !!signer && typeof (signer as any).signDirect === 'function'; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// Type guard: detects if signer exposes only signAmino (no signDirect)
export function isAminoOnlySigner(signer: unknown): signer is OfflineSigner {
  return !!signer
    && typeof (signer as any).signAmino === 'function' // eslint-disable-line @typescript-eslint/no-explicit-any
    && typeof (signer as any).signDirect !== 'function'; // eslint-disable-line @typescript-eslint/no-explicit-any
}

type LongLike = { low: number; high: number; unsigned?: boolean };

/**
 * Removes:
 * - undefined / null
 * - empty strings ""
 * - numeric 0
 * - string "0"
 * - "Long-like" zeros: { low: 0, high: 0, ... }
 * Recurses into nested objects/arrays.
 */
export function stripZerosUndefinedAndEmptyStrings<T>(input: T): T {
  const isLongLike = (v: any): v is LongLike =>
    v &&
    typeof v === "object" &&
    typeof v.low === "number" &&
    typeof v.high === "number";

  const isZeroLongLike = (v: any): boolean =>
    isLongLike(v) && v.low === 0 && v.high === 0;

  const clean = (v: any): any => {
    if (v === undefined || v === null) return undefined;

    // Keep Date instances
    if (v instanceof Date) return v;

    if (typeof v === "string") {
      if (v === "" || v === "0") return undefined;
      return v;
    }

    if (typeof v === "number") return v === 0 ? undefined : v;

    if (Array.isArray(v)) {
      const arr = v.map(clean).filter((x) => x !== undefined);
      return arr.length ? arr : undefined;
    }

    if (typeof v === "object") {
      if (isZeroLongLike(v)) return undefined;

      const out: any = {};
      for (const [k, val] of Object.entries(v)) {
        const c = clean(val);
        if (c !== undefined) out[k] = c;
      }
      return Object.keys(out).length ? out : undefined;
    }

    return v;
  };

  return (clean(input) ?? {}) as T;
}