import '@/styles/global.css';
import { inter } from '@/ui/common/fonts'
import "@interchain-ui/react/styles";
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PublicEnvScript } from 'next-runtime-env';
import ClientLayout from '@/providers/client-layout';
import "@/init-long";
import { getTrustDepositParams } from '@/lib/trustDepositParams';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';
import { getDictionary } from '@/i18n/dataview';

config.autoAddCss = false;

const dict = getDictionary();

export const metadata: Metadata = {
  title: {
    default: dict['meta.root.title'] ?? 'Verana Dashboard',
    template: dict['meta.title.template'] ?? '%s · Verana'
  },
  description: dict['meta.root.description'] ?? 'Verana Frontend dashboard for managing and joining digital trust Ecosystems.',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico']
  },
  manifest: '/site.webmanifest'
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const trustDepositParamsResult = await getTrustDepositParams(); // 1 fetch for request (dedupe + ISR)

  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <PublicEnvScript />
      </head>
      <body className="app-body">
        <ClientLayout trustDepositParams={trustDepositParamsResult.params} >
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}
