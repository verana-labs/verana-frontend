'use client'

import { useChain } from '@cosmos-kit/react'
import { FileJson2Icon, MonitorIcon, MoonIcon, ShieldIcon, SunIcon, WalletIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import * as React from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { useDiscoverCtx, useEcosystemsCtx } from '@/providers/api-rest-query-provider-context'
import type { CredentialSchemaListItem } from '@/ui/datatable/columnslist/cs'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/ui/shadcn/command'
import { useNavItems } from '@/ui/shell/nav-items'
import { shortenDID } from '@/util/util'

type CommandMenuCtx = { open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }

const CommandMenuContext = React.createContext<CommandMenuCtx | null>(null)

export function useCommandMenu() {
  const ctx = React.useContext(CommandMenuContext)
  if (!ctx) throw new Error('useCommandMenu must be used within CommandMenuProvider')
  return ctx
}

export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const value = React.useMemo(() => ({ open, setOpen }), [open])
  return <CommandMenuContext.Provider value={value}>{children}</CommandMenuContext.Provider>
}

export function useModifierKeyLabel() {
  const [label, setLabel] = React.useState('Ctrl')
  React.useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setLabel('⌘')
  }, [])
  return label
}

export function ecosystemLabel(ecosystem: EcosystemListItem) {
  return ecosystem.trustData?.serviceName || ecosystem.trustData?.organizationName || shortenDID(ecosystem.did)
}

export function useSearchableEntities() {
  const { ecosystemsList } = useEcosystemsCtx()
  const { discoverList, credentialSchemasByEcosystem } = useDiscoverCtx()

  return React.useMemo(() => {
    const ecosystems = new Map<string, EcosystemListItem>()
    for (const ecosystem of [...ecosystemsList, ...discoverList]) {
      if (!ecosystems.has(ecosystem.id)) ecosystems.set(ecosystem.id, ecosystem)
    }
    const schemas = new Map<string, CredentialSchemaListItem>()
    const allSchemas = [
      ...Object.values(credentialSchemasByEcosystem).flatMap((page) => page.items),
      ...[...ecosystems.values()].flatMap((ecosystem) => ecosystem.credentialSchemas ?? []),
    ]
    for (const schema of allSchemas) {
      if (!schemas.has(schema.id)) schemas.set(schema.id, schema)
    }
    return { ecosystems: [...ecosystems.values()], schemas: [...schemas.values()], ecosystemsById: ecosystems }
  }, [ecosystemsList, discoverList, credentialSchemasByEcosystem])
}

export function CommandMenu() {
  const { open, setOpen } = useCommandMenu()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const veranaChain = useVeranaChain()
  const { address, status, connect, openView } = useChain(veranaChain.chain_name)
  const pages = useNavItems()
  const { ecosystems, schemas, ecosystemsById } = useSearchableEntities()

  const run = (action: () => void) => {
    setOpen(false)
    action()
  }

  const themes = [
    { value: 'light', label: translate('settings.theme.light'), icon: <SunIcon /> },
    { value: 'dark', label: translate('settings.theme.dark'), icon: <MoonIcon /> },
    { value: 'system', label: translate('settings.theme.system'), icon: <MonitorIcon /> },
  ]

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={translate('palette.title')}
      description={translate('palette.description')}
      className="sm:max-w-lg"
    >
      <Command>
        <CommandInput
          placeholder={translate('palette.placeholder')}
          className="border-0 bg-transparent p-0 shadow-none focus:shadow-none focus:ring-0"
        />
        <CommandList className="max-h-[min(24rem,60svh)]">
          <CommandEmpty>{translate('palette.empty')}</CommandEmpty>
          <CommandGroup heading={translate('palette.group.pages')}>
            {pages.map((page) => (
              <CommandItem
                key={page.url}
                value={`page ${page.url}`}
                keywords={[page.title]}
                onSelect={() => run(() => router.push(page.url))}
              >
                {page.icon}
                <span>{page.title}</span>
                {page.badge ? <CommandShortcut>{page.badge}</CommandShortcut> : null}
              </CommandItem>
            ))}
          </CommandGroup>
          {ecosystems.length > 0 ? (
            <CommandGroup heading={translate('palette.group.ecosystems')}>
              {ecosystems.map((ecosystem) => (
                <CommandItem
                  key={ecosystem.id}
                  value={`ecosystem ${ecosystem.id}`}
                  keywords={[ecosystemLabel(ecosystem), ecosystem.did, `#${ecosystem.id}`]}
                  onSelect={() => run(() => router.push(`/ecosystems/${ecosystem.id}`))}
                >
                  <ShieldIcon />
                  <span className="truncate">{ecosystemLabel(ecosystem)}</span>
                  <CommandShortcut className="font-mono tracking-normal">#{ecosystem.id}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {schemas.length > 0 ? (
            <CommandGroup heading={translate('palette.group.schemas')}>
              {schemas.map((schema) => {
                const parent = ecosystemsById.get(schema.ecosystemId)
                return (
                  <CommandItem
                    key={schema.id}
                    value={`schema ${schema.id}`}
                    keywords={[schema.title, `#${schema.id}`, ...(parent ? [ecosystemLabel(parent)] : [])]}
                    onSelect={() => run(() => router.push(`/credential-schemas/${schema.id}`))}
                  >
                    <FileJson2Icon />
                    <span className="truncate">{schema.title || `#${schema.id}`}</span>
                    {parent ? (
                      <span className="truncate text-xs text-muted-foreground">{ecosystemLabel(parent)}</span>
                    ) : null}
                    <CommandShortcut className="font-mono tracking-normal">#{schema.id}</CommandShortcut>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ) : null}
          <CommandSeparator />
          <CommandGroup heading={translate('palette.group.theme')}>
            {themes.map((item) => (
              <CommandItem
                key={item.value}
                value={`theme ${item.value}`}
                keywords={[item.label]}
                data-checked={theme === item.value}
                onSelect={() => run(() => setTheme(item.value))}
              >
                {item.icon}
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          {address ? null : (
            <CommandGroup heading={translate('palette.group.wallet')}>
              <CommandItem
                value="wallet connect"
                keywords={[translate('wallet.dashboard.connect')]}
                disabled={status === 'Connecting'}
                onSelect={() => run(() => (status === 'NotExist' ? openView() : void connect()))}
              >
                <WalletIcon />
                <span>{translate('wallet.dashboard.connect')}</span>
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
