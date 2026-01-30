import { Section } from "@/ui/dataview/types";
import { CsData } from "./cs";
import { languageOptions } from "./gfd";

const t = (key: string) => ({ key });

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
  archived?: string;
  active_version?: number;
  schemas?: string;
  docs?: string[];
  addGovernanceFrameworkDocument?: string; // action type
  increaseActiveGovernanceFrameworkVersion?: string; // action type
  versions?: {
    id: string;
    version: number;
    active_since: string;
    documents?: {
      id: string;
      url: string;
      language: string;
    }[];
  }[];
  last_version?: number;
  csList?: CsData[];
  participants?: number;
}

// Sections configuration for TrData
export const trSections: Section<TrData>[] = [
  {
    name: t("dataview.tr.sections.basicInformation"),
    // icon: ShieldCheckIcon,
    type: "basic",
    fields: [
      { name: "id", label: t("dataview.tr.fields.id"), type: "data", show: "none", update: false, id: true },
      {
        name: "did",
        label: t("dataview.tr.fields.did"),
        type: "data",
        show: "all",
        required: true,
        update: true,
        placeholder: "did:method:identifier",
        validation: { type: "DID" },
      },
      {
        name: "aka",
        label: t("dataview.tr.fields.aka"),
        type: "data",
        show: "all",
        required: true,
        update: true,
        validation: { type: "URL" },
      },
      { name: "controller", label: t("dataview.tr.fields.controller"), type: "data", show: "view", update: false },
      {
        name: "language",
        label: t("dataview.tr.fields.language"),
        type: "data",
        inputType: "select",
        options: languageOptions,
        show: "create view",
        required: false,
        update: false,
      },
      {
        name: "docUrl",
        label: t("dataview.tr.fields.docUrl"),
        type: "data",
        show: "create view",
        required: true,
        update: false,
        validation: { type: "URL" },
      },
      { name: "deposit", label: t("dataview.tr.fields.deposit"), type: "data", show: "view" },
      { name: "role", label: t("dataview.tr.fields.role"), type: "data", show: "none" },
      { name: "created", label: t("dataview.tr.fields.created"), type: "data", show: "none" },
      { name: "modified", label: t("dataview.tr.fields.modified"), type: "data", show: "none" },
      { name: "active_version", label: t("dataview.tr.fields.active_version"), type: "data", show: "view" },
      { name: "schemas", label: t("dataview.tr.fields.schemas"), type: "data", show: "none" },
    ],
  },
  // {
  //   name: t("dataview.tr.sections.governanceFrameworkDocuments"),
  //   // icon: ListBulletIcon,
  //   type: "advanced",
  //   fields: [
  //     { name: "docs", label: t("dataview.tr.fields.docs"), type: "list", objectData: "string" },
  //     { name: "addGovernanceFrameworkDocument", label: t("dataview.tr.actions.addGovernanceFrameworkDocument"), type: "action" },
  //     {
  //       name: "increaseActiveGovernanceFrameworkVersion",
  //       label: t("dataview.tr.actions.increaseActiveGovernanceFrameworkVersion"),
  //       type: "action",
  //     },
  //   ],
  // },
  // {
  //   name: t("dataview.tr.sections.credentialSchemas"),
  //   // icon: IdentificationIcon,
  //   type: "advanced",
  //   fields: [
  //     { name: "csList", label: t("dataview.tr.fields.csList"), type: "list", objectData: CsDataToken, objectSections: csSections },
  //   ],
  // },
];


//GFD data
export interface GfdData {
  docs?: string[];
  addGovernanceFrameworkDocument?: string; // action type
  increaseActiveGovernanceFrameworkVersion?: string; // action type
}

// Sections configuration for TrData
export const gfdSections: Section<GfdData>[] = [
  {
    name: t("dataview.tr.sections.governanceFrameworkDocuments"),
    // icon: ListBulletIcon,
    type: "advanced",
    fields: [
      { name: "docs", label: t("dataview.tr.fields.docs"), type: "list", objectData: "string" },
      { name: "addGovernanceFrameworkDocument", label: t("dataview.tr.actions.addGovernanceFrameworkDocument"), type: "action" },
      {
        name: "increaseActiveGovernanceFrameworkVersion",
        label: t("dataview.tr.actions.increaseActiveGovernanceFrameworkVersion"),
        type: "action",
      },
    ],
  }
];

export const htmlGfd = (
  version: string,
  url: string,
  language: string,
  state: string,
  strState: string
): string => {
  return `
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 px-3 gap-2 ${(state=="active") ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-700/50"} rounded-lg">
  <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
    <span class="text-sm font-medium text-gray-900 dark:text-white shrink-0">Version ${version}:</span>
    <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm cursor-pointer break-all sm:truncate sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]" title="${url}">${url}</a>
    <span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">(${language})</span>
  </div>
  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium shrink-0 self-start sm:self-auto ${(state=="draft") ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300": ((state=="active") ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 font-bold" : "text-gray-500 dark:text-gray-400")} ">
    ${strState}
  </span>
</div>
`;
};