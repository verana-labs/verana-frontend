import { BanknotesIcon, CurrencyDollarIcon, IdentificationIcon, InformationCircleIcon, LinkIcon, ListBulletIcon, ShieldCheckIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { ComponentType } from "react";

/* Utility type: returns keys of T whose value type is assignable to V */
type KeysWithType<T, V> = {
  [K in keyof T]-?: Exclude<T[K], undefined | null> extends V ? K : never
}[keyof T];

// Define a TypeToken with a string identifier
export type TypeToken<I> = { readonly __type?: I; readonly typeName: string };

// Factory helper
export const typeOf = <I>(typeName: string): TypeToken<I> =>
  ({ typeName } as TypeToken<I>);

// Example tokens
export const CsDataToken = typeOf<CsData>("CsData");

/* Section: groups a set of fields for a given type */
export type Section<I> = {
  name: string;
  icon?: ComponentType<{ className?: string }>;
  type?: "basic" | "help" | "advanced";
  help?: string[];
  fields?: Field<I>[];
};

/* Base field shared by all field types */
type BaseField = {
  label: string;
  show?: 'view' | 'edit' | 'all' | 'none' | 'create';
  required?: boolean;
  update?: boolean;
  id?: boolean;
};

/* Field for simple data or actions */
/* Action */
type ActionField<T> = BaseField & {
  type: "action";
  name: keyof T;
};

/* Data */
type DataField<T> = BaseField & {
  type: "data";
  name: keyof T;
  inputType?: 'text' | 'number' | 'textarea' | 'select';
  options?: { value: string | number; label: string }[]; // (solo aplica si inputType === 'select');
  description?: string;
};

/* Data & Action */
type DataOrActionField<T> = DataField<T> | ActionField<T>;

/* Field for lists of strings */
type StringListField<T> = BaseField & {
  type: "list";
  // Must reference a property of T that is string[]
  name: KeysWithType<T, string[] | ReadonlyArray<string>>;
  objectData: "string";      // marker for simple string lists
  list?: string[];
};

/* Field for lists of objects */
type ObjectListField<T, I> = BaseField & {
  type: "list";
  // Must reference a property of T that is I[]
  name: KeysWithType<T, I[] | ReadonlyArray<I>>;
  objectSections: Section<I> | ReadonlyArray<Section<I>>;  // describes how to render each item
  objectData: TypeToken<I>;                               // type witness for item
  list?: I[];
};

/* Final Field type */
export type Field<T> =
  | DataOrActionField<T>
  | StringListField<T>
  | ObjectListField<T, any>; // eslint-disable-line @typescript-eslint/no-explicit-any


// Props for a DataView component: a title, sections, and the data object
export interface DataViewProps<T extends object> {
  sections: Section<T>[];
  data: T;
  id?: string;
  columnsCount?: number;
  columnsCountMd?: number;
  onEdit?: () => void;
  oneColumn?: boolean;
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
  docUrl?: string;
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
  csList?: CsData[];
}

//Governance Framework Document
export interface GfdData {
  creator: string;
  id: string;
  docLanguage: string;
  docUrl: string;
  version?: number;
}

// Minimal JSON Schema typing for your use case
export interface JsonSchema {
  $schema: string;
  $id: string;
  title?: string;
  description?: string;
  type: string;
  $defs?: Record<string, unknown>;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
}

export const managementModeOptions = [
  { value: 1, label: 'OPEN' },
  { value: 2, label: 'GRANTOR_VALIDATION' },
  { value: 3, label: 'TRUST_REGISTRY_VALIDATION' },
];

//CredentialSchema data
export interface CsData {
  creator: string;
  id: string | number;
  trId: string | number;
  issuerGrantorValidationValidityPeriod: number;
  verifierGrantorValidationValidityPeriod: number;
  issuerValidationValidityPeriod: number;
  verifierValidationValidityPeriod: number;
  holderValidationValidityPeriod: number;
  issuerPermManagementMode: string | number;
  verifierPermManagementMode: string | number;
  jsonSchema: string; 
  updateCredentialSchema: string | null;
  archiveCredentialSchema: string | null;
  title?: string;
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

// Sections configuration for CsData
export const CsSections: Section<CsData>[] = [
  {
    name: "",
    type: "basic",
    fields: [
      { name: 'issuerPermManagementMode', label: 'Issuer Permission Management Mode', type: "data", required: true, update: true, show: 'create',
        inputType: 'select', options: managementModeOptions,
        description: `defines how permission are managed for issuers of this Credential Schema:
        <ul class="list-disc pl-6">
        <li>OPEN means anyone can create its own ISSUER permission;</li>
        <li>GRANTOR_VALIDATION means a validation process MUST be run between a candidate ISSUER and an ISSUER_GRANTOR in order to create an ISSUER permission;</li>
        <li>TRUST_REGISTRY_VALIDATION means a validation process MUST be run between a candidate ISSUER and the trust registry owner in order to create an ISSUER permission.</li>
        </ul>
        Choose wisely, as a Credential Schemas is immutable and thus cannot be modified.`
       },
      { name: 'verifierPermManagementMode', label: 'Verifier Permission Management Mode', type: "data", required:true, update: true, show: 'create',
        inputType: 'select', options: managementModeOptions,
        description: `defines how permission are managed for verifiers of this Credential Schema:
        <ul class="list-disc pl-6">
        <li>OPEN means anyone can create its own VERIFIER permission;</li>
        <li>GRANTOR_VALIDATION means a validation process MUST be run between a candidate VERIFIER and a VERIFIER_GRANTOR in order to create a VERIFIER permission;</li>
        <li>TRUST_REGISTRY_VALIDATION means a validation process MUST be run between a candidate VERIFIER and the trust registry owner in order to create a VERIFIER permission.</li>
        </ul>
        Choose wisely, as a Credential Schema is immutable and thus cannot be modified.`
      },
      { name: 'issuerGrantorValidationValidityPeriod', label: 'Issuer Grantor Validation Validity Period', type: "data", required: true, update: true,
        description: `maximum number of days an issuer grantor validation can be valid for, in days. Use 0 so that validation never expires, or set a number of days lower than 3650. Example, if you want a validation process to be valid for one year so that applicant will have to renew the validation process each year, set this parameter to 365.`
       },
      { name: 'verifierGrantorValidationValidityPeriod', label: 'Verifier Grantor Validation Validity Period', type: "data", required: true, update: true,
        description: `maximum number of days a verifier grantor validation can be valid for, in days. Use 0 so that validation never expires, or set a number of days lower than 3650. Example, if you want a validation process to be valid for one year so that applicant will have to renew the validation process each year, set this parameter to 365.`
      },
      { name: 'issuerValidationValidityPeriod', label: 'Issuer Validation Validity Period', type: "data", required: true, update: true,
        description: `maximum number of days an issuer validation can be valid for, in days. Use 0 so that validation never expires, or set a number of days lower than 3650. Example, if you want a validation process to be valid for one year so that applicant will have to renew the validation process each year, set this parameter to 365.`
      },
      { name: 'verifierValidationValidityPeriod', label: 'Verifier Validation Validity Period', type: "data", required: true, update: true,
        description: `maximum number of days a verifier validation can be valid for, in days. Use 0 so that validation never expires, or set a number of days lower than 3650. Example, if you want a validation process to be valid for one year so that applicant will have to renew the validation process each year, set this parameter to 365.`
      },
      { name: 'holderValidationValidityPeriod', label: 'Holder Validation Validity Period', type: "data", required: true, update: true,
        description: `maximum number of days holder validation can be valid for, in days. Use 0 so that validation never expires, or set a number of days lower than 3650. Example, if you want a validation process to be valid for one year so that applicant will have to renew the validation process each year, set this parameter to 365.`
      },
      { name: 'jsonSchema', label: 'Json Schema', type: "data", inputType: "textarea", required: true, update: true, show: 'create',
        description: `A basic validation of your Json Schema will be done. Make sure to set the “$id” section to “verana-mainnet:/vpr/v1/cs/js/VPR_CREDENTIAL_SCHEMA_ID”.`
      },
      { name: 'creator', label: 'Controller', type: "data", show: "none" },
      { name: 'trId', label: 'TR Id', type: "data", show: "none" },
      { name: 'updateCredentialSchema', label: 'Controller', type: "action" },
      { name: 'archiveCredentialSchema', label: 'Controller', type: "action" }
    ]
  }
];

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
      { name: 'docs', label: '', type: "list", objectData: "string"}, // docs is string[]
      { name: 'addGovernanceFrameworkDocument', label: 'Add Governance Framework Document', type: "action" },
      { name: 'increaseActiveGovernanceFrameworkVersion', label: 'Increase Active Governance Framework Version', type: "action" }
    ]
  },
  {
    name: "Credential Schemas",
    icon: IdentificationIcon,
    type: "advanced",
    fields: [
      { name: 'csList', label: '', type: "list", objectData: CsDataToken, objectSections: CsSections} // csList is csData[]
    ]
  }
];

// ---- Type guards para Field<T> ----
export function isDataField<T>(f: Field<T>): f is Extract<Field<T>, { type: "data" }> {
  return f.type === "data";
}
export function isActionField<T>(f: Field<T>): f is Extract<Field<T>, { type: "action" }> {
  return f.type === "action";
}
export function isListField<T>(f: Field<T>): f is Extract<Field<T>, { type: "list" }> {
  return f.type === "list";
}
export function isStringListField<T>(f: Field<T>): f is StringListField<T> {
  return (f as any).objectData === "string"; // eslint-disable-line @typescript-eslint/no-explicit-any
}
export function isObjectListField<T>(f: Field<T>): f is ObjectListField<T, any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  return (f as any).objectData !== "string"; // eslint-disable-line @typescript-eslint/no-explicit-any
}

// --- Filter Show: "view" | "edit" | "create" ---
export type DataViewMode = "view" | "edit" | "create" ;

export function isFieldVisibleInMode<T>(field: Field<T>, mode: DataViewMode): boolean {
  const show = field.show ?? "all";
  if (show === "none") return false;
  if (show === "all") return true;
  if (show === "create" && mode === "view") return true;
  return show === mode;
}

export function visibleFieldsForMode<T>(fields: Field<T>[] | undefined, mode: DataViewMode): Field<T>[] {
  return (fields ?? []).filter(f => isFieldVisibleInMode(f, mode));
}

export function visibleFieldsForModeAndDataField<T>(fields: Field<T>[] | undefined, mode: DataViewMode): Field<T>[] {
  return (fields ?? []).filter(f => isFieldVisibleInMode(f, mode) && isDataField(f));
}

// ./app/types/dataViewTypes.ts
// 29:16  Error: 'T' is defined but never used.  @typescript-eslint/no-unused-vars
// 79:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
// 410:16  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
// 412:76  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
// 413:16  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
