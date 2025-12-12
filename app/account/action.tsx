'use client';

import React, { useState } from 'react';
import EditableDataView from '@/ui/common/data-edit';
import { TdData, tdSections } from '@/ui/dataview/datasections/td';
import { useActionTD } from '@/msg/actions_hooks/actionTD';
import { MsgTypeTD } from '@/msg/constants/notificationMsgForMsgType';
import { ActionCardProps } from '@/ui/common/action-card';
import { faClock, faCoins } from '@fortawesome/free-solid-svg-icons';
import { AccountData } from '@/ui/dataview/datasections/account';
import { formatUSDfromUVNA } from '@/util/util';
import { useTrustDepositParams } from '@/hooks/useTrustDepositParams';
import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';

// Define TdActionPage props interface
interface TdActionProps {
  action: MsgTypeTD;  // Action type to perform
  setActiveActionId: () => void; // Collapse/hide action on cancel
  data: object;
  onRefresh?:  () => void; // Refresh TD data
}

export default function TdActionPage({ action, setActiveActionId, onRefresh, data }: TdActionProps) {
  // Compose initial data
  const [dataTD, setData] = useState<TdData>({
    claimedVNA: 0
  });

  const actionTD = useActionTD(setActiveActionId, onRefresh);
  const claimableInterests = (data as AccountData).claimableInterests?? undefined;
  const available = claimableInterests ? true : false;
  const trustUnitPrice = useTrustDepositParams().trustUnitPrice;
  const conversionFactorUSDfromVNA = 1_000_000 / Number(trustUnitPrice);

  const actionCardYield: ActionCardProps = {
    available,
    icon: available? faCoins : faClock,
    iconClass: available? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white' : 'bg-gray-100 dark:bg-gray-700/50 text-gray-400',
    title: resolveTranslatable({key: available ? 'actioncard.reclaimyield.title.available' : 'actioncard.reclaimyield.title.notavailable' }, translate)?? '',
    description: available? undefined : resolveTranslatable({key: 'actioncard.reclaimyield.description'}, translate),
    indicatorName: available? undefined : 'Current APY',
    indicatorValue: available? undefined : '4.2%',
    valueVNA: claimableInterests,
    classValue: 'text-orange-600 dark:text-orange-400',
    valueUSD: claimableInterests? formatUSDfromUVNA(claimableInterests.split('VNA')[0], conversionFactorUSDfromVNA) : undefined
  };

  // Save handler: called when the form is submitted
  async function onSave(newData: TdData) {
    setData(newData);
    const claimedVNA = Number(newData.claimedVNA ??  0);
    // Broadcast transaction with user input
    switch (action) {
      case 'MsgReclaimTrustDeposit':
        await actionTD({ msgType: 'MsgReclaimTrustDeposit', claimedVNA });
        break;
      case 'MsgReclaimTrustDepositYield':
        await actionTD({ msgType: 'MsgReclaimTrustDepositYield'});
        break;
      default:
        break;
    }
  }

  return (
    <>
      {/* Editable form */}
      <EditableDataView<TdData>
        sectionsI18n={tdSections}
        id={"id"}
        messageType={action}     
        data={dataTD}
        onSave={onSave}
        onCancel={setActiveActionId}
        noForm={action!=='MsgReclaimTrustDeposit'}
        actionCard={(action==='MsgReclaimTrustDepositYield') ? actionCardYield : undefined}
         />
    </>
  );

}
