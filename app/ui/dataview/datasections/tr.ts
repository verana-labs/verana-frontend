import { IdentificationIcon, ListBulletIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

import { Section } from "@/ui/dataview/types";
import { CsData, CsDataToken, csSections } from "./cs";
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
}

// Sections configuration for TrData
export const trSections: Section<TrData>[] = [
  {
    name: t("dataview.tr.sections.basicInformation"),
    icon: ShieldCheckIcon,
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
      { name: "controller", label: t("dataview.tr.fields.controller"), type: "data", show: "all", update: false },
      {
        name: "language",
        label: t("dataview.tr.fields.language"),
        type: "data",
        inputType: "select",
        options: languageOptions,
        show: "all",
        required: true,
        update: true,
      },
      {
        name: "docUrl",
        label: t("dataview.tr.fields.docUrl"),
        type: "data",
        show: "create",
        required: true,
        update: true,
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
    name: t("dataview.tr.sections.governanceFrameworkDocuments"),
    icon: ListBulletIcon,
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
  },
  {
    name: t("dataview.tr.sections.credentialSchemas"),
    icon: IdentificationIcon,
    type: "advanced",
    fields: [
      { name: "csList", label: t("dataview.tr.fields.csList"), type: "list", objectData: CsDataToken, objectSections: csSections },
    ],
  },
];
