'use client'

import { type ParticipantActionParams, useActionParticipant } from '@/msg/actions_hooks/actionParticipant'
import type { MsgTypeParticipant } from '@/msg/constants/notificationMsgForMsgType'
import type { MessageType } from '@/msg/constants/types'
import type { SimulateResult } from '@/msg/util/signAndBroadcastManualAmino'
import EditableDataView from '@/ui/common/data-edit'
import {
  getParticipantActionSections,
  type Participant,
  type ParticipantData,
} from '@/ui/dataview/datasections/participant'

interface ParticipantActionProps {
  action: MsgTypeParticipant
  data: object
  onClose: () => void
  onRefresh?: (id?: string, txHeight?: number) => void
  setModalHidden?: () => void
}

export default function ParticipantActionPage({
  action,
  data,
  onClose,
  onRefresh,
  setModalHidden,
}: ParticipantActionProps) {
  const participant = data as Participant
  const submitParticipant = useActionParticipant(onClose, onRefresh)

  async function onSave(formData: object) {
    const form = formData as ParticipantData
    let params: ParticipantActionParams
    switch (action) {
      case 'MsgRenewParticipantOP':
      case 'MsgCancelParticipantOPLastRequest':
      case 'MsgRevokeParticipant':
      case 'MsgRepayParticipantSlashedTrustDeposit':
        params = { msgType: action, id: participant.id }
        break
      case 'MsgSetParticipantOPToValidated':
        params = {
          msgType: action,
          id: participant.id,
          effectiveUntil: form.effectiveUntil,
          validationFees: form.validationFees,
          issuanceFees: form.issuanceFees,
          verificationFees: form.verificationFees,
          issuanceFeeDiscount: form.issuanceFeeDiscount,
          verificationFeeDiscount: form.verificationFeeDiscount,
          opSummaryDigest: form.opSummaryDigest,
        }
        break
      case 'MsgSetParticipantEffectiveUntil':
        params = { msgType: action, id: participant.id, effectiveUntil: form.effectiveUntil }
        break
      case 'MsgSlashParticipantTrustDeposit':
        params = {
          msgType: action,
          id: participant.id,
          amount: form.amount ?? 0,
          reason: form.reason?.trim() ?? '',
        }
        break
      case 'MsgCreateRootParticipant':
        params = {
          msgType: action,
          schemaId: participant.schema_id,
          did: form.did ?? '',
          effectiveFrom: form.effectiveFrom,
          effectiveUntil: form.effectiveUntil,
          validationFees: form.validationFees,
          issuanceFees: form.issuanceFees,
          verificationFees: form.verificationFees,
        }
        break
      case 'MsgStartParticipantOP':
        params = {
          msgType: action,
          role: participant.role,
          validatorParticipantId: participant.validator_participant_id ?? 0,
          did: form.did ?? '',
          validationFees: form.validationFees,
          issuanceFees: form.issuanceFees,
          verificationFees: form.verificationFees,
        }
        break
      case 'MsgSelfCreateParticipant':
        params = {
          msgType: action,
          role: participant.role,
          validatorParticipantId: participant.validator_participant_id ?? 0,
          did: form.did ?? '',
          effectiveFrom: form.effectiveFrom,
          effectiveUntil: form.effectiveUntil,
          validationFees: form.validationFees,
          issuanceFees: form.issuanceFees,
          verificationFees: form.verificationFees,
        }
        break
      case 'MsgCreateOrUpdateParticipantSession':
        params = {
          msgType: action,
          id: participant.id,
          issuerParticipantId: form.issuerParticipantId,
          verifierParticipantId: form.verifierParticipantId,
          agentParticipantId: form.agentParticipantId,
          walletAgentParticipantId: form.walletAgentParticipantId,
          digest: form.digest ?? '',
        }
        break
    }
    await submitParticipant(params)
  }

  async function onSimulate(): Promise<SimulateResult | undefined> {
    if (
      action !== 'MsgRenewParticipantOP' &&
      action !== 'MsgCancelParticipantOPLastRequest' &&
      action !== 'MsgRevokeParticipant' &&
      action !== 'MsgRepayParticipantSlashedTrustDeposit'
    ) {
      return
    }
    const result = await submitParticipant({ msgType: action, id: participant.id }, true)
    if (result && !('transactionHash' in result)) return result
  }

  const noForm =
    action === 'MsgRenewParticipantOP' ||
    action === 'MsgCancelParticipantOPLastRequest' ||
    action === 'MsgRevokeParticipant' ||
    action === 'MsgRepayParticipantSlashedTrustDeposit'

  return (
    <EditableDataView<ParticipantData>
      sectionsI18n={getParticipantActionSections(action, ['VERIFIER', 'HOLDER'].includes(participant.role))}
      id={participant.id}
      messageType={action as MessageType}
      data={{}}
      onSave={onSave}
      onSimulate={onSimulate}
      isModal={true}
      onCancel={onClose}
      noForm={noForm}
      setModalHidden={setModalHidden}
      transactionCost={participant.transaction_cost}
    />
  )
}
