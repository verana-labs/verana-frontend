'use client'

import { GlobeIcon, LanguagesIcon, type LucideIcon, PaletteIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { type ReactNode, useEffect, useState } from 'react'
import { VERANA_GRAPH_URL, VERANA_INDEXER_BASE_URL } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { getLocale, isLocale, SUPPORTED_LOCALES, saveLocale, setLocale, translate } from '@/i18n/dataview'
import { CopyValueButton } from '@/ui/agents-tasks-settings/copy-value-button'
import { THEMES, type ThemeOption, ThemeRadioCards } from '@/ui/agents-tasks-settings/theme-radio-cards'
import TitleAndButton from '@/ui/common/title-and-button'
import { resolveTranslatable } from '@/ui/dataview/types'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'

const t = (key: string) => resolveTranslatable({ key }, translate) ?? key

const isThemeOption = (value: string | undefined): value is ThemeOption => THEMES.some((option) => option === value)

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <StaggerItem as="section">
      <Card className="gap-5 py-5 shadow-card ring-0 sm:py-6 [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]">
        <CardHeader className="grid-cols-[auto_1fr] gap-x-3">
          <span className="row-span-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-4" />
          </span>
          <CardTitle>
            <h2 className="text-base font-semibold">{title}</h2>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </StaggerItem>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const chain = useVeranaChain()
  const locale = getLocale()

  useEffect(() => {
    setMounted(true)
  }, [])

  const changeLocale = (value: string) => {
    if (!isLocale(value) || value === locale) return
    saveLocale(value)
    setLocale(value)
    // translate() is not reactive and some copy is read at module load, so a reload applies the change everywhere.
    window.location.reload()
  }

  const network: [string, string | undefined][] = [
    ['chainName', chain.chain_name],
    ['chainId', chain.chain_id],
    ['rpc', chain.apis?.rpc?.[0]?.address],
    ['indexer', VERANA_INDEXER_BASE_URL],
    ['graph', VERANA_GRAPH_URL],
    ['explorer', chain.explorers?.[0]?.url],
  ]

  return (
    <>
      <TitleAndButton title={t('settings.title')} description={[t('settings.desc')]} />

      <Stagger className="flex max-w-3xl flex-col gap-4">
        <SettingsSection
          icon={LanguagesIcon}
          title={t('settings.locale.title')}
          description={t('settings.locale.desc')}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="settings-locale" className="sr-only">
              {t('settings.locale.label')}
            </label>
            <select
              id="settings-locale"
              className="select w-full sm:w-72"
              value={locale}
              onChange={(event) => changeLocale(event.target.value)}
            >
              {SUPPORTED_LOCALES.map((option) => (
                <option key={option} value={option}>
                  {t(`settings.locale.${option}`)}
                </option>
              ))}
            </select>
          </div>
        </SettingsSection>

        <SettingsSection icon={PaletteIcon} title={t('settings.theme.title')} description={t('settings.theme.desc')}>
          <ThemeRadioCards
            value={mounted && isThemeOption(theme) ? theme : undefined}
            onChange={setTheme}
            label={t('settings.theme.title')}
            optionLabel={(option) => t(`settings.theme.${option}`)}
          />
        </SettingsSection>

        <SettingsSection icon={GlobeIcon} title={t('settings.network.title')} description={t('settings.network.desc')}>
          <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {network.map(([key, value]) => (
              <div
                key={key}
                className="grid grid-cols-1 gap-x-6 gap-y-0.5 px-3.5 py-2.5 transition-colors duration-(--duration-base) hover:bg-muted/40 sm:grid-cols-[10rem_1fr] sm:items-center"
              >
                <dt className="text-sm text-muted-foreground">{t(`settings.network.${key}`)}</dt>
                <dd className="flex min-w-0 items-center justify-between gap-2">
                  {value ? (
                    <>
                      <span className="min-w-0 font-mono text-xs break-all text-foreground sm:text-sm">{value}</span>
                      <CopyValueButton value={value} label={t(`settings.network.${key}`)} className="-me-1.5" />
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">{t('settings.network.missing')}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </SettingsSection>
      </Stagger>
    </>
  )
}
