import { faArrowUp, faBoxArchive, faPlus } from '@fortawesome/free-solid-svg-icons'
import { MessageType, MsgTypeInfoI18n, MsgTypeStyle } from '@/msg/constants/types'
import { I18nValues, Translatable } from '@/ui/dataview/types'

const t = (key: string, values?: I18nValues): Translatable => ({ key, values })

export const msgTypeConfig: Record<MessageType, MsgTypeInfoI18n> = {
  MsgStoreDigest: {
    label: t('messages.MsgStoreDigest.label'),
    description: t('messages.MsgStoreDigest.description'),
    cost: t('messages.MsgStoreDigest.cost'),
  },

  MsgReclaimTrustDepositYield: {
    label: t('messages.MsgReclaimTrustDepositYield.label'),
    description: t('messages.MsgReclaimTrustDepositYield.description'),
    cost: t('messages.MsgReclaimTrustDepositYield.cost'), // {value}
  },
  MsgRepaySlashedTrustDeposit: {
    label: t('messages.MsgRepaySlashedTrustDeposit.label'),
    description: t('messages.MsgRepaySlashedTrustDeposit.description'),
    cost: t('messages.MsgRepaySlashedTrustDeposit.cost'), // {value}
  },

  MsgCreateEcosystem: {
    label: t('messages.MsgCreateEcosystem.label'),
    description: t('messages.MsgCreateEcosystem.description'),
    cost: t('messages.MsgCreateEcosystem.cost'), // {value}
  },
  MsgUpdateEcosystem: {
    label: t('messages.MsgUpdateEcosystem.label'),
    description: t('messages.MsgUpdateEcosystem.description'),
    cost: t('messages.MsgUpdateEcosystem.cost'), // {value}
  },
  MsgArchiveEcosystem: {
    label: t('messages.MsgArchiveEcosystem.label'),
    description: t('messages.MsgArchiveEcosystem.description'),
    cost: t('messages.MsgArchiveEcosystem.cost'),
  },
  MsgUnarchiveEcosystem: {
    label: t('messages.MsgUnarchiveEcosystem.label'),
    description: t('messages.MsgUnarchiveEcosystem.description'),
    cost: t('messages.MsgUnarchiveEcosystem.cost'),
  },
  MsgAddGovernanceFrameworkDocument: {
    label: t('messages.MsgAddGovernanceFrameworkDocument.label'),
    description: t('messages.MsgAddGovernanceFrameworkDocument.description'),
    cost: t('messages.MsgAddGovernanceFrameworkDocument.cost'), // {value}
  },
  MsgIncreaseActiveGovernanceFrameworkVersion: {
    label: t('messages.MsgIncreaseActiveGovernanceFrameworkVersion.label'),
    description: t('messages.MsgIncreaseActiveGovernanceFrameworkVersion.description'),
    cost: t('messages.MsgIncreaseActiveGovernanceFrameworkVersion.cost'), // {value}
  },

  MsgCreateCredentialSchema: {
    label: t('messages.MsgCreateCredentialSchema.label'),
    description: t('messages.MsgCreateCredentialSchema.description'),
    cost: t('messages.MsgCreateCredentialSchema.cost'), // {value}
  },
  MsgUpdateCredentialSchema: {
    label: t('messages.MsgUpdateCredentialSchema.label'),
    description: t('messages.MsgUpdateCredentialSchema.description'),
    cost: t('messages.MsgUpdateCredentialSchema.cost'), // {value}
  },
  MsgArchiveCredentialSchema: {
    label: t('messages.MsgArchiveCredentialSchema.label'),
    description: t('messages.MsgArchiveCredentialSchema.description'),
    cost: t('messages.MsgArchiveCredentialSchema.cost'),
  },
  MsgUnarchiveCredentialSchema: {
    label: t('messages.MsgUnarchiveCredentialSchema.label'),
    description: t('messages.MsgUnarchiveCredentialSchema.description'),
    cost: t('messages.MsgUnarchiveCredentialSchema.cost'),
  },
  MsgCancelParticipantOPLastRequest: {
    label: t('messages.MsgCancelParticipantOPLastRequest.label'),
    description: t('messages.MsgCancelParticipantOPLastRequest.description'),
    cost: t('messages.MsgCancelParticipantOPLastRequest.cost'), // {value}
  },
  MsgRenewParticipantOP: {
    label: t('messages.MsgRenewParticipantOP.label'),
    description: t('messages.MsgRenewParticipantOP.description'),
    cost: t('messages.MsgRenewParticipantOP.cost'), // {value}
  },
  MsgSetParticipantOPToValidated: {
    label: t('messages.MsgSetParticipantOPToValidated.label'),
    description: t('messages.MsgSetParticipantOPToValidated.description'),
    cost: t('messages.MsgSetParticipantOPToValidated.cost'), // {value}
  },
  MsgSetParticipantEffectiveUntil: {
    label: t('messages.MsgSetParticipantEffectiveUntil.label'),
    description: t('messages.MsgSetParticipantEffectiveUntil.description'),
    cost: t('messages.MsgSetParticipantEffectiveUntil.cost'), // {value}
  },
  MsgRevokeParticipant: {
    label: t('messages.MsgRevokeParticipant.label'),
    description: t('messages.MsgRevokeParticipant.description'),
    cost: t('messages.MsgRevokeParticipant.cost'), // {value}
    warning: t('messages.MsgRevokeParticipant.warning'),
  },
  MsgCreateOrUpdateParticipantSession: {
    label: t('messages.MsgCreateOrUpdateParticipantSession.label'),
    description: t('messages.MsgCreateOrUpdateParticipantSession.description'),
    cost: t('messages.MsgCreateOrUpdateParticipantSession.cost'),
  },
  MsgSlashParticipantTrustDeposit: {
    label: t('messages.MsgSlashParticipantTrustDeposit.label'),
    description: t('messages.MsgSlashParticipantTrustDeposit.description'),
    cost: t('messages.MsgSlashParticipantTrustDeposit.cost'), // {value}
    warning: t('messages.MsgSlashParticipantTrustDeposit.warning'),
  },
  MsgRepayParticipantSlashedTrustDeposit: {
    label: t('messages.MsgRepayParticipantSlashedTrustDeposit.label'),
    description: t('messages.MsgRepayParticipantSlashedTrustDeposit.description'),
    cost: t('messages.MsgRepayParticipantSlashedTrustDeposit.cost'), // {value}
  },
  MsgCreateRootParticipant: {
    label: t('messages.MsgCreateRootParticipant.label'),
    description: t('messages.MsgCreateRootParticipant.description'),
    cost: t('messages.MsgCreateRootParticipant.cost'), // {value}
  },
  MsgStartParticipantOP: {
    label: t('messages.MsgStartParticipantOP.label'),
    description: t('messages.MsgStartParticipantOP.description'),
    cost: t('messages.MsgStartParticipantOP.cost'), // {value}
  },
  MsgSelfCreateParticipant: {
    label: t('messages.MsgSelfCreateParticipant.label'),
    description: t('messages.MsgSelfCreateParticipant.description'),
    cost: t('messages.MsgSelfCreateParticipant.cost'), // {value}
  },
  MsgCreateCorporation: {
    label: t('messages.MsgCreateCorporation.label'),
    description: t('messages.MsgCreateCorporation.description'),
    cost: t('messages.MsgCreateCorporation.cost'),
  },
  MsgGrantSelfOperatorAuthorization: {
    label: t('messages.MsgGrantSelfOperatorAuthorization.label'),
    description: t('messages.MsgGrantSelfOperatorAuthorization.description'),
    cost: t('messages.MsgGrantSelfOperatorAuthorization.cost'),
  },
}

// Utility function to fill {value} in the cost message
export function getCostMessage(template: string, value: string | number, td?: string | number) {
  return template.replace('{value}', String(value)).replace('{td}', String(td))
}

// Utility function to fill {value} and {link} in the low balance message
export function getLowBalanceMessage(template: string, value: string, fee?: string) {
  return template.replace('{value}', value).replace('{fee}', String(fee))
}

// Utility function to fill {addBalance} and {burnRate} in the description message
export function getDescriptionMessage(template: string, addBalance: string | number, burnRate: string | number) {
  return template.replace('{addBalance}', String(addBalance)).replace('{burnRate}', String(burnRate))
}

export const msgTypeStyle: Record<MessageType, MsgTypeStyle> = {
  MsgStoreDigest: {},
  MsgReclaimTrustDepositYield: {},
  MsgRepaySlashedTrustDeposit: {},
  MsgCreateEcosystem: {},
  MsgUpdateEcosystem: {},
  MsgArchiveEcosystem: {
    button: 'bg-gray-600 hover:bg-gray-700',
    icon: faBoxArchive,
  },
  MsgUnarchiveEcosystem: {
    button: 'bg-green-600 hover:bg-green-700',
    icon: faBoxArchive,
  },
  MsgAddGovernanceFrameworkDocument: {
    button: '',
    icon: faPlus,
  },
  MsgIncreaseActiveGovernanceFrameworkVersion: {
    button: 'bg-green-600 hover:bg-green-700',
    icon: faArrowUp,
  },
  MsgCreateCredentialSchema: {},
  MsgUpdateCredentialSchema: {},
  MsgArchiveCredentialSchema: {
    button: 'bg-gray-600 hover:bg-gray-700',
    icon: faBoxArchive,
  },
  MsgUnarchiveCredentialSchema: {
    button: 'bg-green-600 hover:bg-green-700',
    icon: faBoxArchive,
  },
  MsgCancelParticipantOPLastRequest: {
    button: 'bg-gray-600 hover:bg-gray-700',
  },
  MsgRenewParticipantOP: {},
  MsgSetParticipantOPToValidated: {
    button: 'bg-green-600 hover:bg-green-700',
  },
  MsgSetParticipantEffectiveUntil: {},
  MsgRevokeParticipant: {
    button: 'bg-red-600 hover:bg-red-700',
  },
  MsgCreateOrUpdateParticipantSession: {},
  MsgSlashParticipantTrustDeposit: {
    button: 'bg-red-600 hover:bg-red-700',
  },
  MsgRepayParticipantSlashedTrustDeposit: {
    button: 'bg-green-600 hover:bg-green-700',
  },
  MsgCreateRootParticipant: {},
  MsgSelfCreateParticipant: {},
  MsgStartParticipantOP: {},
  MsgCreateCorporation: {},
  MsgGrantSelfOperatorAuthorization: {},
}
