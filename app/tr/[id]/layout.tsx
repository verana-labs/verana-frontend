import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { formatDictionaryValue, getDictionary } from '@/i18n/dataview';

type Params = { id: string };
type Props = { params: Promise<Params> };
const TITLE_FALLBACK = 'Trust Registry {id}';
const DESCRIPTION_FALLBACK = 'Manage governance, deposits, and schemas for trust registry {id}.';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const {id } = await params;
  const registryId = decodeURIComponent(id);
  const dict = getDictionary();
  return {
    title: formatDictionaryValue(dict['meta.tr.detail.title'] ?? TITLE_FALLBACK, { id: registryId }),
    description: formatDictionaryValue(dict['meta.tr.detail.description'] ?? DESCRIPTION_FALLBACK, { id: registryId })
  };
}

export default function TrustRegistryDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
