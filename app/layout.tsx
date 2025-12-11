import '@/styles/global.css';
import { inter } from '@/ui/common/fonts'
import "@interchain-ui/react/styles";
import { PublicEnvScript } from 'next-runtime-env';
import ClientLayout from '@/providers/client-layout';
import "@/init-long";
import { getTrustDepositParams } from '@/lib/trustDepositParams';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { config } from '@fortawesome/fontawesome-svg-core';

config.autoAddCss = false;

export const metadata = { title: 'Verana Front', description: 'Verana Front' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const trustDepositParamsResult = await getTrustDepositParams(); // 1 fetch for request (dedupe + ISR)

  return (
    <html lang="en" className={`${inter.variable}`}>
      <head>
        <PublicEnvScript />
      </head>
      <body className="app-body">
        <ClientLayout trustDepositParams={trustDepositParamsResult.params}> {children} </ClientLayout>
      </body>
    </html>
  )
}

