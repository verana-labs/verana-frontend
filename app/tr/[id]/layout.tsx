import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { formatDictionaryValue, getDictionary } from '@/i18n/dataview';

type Params = { id: string };
const TITLE_FALLBACK = 'Trust Registry {id}';
const DESCRIPTION_FALLBACK = 'Manage governance, deposits, and schemas for trust registry {id}.';

export function generateMetadata({ params }: { params: Params }): Metadata {
  const registryId = decodeURIComponent(params.id);
  const dict = getDictionary();
  return {
    title: formatDictionaryValue(dict['meta.tr.detail.title'] ?? TITLE_FALLBACK, { id: registryId }),
    description: formatDictionaryValue(dict['meta.tr.detail.description'] ?? DESCRIPTION_FALLBACK, { id: registryId })
  };
}

export default function TrustRegistryDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
