import '@/app/styles/global.css';
import { lusitana, kantumruy } from '@/app/ui/common/fonts'
import "@interchain-ui/react/styles";
import { PublicEnvScript } from 'next-runtime-env';
import ClientLayout from '@/app/providers/client-layout';
import "@/app/init-long";
import { getTrustDepositParams } from '@/app/lib/trustDepositParams';

export const metadata = { title: 'Verana Front', description: 'Verana Front' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const trustDepositParamsResult = await getTrustDepositParams(); // 1 fetch for request (dedupe + ISR)

  return (
    <html lang="en" className={`${kantumruy.variable} ${lusitana.variable}`}>
      <head>
        <PublicEnvScript />
      </head>
      <body className="app-body">
        <ClientLayout trustDepositParams={trustDepositParamsResult.params}> {children} </ClientLayout>
      </body>
    </html>
  )
}

