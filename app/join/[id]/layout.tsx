import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { formatDictionaryValue, getDictionary } from '@/i18n/dataview';

type Params = { id: string };
type Props = { params: Promise<Params> };
const TITLE_FALLBACK = 'Join Ecosystem Trust Registry {id}';
const DESCRIPTION_FALLBACK = 'Join Ecosystem Trust Registry {id}.';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const {id } = await params;
  const registryId = decodeURIComponent(id);
  const dict = getDictionary();
  return {
    title: formatDictionaryValue(dict['meta.join.title'] ?? TITLE_FALLBACK, { id: registryId }),
    description: formatDictionaryValue(dict['meta.join.description'] ?? DESCRIPTION_FALLBACK, { id: registryId })
  };
}

export default function JoinLayout({ children }: { children: ReactNode }) {
  return children;
}
