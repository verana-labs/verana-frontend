import '@/app/ui/global.css';
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
      <body
        className="
          font-sans antialiased text-light-text text-xs md:text-base font-medium
          dark:text-dark-text bg-light-bg dark:bg-dark-bg
          border-light-border dark:border-dark-border
          items-center justify-center"
      >
        <ClientLayout> {children} </ClientLayout>
      </body>
    </html>
  )
}

