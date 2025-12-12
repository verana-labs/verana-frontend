import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getDictionary } from '@/i18n/dataview';

const dict = getDictionary();

export const metadata: Metadata = {
  title: dict['meta.did.list.title'] ?? 'DID Directory',
  description: dict['meta.did.list.description'] ?? 'Browse and manage Verana decentralized identifiers associated with your accounts.'
};

export default function DidLayout({ children }: { children: ReactNode }) {
  return children;
}
