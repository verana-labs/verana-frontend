import { faCoins, faPlus } from '@fortawesome/free-solid-svg-icons'
import { createElement, Fragment } from 'react'
import { Section } from '@/ui/dataview/types'
import { formatVNAFromUVNA } from '@/util/util'

const t = (key: string) => ({ key })

//Account data
export interface AccountData {
  balance: string | null
  getVNA?: string | null // action type
  network: string | null
}

// Sections configuration for AccountData
export const accountSections: Section<AccountData>[] = [
  {
    // name: t("dataview.account.sections.mainBalance"),
    // icon: CurrencyDollarIcon,
    cardView: true,
    largeTexts: true,
    fields: [
      {
        name: 'balance',
        type: 'data',
        label: t('dataview.account.fields.balance.label'),
        description: t('dataview.account.fields.balance.desc'),
        icon: faCoins,
        iconClass: 'bg-gradient-to-br from-primary-500 to-primary-700',
        iconColorClass: 'text-white text-xl',
        hasStats: true,
        format: (value) => formatVNAFromUVNA(String(value)),
      },
    ],
  },
  {
    type: 'actions',
    name: t('dataview.account.sections.accountActions'),
    fields: [
      {
        name: 'getVNA',
        label: t('dataview.account.actions.getVNA.label'),
        type: 'action',
        description: t('dataview.account.actions.getVNA.desc'),
        icon: faPlus,
        iconClass: 'bg-gradient-to-br from-green-500 to-green-700',
        iconColorClass: 'text-white',
      },
    ],
  },
  {
    name: t('dataview.account.sections.accountInformation'),
    sectionBorder: true,
    fields: [
      {
        name: 'network',
        label: t('dataview.account.fields.network'),
        type: 'data',
        classField: 'flex items-center space-x-2 px-3 py-1 bg-success-50 dark:bg-success-900/20 rounded-full w-fit',
        format: (value) =>
          createElement(
            Fragment,
            null,
            createElement('span', { className: 'relative w-2 h-2 bg-success-500 rounded-full pulse-dot' }),
            createElement(
              'span',
              { className: 'text-sm text-success-700 dark:text-success-300 font-medium' },
              String(value)
            )
          ),
      },
    ],
  },
]
