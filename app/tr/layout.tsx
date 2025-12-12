import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getDictionary } from '@/i18n/dataview';

const dict = getDictionary();

export const metadata: Metadata = {
  title: dict['meta.tr.list.title'] ?? 'Trust Registries',
  description: dict['meta.tr.list.description'] ?? 'Explore Verana trust registries, governance documents, and credential schema catalogs.'
};

export default function TrustRegistryLayout({ children }: { children: ReactNode }) {
  return children;
}
