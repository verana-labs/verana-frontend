import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { formatDictionaryValue, getDictionary } from '@/i18n/dataview';

type Params = { id: string };
const TITLE_FALLBACK = 'Credential Schema {id}';
const DESCRIPTION_FALLBACK = 'Inspect and manage credential schema {id} within its trust registry.';

export function generateMetadata({ params }: { params: Params }): Metadata {
  const schemaId = decodeURIComponent(params.id);
  const dict = getDictionary();
  return {
    title: formatDictionaryValue(dict['meta.cs.detail.title'] ?? TITLE_FALLBACK, { id: schemaId }),
    description: formatDictionaryValue(dict['meta.cs.detail.description'] ?? DESCRIPTION_FALLBACK, { id: schemaId })
  };
}

export default function CredentialSchemaLayout({ children }: { children: ReactNode }) {
  return children;
}
