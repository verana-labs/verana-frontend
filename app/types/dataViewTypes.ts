import { BanknotesIcon, CurrencyDollarIcon, IdentificationIcon, InformationCircleIcon, LinkIcon, ListBulletIcon, ShieldCheckIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

// Field descriptor for a generic data type T
export type Field<T> = {
  name: keyof T;
  label: string;
  type: "data" | "action" | "list";
  inputType?: 'text' | 'number' | 'textarea' | 'select';
  options?: { value: string | number; label: string }[]; // Only for select
  show?: 'view' | 'edit' | 'all' | 'none' | 'create' ;
  required?: true | false;
  update?: true | false;
  id?: true | false;
  list ?: string[]; // Only for list
};

// Section grouping a subset of fields of T under a common title
export type Section<T> = {
  icon?: React.ComponentType<{ className?: string }>;
  name: string;
  fields?: Field<T>[];
  type?: "basic" | "help" | "advanced";
  help?: string[];
  
};

// Props for a DataView component: a title, sections, and the data object
export interface DataViewProps<T extends object> {
  sections: Section<T>[];
  data: T;
  id?: string;
  columnsCount?: number;
  columnsCountMd?: number;
  onEdit?: () => void;
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

export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
];

//Trust Registry data
export interface TrData {
  id: string;
  did: string;
  aka: string;
  controller: string;
  language: string;
  docUrl?: string
  deposit: string;
  role?: string;
  created?: string;
  modified?: string;
  active_version?: number;
  schemas?: string;
  docs?: string[];
  addGovernanceFrameworkDocument?: string | null;
  increaseActiveGovernanceFrameworkVersion?: string | null;
  versions?: {
    id: string; 
    version: number; 
    active_since: string; 
    documents?: {
      id: string; 
      url: string;
      language: string;
    }[] 
  }[];
  last_version?: number;
}

// Sections configuration for TrData
export const trSections: Section<TrData>[] = [
  {
    name: "Basic Information",
    icon: ShieldCheckIcon,
    type: "basic",
    fields: [
      { name: 'id', label: 'Id', type: "data", show: 'none', update: false, id: true },
      { name: 'did', label: 'DID', type: "data", show: 'all', required: true, update: true },
      { name: 'aka', label: 'Aka', type: "data", show: 'all', required: true, update: true },
      { name: 'controller', label: 'Controller', type: "data", show: 'all', update: false },
      { name: 'language', label: 'Primary Governance Framework Language', type: "data", inputType: 'select',
          options: languageOptions, show: 'all', required: true, update: true },
      { name: 'docUrl', label: 'Governance Framework Primary Document URL', type: "data", show: 'create', required: true, update: true },
      { name: 'deposit', label: 'Deposit', type: "data", show: 'view' },
      { name: 'role', label: 'Role', type: "data", show: 'none' },
      { name: 'created', label: 'Created', type: "data", show: 'none'  },
      { name: 'modified', label: 'Modified', type: "data", show: 'none' },
      { name: 'active_version', label: 'Active GF Version', type: "data", show: 'view' },
      { name: 'schemas', label: 'Schemas', type: "data", show: 'none' },
    ]
  },
  {
    name: "Governance Framework Documents",
    icon: ListBulletIcon,
    type: "advanced",
    fields: [
      { name: 'docs', label: '', type: "list"},
      { name: 'addGovernanceFrameworkDocument', label: 'Add Governance Framework Document', type: "action" },
      { name: 'increaseActiveGovernanceFrameworkVersion', label: 'Increase Active Governance Framework Version', type: "action" }
    ]
  }
];

//Governance Framework Document
export interface GfdData {
  creator: string;
  id: string;
  docLanguage: string;
  docUrl: string;
  version?: number;
}

// Sections configuration for GfdData
export const gfdSections: Section<GfdData>[] = [
  {
    name: "",
    icon: ShieldCheckIcon,
    type: "basic",
    fields: [
      { name: 'creator', label: 'Controller', type: "data", show: 'create', update: false },
      { name: 'docLanguage', label: 'Governance Framework Language', type: "data", inputType: 'select',
          options: languageOptions, show: 'create', required: true, update: true },
      { name: 'docUrl', label: 'Governance Framework Document URL', type: "data", show: 'create', required: true, update: true }
    ]
  }
];
