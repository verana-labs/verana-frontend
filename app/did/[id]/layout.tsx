import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { formatDictionaryValue, getDictionary } from '@/i18n/dataview';

type Params = { id: string };
const TITLE_FALLBACK = 'DID {id}';
const DESCRIPTION_FALLBACK = 'View metadata, status, and governance for decentralized identifier {id}.';

export function generateMetadata({ params }: { params: Params }): Metadata {
  const did = decodeURIComponent(params.id);
  const dict = getDictionary();
  return {
    title: formatDictionaryValue(dict['meta.did.detail.title'] ?? TITLE_FALLBACK, { id: did }),
    description: formatDictionaryValue(dict['meta.did.detail.description'] ?? DESCRIPTION_FALLBACK, { id: did })
  };
}

export default function DidDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
