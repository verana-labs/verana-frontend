'use client';

export type MessageType =
  | 'MsgAddDID'
  | 'MsgRenewDID'
  | 'MsgTouchDID'
  | 'MsgRemoveDID'
  | 'MsgReclaimTrustDepositYield'
  | 'MsgReclaimTrustDeposit'
  | 'MsgRepaySlashedTrustDeposit'
  | 'MsgCreateTrustRegistry'
  | 'MsgUpdateTrustRegistry'
  | 'MsgArchiveTrustRegistry';

export interface MsgTypeInfo {
  label: string;
  description: string;
  cost: string; // Template string with {value} for fee/amount
}

export const msgTypeConfig: Record<MessageType, MsgTypeInfo> = {
  MsgAddDID: {
    label: 'Add DID',
    description: "Enter the DID you would like to add to the DID Directory and select the number of registration years. Make sure your DID is resolvable and its DID Document complies with the Verifiable Trust Specification.",
    cost: "Based on the selected number of years, you'll need approx. {value} VNA to complete the transaction.",
  },
  MsgRenewDID: {
    label: 'Renew DID',
    description: 'Select the number of registration years you would like to extend this DID.',
    cost: "Based on the selected number of years, you'll need approx. {value} VNA to complete the transaction.",
  },
  MsgTouchDID: {
    label: 'Touch DID',
    description: '"Touching" this DID will force its DID Document to be re-indexed by crawlers. Execute this transaction each time your DID Document has been modified.',
    cost: "You'll need approx. {value} VNA to complete this transaction.",
  },
  MsgRemoveDID: {
    label: 'Remove DID',
    description: 'This transaction will remove this DID from the DID Directory. It will not be indexed by crawlers anymore, and should be removed from search engines soon.',
    cost: "You'll need approx. {value} VNA to complete this transaction. Your corresponding {td} trust deposit will be freed.",
  },
  MsgReclaimTrustDepositYield: {
    label: 'Confirm',
    description: 'Claiming your interests will transfer them to your Main Balance.',
    cost: 'You’ll need approx. {value} VNA to complete this transaction.',
  },
  MsgReclaimTrustDeposit: {
    label: 'Confirm',
    description: 'Destructive action! I understand that reclaiming freed trust deposit will transfer {addBalance}% of my reclaimable balance to my main balance and burn the remaining {burnRate}%.',
    cost: 'You’ll need approx. {value} VNA to complete this transaction.',
  },
  MsgRepaySlashedTrustDeposit: {
    label: 'Repay Slashed Deposit',
    description: 'Repay slashed trust deposit.',
    cost: 'There is a {value} VNA fee for repaying slashed deposit.',
  },
  MsgCreateTrustRegistry: {
    label: 'Confirm',
    description: 'Fill-in this form to create a new Trust Registry. Note that the Governance Framework document URL must be persistent and immutable else Trust Resolution will fail. Fields with a * are mandatory.',
    cost: "Click confirm when you are ready. You'll need approx. {value} VNA to complete the transaction.",
  },
  MsgUpdateTrustRegistry: {
    label: 'Confirm',
    description: 'You can update the DID, aka, and Primary Governance Framework Language. If you change the Trust Registry DID, make sure the new DID is resolvable and that its DID Document complies with Verifiable Trust specifications.',
    cost: 'You’ll need approx. {value} VNA to complete this transaction.',
  },
  MsgArchiveTrustRegistry: {
    label: 'Archive Trust Registry',
    description: 'Archive a Trust Registry.',
    cost: 'There is no fee for archiving a trust registry.',
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
