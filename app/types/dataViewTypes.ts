import { BanknotesIcon, CurrencyDollarIcon, IdentificationIcon, InformationCircleIcon, LinkIcon, ShieldCheckIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

// Field descriptor for a generic data type T
export type Field<T> = {
  name: keyof T;
  label: string;
  type: "data" | "action";
};

// Section grouping a subset of fields of T under a common title
export type Section<T> = {
  icon?: React.ComponentType<{ className?: string }>;
  name: string;
  fields?: Field<T>[];
  type?: "data" | "help";
  help?: string[];
};

// Props for a DataView component: a title, sections, and the data object
export interface DataViewProps<T extends object> {
  sections: Section<T>[];
  data: T;
  id: string;
  columnsCount?: number;
  columnsCountMd?: number;
}

//Account data
export interface AccountData {
  balance: string | null;
  totalTrustDeposit: string | null;
  claimableInterests: string | null;
  reclaimable: string | null;
  message: string | null;
  getVNA: string | null;
  claimInterests: string | null;
  reclaimDeposit: string | null;
}

// Sections configuration for AccountData
export const accountSections: Section<AccountData>[] = [
  {
    name: 'Main Balance',
    icon: CurrencyDollarIcon,
    fields: [
      { name: 'balance', label: 'Available', type: "data" },
      { name: 'getVNA', label: 'Get VNA', type: "action" }
    ]
  },
  {
    name: 'Trust Deposit',
    icon: BanknotesIcon,
    fields: [
      { name: 'totalTrustDeposit', label: 'Total', type: "data" },
      { name: 'claimableInterests', label: 'Claimable Interests', type: "data" },
      { name: 'reclaimable', label: 'Reclaimable', type: "data" },
      { name: 'message', label: 'Message', type: "data" },
      { name: 'claimInterests', label: 'Claim interests', type: "action" },
      { name: 'reclaimDeposit', label: 'Reclaim deposit', type: "action" }

    ]
  },
  {
    type: "help",
    help: [
      "Available is your main balance, the VNA you can spend for executing transactions. When you purchase VNA tokens, they are delivered in the available balance.",
      "Trust deposit is the VNA that has been deposited as trust guarantee.",
      "Claimable interests: Your trust deposit is producing yield. You can claim earned yield and transfer it to your available balance.",
      "Reclaimable is the VNA that still is in your trust deposit, but has been freed and can be reclaimed. The reclaimable balance is automatically reused for newly needed trust deposit amounts, unless you reclaim it."
    ],
    name: 'About your Balances',
    icon: InformationCircleIcon,
    fields: []
  },

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
    name: "Connection Details",
    icon: LinkIcon,
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
  renewDID: string | null;
  touchDID: string | null;
  removeDID: string | null;
}

// Sections configuration for DidData
export const didSections: Section<DidData>[] = [
  {
    name: "DID Details",
    icon: IdentificationIcon,
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
    icon: WrenchScrewdriverIcon,
    name: 'Actions',
    fields: [
      { name: 'renewDID', label: 'Renew', type: "action" },
      { name: 'touchDID', label: 'Touch', type: "action" },
      { name: 'removeDID', label: 'Remove', type: "action" }
    ]
  }
];

//Trust Registry data
export interface TrData {
  id: string;
  did: string;
  aka: string;
  controller: string;
  language: string;
  deposit: string;
  role?: string;
  created?: string;
  modified?: string;
  active_version?: string;
  schemas?: string;
}

// Sections configuration for TrData
export const trSections: Section<TrData>[] = [
  {
    name: "Basic Information",
    icon: ShieldCheckIcon,
    fields: [
      { name: 'id', label: 'Trust Registry Id', type: "data" },
      { name: 'did', label: 'DID', type: "data" },
      { name: 'aka', label: 'Aka', type: "data" },
      { name: 'controller', label: 'Controller', type: "data" },
      { name: 'language', label: 'Primary Governance Framework Language', type: "data" },
      { name: 'deposit', label: 'Deposit', type: "data" },
      { name: 'role', label: 'Role', type: "data" },
      { name: 'created', label: 'Created', type: "data" },
      { name: 'modified', label: 'Modified', type: "data" },
      { name: 'active_version', label: 'Active GF Version', type: "data" },
      { name: 'schemas', label: 'Schemas', type: "data" },
    ]
  }
];
