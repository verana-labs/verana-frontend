'use client'

import { useTheme } from 'next-themes'
import type { ReactNode } from 'react'
import { VERANA_INDEXER_BASE_URL } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { getLocale, isLocale, SUPPORTED_LOCALES, saveLocale, setLocale, translate } from '@/i18n/dataview'
import TitleAndButton from '@/ui/common/title-and-button'
import { resolveTranslatable } from '@/ui/dataview/types'

const t = (key: string) => resolveTranslatable({ key }, translate) ?? key

const THEMES = ['light', 'dark'] as const

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="mb-6 bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-4">{description}</p>
      {children}
    </section>
  )
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const chain = useVeranaChain()
  const locale = getLocale()

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
    ['rest', chain.apis?.rest?.[0]?.address],
    ['indexer', VERANA_INDEXER_BASE_URL],
    ['explorer', chain.explorers?.[0]?.url],
  ]

  return (
    <>
      <TitleAndButton title={t('settings.title')} description={[t('settings.desc')]} />

      <SettingsSection title={t('settings.locale.title')} description={t('settings.locale.desc')}>
        <label htmlFor="settings-locale" className="text-sm text-neutral-70 dark:text-neutral-70 block mb-1">
          {t('settings.locale.label')}
        </label>
        <select
          id="settings-locale"
          className="select w-full sm:w-64"
          value={locale}
          onChange={(event) => changeLocale(event.target.value)}
        >
          {SUPPORTED_LOCALES.map((option) => (
            <option key={option} value={option}>
              {t(`settings.locale.${option}`)}
            </option>
          ))}
        </select>
      </SettingsSection>

      <SettingsSection title={t('settings.theme.title')} description={t('settings.theme.desc')}>
        <div role="radiogroup" className="flex gap-6">
          {THEMES.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
              <input
                type="radio"
                name="settings-theme"
                value={option}
                checked={(theme ?? 'light') === option}
                onChange={() => setTheme(option)}
              />
              {t(`settings.theme.${option}`)}
            </label>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title={t('settings.network.title')} description={t('settings.network.desc')}>
        <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-3">
          {network.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="text-sm text-neutral-70 dark:text-neutral-70">{t(`settings.network.${key}`)}</dt>
              <dd className="text-sm font-mono break-all text-gray-900 dark:text-white">
                {value ?? t('settings.network.missing')}
              </dd>
            </div>
          ))}
        </dl>
      </SettingsSection>
    </>
  )
}
