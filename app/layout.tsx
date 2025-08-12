import '@/app/styles/global.css';
import { lusitana, kantumruy } from '@/app/ui/common/fonts'
import "@interchain-ui/react/styles";
import { PublicEnvScript } from 'next-runtime-env';
import ClientLayout from './providers/client-layout';

export const metadata = { title: 'Verana Front', description: 'Verana Front' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${kantumruy.variable} ${lusitana.variable}`}>
      <head>
        <PublicEnvScript />
      </head>
      <body className="app-body">
        <ClientLayout> {children} </ClientLayout>
      </body>
    </html>
  )
}

