// Field descriptor for a generic data type T
export type Field<T> = {
  name: keyof T;
  label: string;
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
}

//Account data
export interface AccountData {
  balance: string | null;
  totalTrustDeposit: string | null;
  claimableInterest: string | null;
  reclaimable: string | null;
  message: string | null;
}

// Sections configuration for AccountData
export const accountSections: Section<AccountData>[] = [
  {
    name: 'Main Balance',
    fields: [
      { name: 'balance', label: 'Available' }
    ]
  },
  {
    name: 'Trust Deposit',
    fields: [
      { name: 'totalTrustDeposit', label: 'Total' },
      { name: 'claimableInterest', label: 'Claimable Interest' },
      { name: 'reclaimable', label: 'Reclaimable' },
      { name: 'message', label: 'Message' }
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
      { name: 'chainName', label: 'Connected to' },
      { name: 'blockHeight', label: 'Block height' },
      { name: 'status', label: 'State' },
      { name: 'isWalletConnected', label: 'Wallet Connected' },
      { name: 'address', label: 'Address' },
      { name: 'walletPrettyName', label: 'Wallet' }
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
}

// Sections configuration for DidData
export const didSections: Section<DidData>[] = [
  {
    name: '',
    fields: [
      { name: 'did', label: 'DID' },
      { name: 'controller', label: 'Controller' },
      { name: 'created', label: 'Created' },
      { name: 'modified', label: 'Modified' },
      { name: 'exp', label: 'Expire' },
      { name: 'deposit', label: 'Deposit' }
    ]
  }
];

