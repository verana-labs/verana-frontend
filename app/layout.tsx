import '@/app/ui/global.css';
import { lusitana, kantumruy } from '@/app/ui/common/fonts'
import "@interchain-ui/react/styles";
import NavBar from '@/app/ui/common/nav-bar';
import SideNav from '@/app/ui/common/sidenav';
import Providers from '@/app/providers';
import RequireConnectedWallet from '@/app/ui/common/require-connected-wallet';
import { PublicEnvScript } from 'next-runtime-env';
import { NotificationProvider } from './ui/common/notification-provider';

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
        <Providers>
          {/* <div className="w-[1440px] h-[1024px] relative bg-BG overflow-hidden"> */}
          <div className="max-w-[1440px] max-h-[1024px] flex flex-col min-h-screen mx-auto">
            {/* Header */}
            <header className="w-full bg-light-bg dark:bg-dark-bg">
              <NavBar />
            </header>
            {/* Main Container */}
            <div className="flex flex-1 flex-col md:flex-row">
              {/* Side Navigation */}
              {/* <div class="w-72 h-[956px] p-4 bg-White-900 border-r border-White-800 inline-flex flex-col justify-start items-start"> */}
              <aside
                className="
                  hidden md:block
                  w-72 h-[956px] p-4 border-r justify-start items-start
                  bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border
                "
              >
                <SideNav />
              </aside>
              {/* Content */}
              <main className="flex-1
                bg-content-light-bg dark:bg-content-dark-bg"
              >
                {/* <div className="w-[1112px] left-[304px] top-[92px] absolute inline-flex flex-col justify-start items-start gap-4"> */}
                <div className="max-w-screen-xl mx-auto md:min-h-screen p-6 ">
                  <RequireConnectedWallet>
                    <NotificationProvider>
                      {children}
                    </NotificationProvider>
                  </RequireConnectedWallet>
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}

