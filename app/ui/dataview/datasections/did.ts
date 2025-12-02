import { Section } from "@/ui/dataview/types";
import { faCalendarPlus, faHandPointer, faTrash } from "@fortawesome/free-solid-svg-icons";

const t = (key: string) => ({ key });

//DID data
export interface DidData {
  did: string;
  controller?: string;
  created?: string;
  modified?: string;
  exp?: string;
  deposit?: string;
  renewDID?: string; // action type
  touchDID?: string; // action type
  removeDID?: string; // action type
  years?: number;
}

export const yearsOptions = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' },
  { value: 10, label: '10' },
];

// Sections configuration for DidData
export const didSections: Section<DidData>[] = [
  {
    // name: t("dataview.did.sections.details"),
    // icon: IdentificationIcon,
    type: "basic",
    fields: [
      {
        name: "did",
        label: t("dataview.did.fields.did.label"),
        description: t("dataview.did.fields.did.desc"),
        type: "data",
        show: "create",
        update: true,
        required: true,
        placeholder: "did:method:identifier",
        validation: { type: "DID" },
      },
      {
        name: "years",
        label: t("dataview.did.fields.years.label"),
        description: t("dataview.did.fields.years.desc"),
        type: "data",
        inputType: "select",
        options: yearsOptions,
        show: "all",
        required: true,
        update: true,
      },
      { name: "controller", label: t("dataview.did.fields.controller"), type: "data", show: "view" },
      { name: "created", label: t("dataview.did.fields.created"), type: "data", show: "view" },
      { name: "modified", label: t("dataview.did.fields.modified"), type: "data", show: "view" },
      { name: "exp", label: t("dataview.did.fields.exp"), type: "data", show: "view" },
      { name: "deposit", label: t("dataview.did.fields.deposit"), type: "data", show: "view" },
    ],
  },
  {
    // icon: WrenchScrewdriverIcon,
    // name: t("dataview.did.sections.actions"),
    type: "actions",
    fields: [
      { name: "renewDID", label: t("dataview.did.actions.renew.label"), type: "action", description: t("dataview.did.actions.renew.desc"), icon: faCalendarPlus, iconClass: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" },
      { name: "touchDID", label: t("dataview.did.actions.touch.label"), type: "action", description: t("dataview.did.actions.touch.desc"), icon: faHandPointer, iconClass: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
      { name: "removeDID", label: t("dataview.did.actions.remove.label"), type: "action", description: t("dataview.did.actions.remove.desc"), icon: faTrash, iconClass: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400", isWarning: true },
    ],
  },
];
