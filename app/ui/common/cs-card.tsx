'use client';

import React, { useState } from "react";
import { CsList, getModeLabel } from "../datatable/columnslist/cs";
import { resolveTranslatable } from "../dataview/types";
import { translate } from "@/i18n/dataview";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import JsonCodeBlock from "./json-code-block";

export type CsCardProps = {
  cs: CsList;
  onSelect?: () => void;
  selected?: boolean;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function CsCard({
  cs,
  onSelect,
  selected,
}: CsCardProps) {
  const [showJsonSchemaModal, setShowJsonSchemaModal] = useState<boolean>(false);
  
  return (
  <>
    <div
      onClick={onSelect? () => onSelect() : undefined}
      className={
        onSelect ? 
          cn(
          "border-2 rounded-xl p-4 cursor-pointer transition-all",
          selected
            ? "border-primary-600 shadow-[0_0_0_3px_rgba(118,62,240,0.2)]"
            : "border-neutral-20 dark:border-neutral-70",
          "hover:border-primary-300 dark:hover:border-primary-600",
          )
        : "bg-gray-50 dark:bg-gray-800/50 border border-neutral-20 dark:border-neutral-70 rounded-lg p-4 cursor-default"
      }
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.();
      }}
    >
      <div className="flex items-start space-x-3">
        { onSelect && (
          <input
            type="radio"
            checked={selected}
            readOnly
            className="mt-1 w-4 h-4 text-primary-600"
          />
        )}

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {cs.title}
            </h3>
            <span className="text-sm font-mono text-neutral-70 dark:text-neutral-70">
              {resolveTranslatable({key: "dataview.cs.fields.id"}, translate)}: {cs.id}
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                {resolveTranslatable({key: "dataview.cs.fields.issuerValidationValidityPeriod"}, translate)}
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {cs.issuerValidationValidityPeriod} days
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                {resolveTranslatable({key: "dataview.cs.fields.verifierValidationValidityPeriod"}, translate)}
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {cs.verifierValidationValidityPeriod} days
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                {resolveTranslatable({key: "dataview.cs.fields.issuerPermManagementMode"}, translate)}
              </label>
              <p
                  dangerouslySetInnerHTML={{ __html: getModeLabel(String(cs.issuerPermManagementMode),"_ISSUER") }}
              />
              {/* <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                {}
              </span> */}
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                {resolveTranslatable({key: "dataview.cs.fields.verifierPermManagementMode"}, translate)}
              </label>
              <p
                  dangerouslySetInnerHTML={{ __html: getModeLabel(String(cs.verifierPermManagementMode),"_VERIFIER") }}
              />
              {/* <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                {cs.verifierPermManagementMode}
              </span> */}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowJsonSchemaModal(true);
            }}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            type="button"
          >
            {"</>"} View JSON Schema
          </button>
        </div>
      </div>
    </div>

    {/* render json schema modal */}
    {showJsonSchemaModal && cs.jsonSchema && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-xl bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-6">
            {/* <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{"detailTitle"}</h3> */}
            <button
              onClick={() => setShowJsonSchemaModal(false)}
              className="absolute top-4 right-4 text-neutral-70 hover:text-gray-500 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          <JsonCodeBlock value={cs.jsonSchema}/>
        </div>
      </div>
    )}
 
  </>
  );
}
