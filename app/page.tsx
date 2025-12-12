import type { Metadata } from 'next';
import { getDictionary } from '@/i18n/dataview';

const dict = getDictionary();

export const metadata: Metadata = {
  title: dict['meta.home.title'] ?? 'Verana Dashboard',
  description: dict['meta.home.description'] ?? 'Entry point to Verana where you can access network dashboards and tools.'
};

export default function Page() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Home</h1>
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl shadow">
        <p>Verana</p>
      </div>
    </>
  );
}
