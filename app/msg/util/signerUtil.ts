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