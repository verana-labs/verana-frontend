'use client'

import '@/styles/global.css'
import { TriangleAlertIcon } from 'lucide-react'
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
        <main className="flex w-full max-w-md flex-col items-center gap-3 rounded-2xl bg-card px-6 py-10 text-center shadow-card">
          <span
            aria-hidden="true"
            className="mb-1 flex size-12 items-center justify-center rounded-2xl bg-tint-destructive text-destructive ring-1 ring-destructive/20"
          >
            <TriangleAlertIcon className="size-6" />
          </span>
          <h1 className="text-xl font-semibold tracking-[-0.015em]">{t('shell.error.title')}</h1>
          <p className="text-sm text-muted-foreground text-balance">{t('shell.error.description')}</p>
          {error.digest ? (
            <p className="inline-flex h-[22px] items-center rounded-md bg-tint-neutral px-2 font-mono text-xs text-muted-foreground">
              {error.digest}
            </p>
          ) : null}
          <div className="mt-2 flex gap-2">
            <Button onClick={() => retry()}>{t('shell.error.retry')}</Button>
            <Button asChild variant="outline">
              <a href="/dashboard">{t('shell.home')}</a>
            </Button>
          </div>
        </main>
      </body>
    </html>
  )
}
