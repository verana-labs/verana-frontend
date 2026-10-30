'use client'

import { useChain } from '@cosmos-kit/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { allowedOffline } from '@/lib/navlinks'
import { resolveTranslatable } from '@/ui/dataview/types'
import { Spinner } from '@/ui/shadcn/spinner'

const CONNECTED_ROUTES = [
  '/',
  '/account',
  '/agents',
  '/corporation',
  '/corporation/new',
  '/credential-schemas/add',
  '/ecosystems',
  '/ecosystems/add',
  '/pendingtasks',
]

function isStoredSession([key, value]: [string, string]) {
  if (!key.startsWith('cosmos-kit@') || !value) return false
  const trimmed = value.trim()
  return trimmed !== '' && trimmed !== '{}' && trimmed !== '[]' && trimmed !== 'null'
}

export default function RequireConnectedWallet({ children }: { children: React.ReactNode }) {
  const { chain_name } = useVeranaChain()
  const { status } = useChain(chain_name)
  const router = useRouter()
  const pathname = usePathname()
  const guarded = CONNECTED_ROUTES.includes(pathname) && !allowedOffline(pathname)

  const [hydrated, setHydrated] = useState(false)
  const [hasStoredWallet, setHasStoredWallet] = useState(false)
  const [bootWindowOpen, setBootWindowOpen] = useState(true)

  useEffect(() => {
    setHydrated(true)
    setHasStoredWallet(Object.entries(localStorage).some(isStoredSession))
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const timer = setTimeout(() => setBootWindowOpen(false), 1000)
    return () => clearTimeout(timer)
  }, [hydrated])

  const initializing = status === 'Connecting' || (status === 'Disconnected' && hasStoredWallet && bootWindowOpen)

  useEffect(() => {
    if (!hydrated || !guarded || initializing) return
    if (status !== 'Connected') router.replace('/dashboard')
  }, [hydrated, initializing, guarded, status, router])

  if (!hydrated) return null

  if (guarded && (initializing || status !== 'Connected')) {
    return (
      <div
        role="status"
        className="flex h-screen items-center justify-center gap-2 bg-page text-sm text-muted-foreground"
      >
        <Spinner aria-hidden="true" />
        {resolveTranslatable({ key: 'wallet.connecting' }, translate)}
      </div>
    )
  }

  return <>{children}</>
}
