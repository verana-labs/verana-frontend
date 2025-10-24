import { I18nValues, Translatable } from "@/ui/dataview/types";
import { MessageType, MsgTypeInfoI18n } from "@/msg/constants/types";

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
};

// Utility function to fill {value} in the cost message
export function getCostMessage(template: string, value: string | number, td?: string | number) {
  return template.replace('{value}', String(value)).replace('{td}', String(td));
}

// Utility function to fill {addBalance} {burnRate} in the description message
export function getDescriptionMessage(template: string, addBalance: string | number, burnRate: string | number) {
  return template.replace('{addBalance}', String(addBalance)).replace('{burnRate}', String(burnRate));
}

