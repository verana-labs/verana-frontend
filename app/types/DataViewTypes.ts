// Field descriptor for a generic data type T
export type Field<T> = {
  name: keyof T;
  label: string;
  type: "data" | "action";
};

// Section grouping a subset of fields of T under a common title
export type Section<T> = {
  name: string;
  fields: Field<T>[];
};

// Props for a DataView component: a title, sections, and the data object
export interface DataViewProps<T extends object> {
  title: string;
  sections: Section<T>[];
  data: T;
  id: string
}

//Account data
export interface AccountData {
  balance: string | null;
  totalTrustDeposit: string | null;
  claimableInterest: string | null;
  reclaimable: string | null;
  message: string | null;
  getVNA: string | null;
  claimInterest: string | null;
  reclaimDeposit: string | null;
}

// Sections configuration for AccountData
export const accountSections: Section<AccountData>[] = [
  {
    name: 'Main Balance',
    fields: [
      { name: 'balance', label: 'Available', type: "data" },
      { name: 'getVNA', label: 'get VNA', type: "action" }
    ]
  },
  {
    name: 'Trust Deposit',
    fields: [
      { name: 'totalTrustDeposit', label: 'Total', type: "data" },
      { name: 'claimableInterest', label: 'Claimable Interests', type: "data" },
      { name: 'reclaimable', label: 'Reclaimable', type: "data" },
      { name: 'message', label: 'Message', type: "data" },
      { name: 'claimInterest', label: 'claim interests', type: "action" },
      { name: 'reclaimDeposit', label: 'reclaim deposit', type: "action" }

    ]
  }
];

//Dashboard data
export interface DashboardData {
  chainName: string | null;
  blockHeight: string | null;
  status: string | null;
  isWalletConnected: string | null;
  address: string | null;
  walletPrettyName: string | null;
}

// Sections configuration for DashboardData
export const dashboardSections: Section<DashboardData>[] = [
  {
    name: '',
    fields: [
      { name: 'chainName', label: 'Connected to', type: "data" },
      { name: 'blockHeight', label: 'Block height', type: "data" },
      { name: 'status', label: 'State', type: "data" },
      { name: 'isWalletConnected', label: 'Wallet Connected', type: "data" },
      { name: 'address', label: 'Address', type: "data" },
      { name: 'walletPrettyName', label: 'Wallet', type: "data" }
    ]
  }
];

//DID data
export interface DidData {
  did: string;
  controller: string;
  created: string;
  modified: string;
  exp: string;
  deposit: string;
  renowDID: string | null;
  touchDID: string | null;
  removeDID: string | null;
}

// Sections configuration for DidData
export const didSections: Section<DidData>[] = [
  {
    name: '',
    fields: [
      { name: 'did', label: 'DID', type: "data" },
      { name: 'controller', label: 'Controller', type: "data" },
      { name: 'created', label: 'Created', type: "data" },
      { name: 'modified', label: 'Modified', type: "data" },
      { name: 'exp', label: 'Expire', type: "data" },
      { name: 'deposit', label: 'Deposit', type: "data" }
    ]
  },
  {
    name: 'Actions',
    fields: [
      { name: 'renowDID', label: 'renow', type: "action" },
      { name: 'touchDID', label: 'touch', type: "action" },
      { name: 'removeDID', label: 'remove', type: "action" }
    ]
  }
];

