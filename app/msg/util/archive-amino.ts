import type { AminoMsg } from '@cosmjs/amino'
import type { EncodeObject } from '@cosmjs/proto-signing'
import { AminoTypes } from '@cosmjs/stargate'

const ARCHIVE_AMINO_TYPES = new Set(['verana/x/ec/MsgArchiveEcosystem', 'verana/x/cs/MsgArchiveCredentialSchema'])

// The chain omits a false `archive` (no amino.dont_omitempty) but verana-types 0.10.7 still emits it.
export function withArchiveAminoConverters(upstream: AminoTypes): AminoTypes {
  class ArchiveAminoTypes extends AminoTypes {
    toAmino(message: EncodeObject): AminoMsg {
      const amino = upstream.toAmino(message)
      if (!ARCHIVE_AMINO_TYPES.has(amino.type) || amino.value.archive !== false) return amino
      return { ...amino, value: Object.fromEntries(Object.entries(amino.value).filter(([key]) => key !== 'archive')) }
    }

    fromAmino(message: AminoMsg): EncodeObject {
      return upstream.fromAmino(message)
    }
  }

  return new ArchiveAminoTypes({})
}
