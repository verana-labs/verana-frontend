import '@/app/ui/global.css';
import { lusitana, kantumruy } from '@/app/ui/common/fonts'
import "@interchain-ui/react/styles";
import NavBar from '@/app/ui/common/nav-bar';
import SideNav from '@/app/ui/common/sidenav';
import Providers from '@/app/providers';

export const metadata = { title: 'Verana Front', description: 'Verana Front' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${kantumruy.variable} ${lusitana.variable}`}>
      <body
        className="
          font-sans antialiased text-black text-base font-medium
          dark:text-white bg-light-bg dark:bg-dark-bg
          border-light-border dark:border-dark-border
        "
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            {/* Header */}
            <header className="w-full 
              bg-light-bg dark:bg-dark-bg
              "
            >
              <NavBar />
            </header>
            {/* Main Container */}
            <div className="flex flex-1 flex-col md:flex-row">
              {/* Side Navigation */}
              <aside
                className="
                  w-full md:w-64 flex-none
                  bg-light-bg dark:bg-dark-bg
                  border-b md:border-b-0 md:border-r
                  border-light-border dark:border-dark-border
                "
              >
                <SideNav />
              </aside>
              {/* Content */}
              <main className="flex-1 overflow-y-auto p-1 sm:p-2 md:p-3 lg:p-4
                bg-content-light-bg dark:bg-content-dark-bg"
              >
                <div className="max-w-screen-xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}

