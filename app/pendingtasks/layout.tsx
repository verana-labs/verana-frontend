import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getDictionary } from '@/i18n/dataview';

const dict = getDictionary();

export const metadata: Metadata = {
  title: dict['meta.task.title'] ?? 'Pending Tasks',
  description: dict['meta.task.description'] ?? 'Pending Tasks.'
};

export default function PendingTasksLayout({ children }: { children: ReactNode }) {
  return children;
}
