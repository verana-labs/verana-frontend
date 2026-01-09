import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getDictionary } from '@/i18n/dataview';

const dict = getDictionary();

export const metadata: Metadata = {
  title: dict['meta.discover.title'] ?? 'Discover & Join',
  description: dict['meta.discover.description'] ?? 'Explore, discover and join existing ecosystems.'
};

export default function DiscoverLayout({ children }: { children: ReactNode }) {
  return children;
}
