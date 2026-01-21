import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { formatDictionaryValue, getDictionary } from '@/i18n/dataview';

type Params = { id: string };
type Props = { params: Promise<Params> };
const TITLE_FALLBACK = 'Participants';
const DESCRIPTION_FALLBACK = 'participants.';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const {id } = await params;
  const registryId = decodeURIComponent(id);
  const dict = getDictionary();
  return {
    title: formatDictionaryValue(dict['meta.participants.title'] ?? TITLE_FALLBACK, { id: registryId }),
    description: formatDictionaryValue(dict['meta.participants.description'] ?? DESCRIPTION_FALLBACK, { id: registryId })
  };
}

export default function JoinLayout({ children }: { children: ReactNode }) {
  return children;
}
