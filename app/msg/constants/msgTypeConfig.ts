import { I18nValues, Translatable } from "@/ui/dataview/types";
import { MessageType, MsgTypeInfoI18n, MsgTypeStyle } from "@/msg/constants/types";
import { faArrowUp, faBoxArchive, faPlus } from "@fortawesome/free-solid-svg-icons";

const t = (key: string, values?: I18nValues): Translatable => ({ key, values });

export const msgTypeConfig: Record<MessageType, MsgTypeInfoI18n> = {
  MsgAddDID: {
    label: t("messages.MsgAddDID.label"),
    description: t("messages.MsgAddDID.description"),
    cost: t("messages.MsgAddDID.cost"), // {value}
  },
  MsgRenewDID: {
    label: t("messages.MsgRenewDID.label"),
    description: t("messages.MsgRenewDID.description"),
    cost: t("messages.MsgRenewDID.cost"), // {value}
  },
  MsgTouchDID: {
    label: t("messages.MsgTouchDID.label"),
    description: t("messages.MsgTouchDID.description"),
    cost: t("messages.MsgTouchDID.cost"), // {value}
  },
  MsgRemoveDID: {
    label: t("messages.MsgRemoveDID.label"),
    description: t("messages.MsgRemoveDID.description"),
    cost: t("messages.MsgRemoveDID.cost"), // {value} {td}
    warning: t("messages.MsgRemoveDID.warning")
  },

  MsgReclaimTrustDepositYield: {
    label: t("messages.MsgReclaimTrustDepositYield.label"),
    description: t("messages.MsgReclaimTrustDepositYield.description"),
    cost: t("messages.MsgReclaimTrustDepositYield.cost"), // {value}
  },
  MsgReclaimTrustDeposit: {
    label: t("messages.MsgReclaimTrustDeposit.label"),
    description: t("messages.MsgReclaimTrustDeposit.description"), // {addBalance} {burnRate}
    cost: t("messages.MsgReclaimTrustDeposit.cost"), // {value}
  },
  MsgRepaySlashedTrustDeposit: {
    label: t("messages.MsgRepaySlashedTrustDeposit.label"),
    description: t("messages.MsgRepaySlashedTrustDeposit.description"),
    cost: t("messages.MsgRepaySlashedTrustDeposit.cost"), // {value}
  },

  MsgCreateTrustRegistry: {
    label: t("messages.MsgCreateTrustRegistry.label"),
    description: t("messages.MsgCreateTrustRegistry.description"),
    cost: t("messages.MsgCreateTrustRegistry.cost"), // {value}
  },
  MsgUpdateTrustRegistry: {
    label: t("messages.MsgUpdateTrustRegistry.label"),
    description: t("messages.MsgUpdateTrustRegistry.description"),
    cost: t("messages.MsgUpdateTrustRegistry.cost"), // {value}
  },
  MsgArchiveTrustRegistry: {
    label: t("messages.MsgArchiveTrustRegistry.label"),
    description: t("messages.MsgArchiveTrustRegistry.description"),
    cost: t("messages.MsgArchiveTrustRegistry.cost"),
  },
  MsgAddGovernanceFrameworkDocument: {
    label: t("messages.MsgAddGovernanceFrameworkDocument.label"),
    description: t("messages.MsgAddGovernanceFrameworkDocument.description"),
    cost: t("messages.MsgAddGovernanceFrameworkDocument.cost"), // {value}
  },
  MsgIncreaseActiveGovernanceFrameworkVersion: {
    label: t("messages.MsgIncreaseActiveGovernanceFrameworkVersion.label"),
    description: t("messages.MsgIncreaseActiveGovernanceFrameworkVersion.description"),
    cost: t("messages.MsgIncreaseActiveGovernanceFrameworkVersion.cost"), // {value}
  },

  MsgCreateCredentialSchema: {
    label: t("messages.MsgCreateCredentialSchema.label"),
    description: t("messages.MsgCreateCredentialSchema.description"),
    cost: t("messages.MsgCreateCredentialSchema.cost"), // {value}
  },
  MsgUpdateCredentialSchema: {
    label: t("messages.MsgUpdateCredentialSchema.label"),
    description: t("messages.MsgUpdateCredentialSchema.description"),
    cost: t("messages.MsgUpdateCredentialSchema.cost"), // {value}
  },
  MsgArchiveCredentialSchema: {
    label: t("messages.MsgArchiveCredentialSchema.label"),
    description: t("messages.MsgArchiveCredentialSchema.description"),
    cost: t("messages.MsgArchiveCredentialSchema.cost"),
  },
  MsgCancelPermissionVPLastRequest: {
    label: t("messages.MsgCancelPermissionVPLastRequest.label"),
    description: t("messages.MsgCancelPermissionVPLastRequest.description"),
    cost: t("messages.MsgCancelPermissionVPLastRequest.cost"), // {value}
  },
  MsgRenewPermissionVP: {
    label: t("messages.MsgRenewPermissionVP.label"),
    description: t("messages.MsgRenewPermissionVP.description"),
    cost: t("messages.MsgRenewPermissionVP.cost"), // {value}
  },
  MsgSetPermissionVPToValidated: {
    label: t("messages.MsgSetPermissionVPToValidated.label"),
    description: t("messages.MsgSetPermissionVPToValidated.description"),
    cost: t("messages.MsgSetPermissionVPToValidated.cost"), // {value}
  },
  MsgExtendPermission: {
    label: t("messages.MsgExtendPermission.label"),
    description: t("messages.MsgExtendPermission.description"),
    cost: t("messages.MsgExtendPermission.cost"), // {value}
  },
  MsgRevokePermission: {
    label: t("messages.MsgRevokePermission.label"),
    description: t("messages.MsgRevokePermission.description"),
    cost: t("messages.MsgRevokePermission.cost"), // {value}
  },
  MsgSlashPermissionTrustDeposit: {
    label: t("messages.MsgSlashPermissionTrustDeposit.label"),
    description: t("messages.MsgSlashPermissionTrustDeposit.description"),
    cost: t("messages.MsgSlashPermissionTrustDeposit.cost"), // {value}
  },
  MsgRepayPermissionSlashedTrustDeposit: {
    label: t("messages.MsgRepayPermissionSlashedTrustDeposit.label"),
    description: t("messages.MsgRepayPermissionSlashedTrustDeposit.description"),
    cost: t("messages.MsgRepayPermissionSlashedTrustDeposit.cost"), // {value}
  },
  MsgCreateRootPermission: {
    label: t("messages.MsgCreateRootPermission.label"),
    description: t("messages.MsgCreateRootPermission.description"),
    cost: t("messages.MsgCreateRootPermission.cost"), // {value}
  }
};

// Utility function to fill {value} in the cost message
export function getCostMessage(template: string, value: string | number, td?: string | number) {
  return template.replace('{value}', String(value)).replace('{td}', String(td));
}

// Utility function to fill {addBalance} {burnRate} in the description message
export function getDescriptionMessage(template: string, addBalance: string | number, burnRate: string | number) {
  return template.replace('{addBalance}', String(addBalance)).replace('{burnRate}', String(burnRate));
}

export const msgTypeStyle: Record<MessageType, MsgTypeStyle> = {
  MsgAddDID: {},
  MsgRenewDID: {
    button: "bg-green-600 hover:bg-green-700"
  },
  MsgTouchDID: {
    button: "bg-blue-600 hover:bg-blue-700"
  },
  MsgRemoveDID: {
    button: "bg-red-600 hover:bg-red-700"
  },
  MsgReclaimTrustDepositYield: {},
  MsgReclaimTrustDeposit: {},
  MsgRepaySlashedTrustDeposit: {},
  MsgCreateTrustRegistry: {},
  MsgUpdateTrustRegistry: {},
  MsgArchiveTrustRegistry: {},
  MsgAddGovernanceFrameworkDocument: {
    button: "",
    icon: faPlus,
  },
  MsgIncreaseActiveGovernanceFrameworkVersion: {
    button: "bg-green-600 hover:bg-green-700",
    icon: faArrowUp
  },
  MsgCreateCredentialSchema: {},
  MsgUpdateCredentialSchema: {},
  MsgArchiveCredentialSchema: {
    button: "bg-gray-600 hover:bg-gray-700",
    icon: faBoxArchive
  },
  MsgCancelPermissionVPLastRequest: {
    button: "bg-gray-600 hover:bg-gray-700"
  },
  MsgRenewPermissionVP: {},
  MsgSetPermissionVPToValidated: {
    button: "bg-green-600 hover:bg-green-700"
  },
  MsgExtendPermission: {},
  MsgRevokePermission: {
    button: "bg-red-600 hover:bg-red-700"
  },
  MsgSlashPermissionTrustDeposit: {
    button: "bg-red-600 hover:bg-red-700"
  },
  MsgRepayPermissionSlashedTrustDeposit: {
    button: "bg-green-600 hover:bg-green-700"
  },
  MsgCreateRootPermission: {}
}
