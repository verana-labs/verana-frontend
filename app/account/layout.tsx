import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getDictionary } from '@/i18n/dataview';

const dict = getDictionary();

export const metadata: Metadata = {
  title: dict['meta.account.title'] ?? 'Account Overview',
  description: dict['meta.account.description'] ?? 'Review balances, deposits, and DID activity for your Verana account.'
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
