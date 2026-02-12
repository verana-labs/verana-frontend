import { getModeLabel } from "@/ui/datatable/columnslist/cs";
import { Section, typeOf } from "@/ui/dataview/types";
import type { I18nValues } from "@/ui/dataview/types";
import { MSG_SCHEMA_ID } from "@/util/json_schema_util";
import { faBoxArchive, faEdit } from "@fortawesome/free-solid-svg-icons";

const t = (key: string, values?: I18nValues) => ({ key, values });

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
  archived?: string;
  jsonSchema: string;
  updateCredentialSchema?: string; // action type
  archiveCredentialSchema?: string; // action type
  state?: string;
  title?: string;
  description?: string;
}

export const CsDataToken = typeOf<CsData>("CsData");

export const managementModeOptions = [
  { value: 1, label: t("dataview.cs.managementMode.OPEN") },
  { value: 2, label: t("dataview.cs.managementMode.GRANTOR_VALIDATION") },
  { value: 3, label: t("dataview.cs.managementMode.TRUST_REGISTRY_VALIDATION") },
];

// Sections configuration for CsData
export const csSections: Section<CsData>[] = [
  {
    name: t("dataview.cs.sections.main"),
    type: "basic",
    classForm: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-6", //lg:grid-cols-3
    noEdit: true,
    fields: [
        {
        name: "id",
        label: t("dataview.cs.fields.id"),
        type: "data",
        required: true,
        update: false,
        show: "edit view"
        // description: t("dataview.cs.descriptions.id"),
      },
      {
        name: "state",
        label: t("dataview.cs.fields.id"),
        type: "data",
        required: true,
        update: false,
        show: "edit view"
        // description: t("dataview.cs.descriptions.id"),
      },
      {
        name: "issuerPermManagementMode",
        label: t("dataview.cs.fields.issuerPermManagementMode"),
        type: "data",
        required: true,
        update: false,
        inputType: "select",
        options: managementModeOptions,
        format: (value) => getModeLabel(String(value),"_ISSUER"),
        isHtml: true,
        // description: t("dataview.cs.descriptions.issuerPermManagementMode"),
      },
      {
        name: "verifierPermManagementMode",
        label: t("dataview.cs.fields.verifierPermManagementMode"),
        type: "data",
        required: true,
        update: false,
        inputType: "select",
        options: managementModeOptions,
        format: (value) => getModeLabel(String(value), "_VERIFIER"),
        isHtml: true,
        // description: t("dataview.cs.descriptions.verifierPermManagementMode"),
      },
      { name: "creator", label: t("dataview.cs.fields.creator"), type: "data", show: "none" },
      { name: "trId", label: t("dataview.cs.fields.trId"), type: "data", show: "none" },
      { name: "archiveCredentialSchema", label: t("dataview.cs.actions.archiveCredentialSchema"), type: "action", icon: faBoxArchive, iconColorClass: "bg-gray-600 text-white hover:bg-gray-700" },
    ],
  },
  {
    name: "Mutable Configuration",//t("dataview.cs.sections.main"),
    nameCreate: t("dataview.cs.sections.main"),
    type: "basic",
    classForm: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-6", //lg:grid-cols-3
    fields: [
        {
        name: "id",
        label: t("dataview.cs.fields.id"),
        type: "data",
        required: true,
        update: false,
        show: "none"
        // description: t("dataview.cs.descriptions.id"),
      },
      {
        name: "issuerGrantorValidationValidityPeriod",
        label: t("dataview.cs.fields.issuerGrantorValidationValidityPeriod"),
        type: "data",
        required: true,
        update: true,
        // description: t("dataview.cs.descriptions.issuerGrantorValidationValidityPeriod"),
      },
      {
        name: "verifierGrantorValidationValidityPeriod",
        label: t("dataview.cs.fields.verifierGrantorValidationValidityPeriod"),
        type: "data",
        required: true,
        update: true,
        // description: t("dataview.cs.descriptions.verifierGrantorValidationValidityPeriod"),
      },
      {
        name: "issuerValidationValidityPeriod",
        label: t("dataview.cs.fields.issuerValidationValidityPeriod"),
        type: "data",
        required: true,
        update: true,
        // description: t("dataview.cs.descriptions.issuerValidationValidityPeriod"),
      },
      {
        name: "verifierValidationValidityPeriod",
        label: t("dataview.cs.fields.verifierValidationValidityPeriod"),
        type: "data",
        required: true,
        update: true,
        // description: t("dataview.cs.descriptions.verifierValidationValidityPeriod"),
      },
      {
        name: "holderValidationValidityPeriod",
        label: t("dataview.cs.fields.holderValidationValidityPeriod"),
        type: "data",
        required: true,
        update: true,
        // description: t("dataview.cs.descriptions.holderValidationValidityPeriod"),
      },
      {
        name: "issuerPermManagementMode",
        label: t("dataview.cs.fields.issuerPermManagementMode"),
        type: "data",
        required: true,
        update: false,
        inputType: "select",
        options: managementModeOptions,
        format: (value) => getModeLabel(String(value),"_ISSUER"),
        isHtml: true,
        show: "create"
        // description: t("dataview.cs.descriptions.issuerPermManagementMode"),
      },
      {
        name: "verifierPermManagementMode",
        label: t("dataview.cs.fields.verifierPermManagementMode"),
        type: "data",
        required: true,
        update: false,
        inputType: "select",
        options: managementModeOptions,
        format: (value) => getModeLabel(String(value), "_VERIFIER"),
        isHtml: true,
        show: "create"
        // description: t("dataview.cs.descriptions.verifierPermManagementMode"),
      },
      {
        name: "jsonSchema",
        label: t("dataview.cs.fields.jsonSchema"),
        type: "data",
        inputType: "textarea",
        required: true,
        update: false,
        description: t("dataview.cs.descriptions.jsonSchema", { id: MSG_SCHEMA_ID }),
        validation: { type: "JSON_SCHEMA" },
        show: "create"
      },
      { name: "creator", label: t("dataview.cs.fields.creator"), type: "data", show: "none" },
      { name: "trId", label: t("dataview.cs.fields.trId"), type: "data", show: "none" },
      { name: "updateCredentialSchema", label: t("dataview.cs.actions.updateCredentialSchema"), type: "action", icon: faEdit, isEditButton: true },
    ],
  },
  {
    name: t("dataview.cs.fields.jsonSchema"),
    type: "basic",
    // classForm: "grid grid-cols-1 md:grid-cols-2 gap-6 mb-6", //lg:grid-cols-3
    fields: [
      {
        name: "jsonSchema",
        label: t("dataview.cs.fields.jsonSchema"),
        type: "data",
        inputType: "textarea",
        required: true,
        update: false,
        description: t("dataview.cs.descriptions.jsonSchema", { id: MSG_SCHEMA_ID }),
        validation: { type: "JSON_SCHEMA" },
      },
    ],
  }];
