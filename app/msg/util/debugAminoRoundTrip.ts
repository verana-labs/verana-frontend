import deepEqual from 'fast-deep-equal'; // o similar
import { veranaAmino } from '@/app/config/veranaChain.client';
import { veranaRegistry } from '@/app/config/veranaChain.client';
import { EncodeObject } from '@cosmjs/proto-signing';

export function debugAminoRoundTrip(msg: EncodeObject) {
  const aminoAny = (veranaAmino as any).toAmino(msg); // eslint-disable-line @typescript-eslint/no-explicit-any
  console.info('AMINO JSON →', JSON.stringify(aminoAny, null, 2));

  const back = (veranaAmino as any).fromAmino(aminoAny); // eslint-disable-line @typescript-eslint/no-explicit-any
  console.info('FROM AMINO →', back);

  console.info('typeUrl ok?', back.typeUrl === msg.typeUrl);

  const bytesOriginal = veranaRegistry.encodeAsAny(msg).value;
  const bytesBack     = veranaRegistry.encodeAsAny(back).value;

  console.info('Proto Any bytes equal?', 
    bytesOriginal.length === bytesBack.length &&
    bytesOriginal.every((b: number, i: number) => b === bytesBack[i])
  );

  console.info('Deep equal value? (be careful with Long)',
    deepEqual(msg.value, back.value)
  );
}