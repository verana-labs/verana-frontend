'use client'

import { faClock, faCoins } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import { useProtocolParams } from '@/hooks/useProtocolParams'
import { translate } from '@/i18n/dataview'
import { useActionTrustDeposit } from '@/msg/actions_hooks/actionTrustDeposit'
import { MsgTypeTD } from '@/msg/constants/notificationMsgForMsgType'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'
import type { ActionCardProps } from '@/ui/common/action-card'
import EditableDataView from '@/ui/common/data-edit'
import type { AccountData } from '@/ui/dataview/datasections/account'
import { type TdData, tdSections } from '@/ui/dataview/datasections/td'
import { resolveTranslatable } from '@/ui/dataview/types'
import { formatUSDfromUVNA } from '@/util/util'

// Define TdActionPage props interface
interface TdActionProps {
  action: MsgTypeTD // Action type to perform
  data: object
  onClose: () => void // Collapse/hide action on cancel
  onRefresh?: (id?: string, txHeight?: number) => void // Refresh TD data
}

export default function TdActionPage({ action, data, onClose, onRefresh }: TdActionProps) {
  // Compose initial data
  const [dataTD, setData] = useState<TdData>({
    claimedVNA: 0,
  })

  const actionTrustDeposit = useActionTrustDeposit(onClose, onRefresh)
  const claimableInterests = (data as AccountData).claimableInterests ?? undefined
  const available = Number(claimableInterests) > 0
  const trustUnitPrice = useProtocolParams().trustUnitPrice
  const conversionFactorUSDfromVNA = trustUnitPrice ? 1_000_000 / Number(trustUnitPrice) : 0

  const actionCardYield: ActionCardProps = {
    available,
    icon: available ? faCoins : faClock,
    iconClass: available
      ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white'
      : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400',
    title:
      resolveTranslatable(
        { key: available ? 'actioncard.reclaimyield.title.available' : 'actioncard.reclaimyield.title.notavailable' },
        translate
      ) ?? '',
    description: available ? undefined : resolveTranslatable({ key: 'actioncard.reclaimyield.description' }, translate),
    indicatorName: available ? undefined : 'Current APY',
    indicatorValue: available ? undefined : '4.2%',
    valueVNA: claimableInterests,
    classValue: 'text-orange-600 dark:text-orange-400',
    valueUSD: claimableInterests
      ? formatUSDfromUVNA(claimableInterests.split('VNA')[0], conversionFactorUSDfromVNA)
      : undefined,
  }

  // Save handler: called when the form is submitted
  async function onSave(newData: TdData) {
    setData(newData)
    const claimedVNA = Number(newData.claimedVNA ?? 0)
    // Broadcast transaction with user input
    switch (action) {
      case 'MsgReclaimTrustDepositYield':
        await actionTrustDeposit({ msgType: 'MsgReclaimTrustDepositYield' })
        break
      case 'MsgRepaySlashedTrustDeposit':
        await actionTrustDeposit({ msgType: 'MsgRepaySlashedTrustDeposit', deposit: claimedVNA })
        break
      default:
        break
    }
  }

  async function onSimulate(newData: TdData) {
    switch (action) {
      case 'MsgReclaimTrustDepositYield': {
        const res = await actionTrustDeposit({ msgType: 'MsgReclaimTrustDepositYield' }, true)
        if (res && typeof res === 'object' && !('transactionHash' in res)) {
          return res as SimulateResult
        }
        return undefined
      }
      default:
        return
    }
  }

  return (
    <>
      {/* Editable form */}
      <EditableDataView<TdData>
        sectionsI18n={tdSections}
        id={'id'}
        messageType={action}
        data={dataTD}
        onSave={onSave}
        onSimulate={onSimulate}
        onCancel={onClose}
        noForm={action === 'MsgReclaimTrustDepositYield'}
        actionCard={action === 'MsgReclaimTrustDepositYield' ? actionCardYield : undefined}
      />
    </>
  )
}
