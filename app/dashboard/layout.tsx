import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getDictionary } from '@/i18n/dataview';

const dict = getDictionary();

export const metadata: Metadata = {
  title: dict['meta.dashboard.title'] ?? 'Network Dashboard',
  description: dict['meta.dashboard.description'] ?? 'Monitor Verana network metrics, wallet connectivity, and featured services.'
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return children;
}
