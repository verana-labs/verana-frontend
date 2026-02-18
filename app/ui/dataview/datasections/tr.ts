import { Section } from "@/ui/dataview/types";
import { CsData } from "./cs";
import { languageOptions } from "./gfd";
import { faEdit } from "@fortawesome/free-solid-svg-icons";

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
  title?: string;
  description?: string;
  updateTrustRegistry?: string; // action type
}

// Sections configuration for TrData
export const trSections: Section<TrData>[] = [
  {
    name: t("dataview.tr.sections.basicInformation"),
    type: "basic",
    noEdit: true,
    fields: [
      { name: "id", label: t("dataview.tr.fields.id"), type: "data", show: "view", update: false, id: true },
      {
        name: "did",
        label: t("dataview.tr.fields.did"),
        type: "data",
        show: "none",
        required: true,
        update: true,
        placeholder: "did:method:identifier",
        validation: { type: "DID" },
      },
      {
        name: "aka",
        label: t("dataview.tr.fields.aka"),
        type: "data",
        show: "none",
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
        show: "view",
        required: false,
        update: false,
      },
      {
        name: "docUrl",
        label: t("dataview.tr.fields.docUrl"),
        type: "data",
        show: "none",
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
  {
    name: t("dataview.section.mutable"),
    nameCreate: t("dataview.tr.sections.basicInformation"),
    type: "basic",
    classFormEdit: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-6", //lg:grid-cols-3
    classFormCreate: "",
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
      { name: "controller", label: t("dataview.tr.fields.controller"), type: "data", show: "none", update: false },
      {
        name: "language",
        label: t("dataview.tr.fields.language"),
        type: "data",
        inputType: "select",
        options: languageOptions,
        show: "create",
        required: false,
        update: false,
      },
      {
        name: "docUrl",
        label: t("dataview.tr.fields.docUrl"),
        type: "data",
        show: "create",
        required: true,
        update: false,
        validation: { type: "URL" },
      },
      { name: "updateTrustRegistry", label: t("dataview.tr.actions.updateTrustRegistry"), type: "action", icon: faEdit, isEditButton: true },
    ],
  },
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
<div class="flex flex-wrap items-center justify-between gap-2 py-2 px-3 ${(state=="active") ? "bg-green-50 dark:bg-green-900/20" : "bg-gray-50 dark:bg-gray-700/50"} rounded-lg overflow-hidden">
  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
    <span class="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">Version ${version}:</span>
    <span class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm cursor-pointer break-all">${url}</span>
    <span class="text-xs text-gray-500 dark:text-gray-400">(${language})</span>
  </div>
  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${(state=="draft") ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300": ((state=="active") ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 font-bold" : "text-gray-500 dark:text-gray-400")} ">
    ${strState}
  </span>
</div>
`;
};