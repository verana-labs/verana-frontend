'use client'

import '@/styles/global.css'
import { RotateCwIcon, TriangleAlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type Locale, loadStoredLocale, resolveLocale, translateWithLocale } from '@/i18n/dataview'
import { logger } from '@/lib/logger'
import { Button } from '@/ui/shadcn/button'

function readStoredTheme(): string | null {
  try {
    return window.localStorage.getItem('theme')
  } catch {
    return null
  }
}

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [locale, setLocale] = useState<Locale>('en')
  const [dark, setDark] = useState(false)

  useEffect(() => {
    logger.error(error)
    setLocale(resolveLocale(loadStoredLocale(), navigator.languages))
    const stored = readStoredTheme()
    setDark(stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches))
  }, [error])

  const t = (key: string) => translateWithLocale(key, locale)

  return (
    <html lang={locale} className={dark ? 'dark' : undefined} style={{ colorScheme: dark ? 'dark' : 'light' }}>
      <body className="app-body flex min-h-svh items-center justify-center bg-page p-6 text-foreground">
        <title>{t('shell.error.title')}</title>
        <main className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <span
              aria-hidden="true"
              className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-tint-destructive text-destructive ring-1 ring-destructive/20"
            >
              <TriangleAlertIcon className="size-6" />
            </span>
            <h1 className="text-xl font-semibold tracking-[-0.015em]">{t('shell.error.title')}</h1>
            <p className="text-sm/relaxed text-muted-foreground text-balance">{t('shell.error.description')}</p>
            {error.digest ? (
              <p className="mt-1 inline-flex h-[22px] items-center gap-1.5 rounded-md bg-tint-neutral px-2 font-mono text-xs text-muted-foreground">
                {t('shell.error.reference')} {error.digest}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => retry()}>
              <RotateCwIcon />
              {t('shell.error.retry')}
            </Button>
            <Button asChild variant="outline">
              <a href="/dashboard">{t('shell.home')}</a>
            </Button>
          </div>
        </main>
      </body>
    </html>
  )
}
