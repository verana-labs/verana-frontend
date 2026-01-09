'use client';

import React from "react";
import { TrData } from "../dataview/datasections/tr";
import { formatLongDateUserLocale, formatVNA } from "@/util/util";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "@/ui/dataview/types";

export type EcosystemCardProps = {
  ecosystem: TrData;
};

export default function EcosystemCard({
  ecosystem
}: EcosystemCardProps) {

  return (
    <div
      className={`border border-neutral-20 dark:border-neutral-70 rounded-xl p-6 mb-6 ${'className'}`}
    >
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faShieldHalved} className="text-white text-2xl"/>
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {ecosystem.did}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ ecosystem.archived ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'}`}>
              {ecosystem.archived ? 'Inactive' : 'Active'}
            </span>
          </div>

          {ecosystem.aka ? (
            <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-4">
              {ecosystem.aka}
            </p>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                {resolveTranslatable({key: "dataview.tr.fields.did"}, translate)}
              </label>
              <p className="text-sm font-mono text-gray-900 dark:text-white break-all">
                {ecosystem.did}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                {resolveTranslatable({key: "dataview.tr.fields.created"}, translate)}
              </label>
              {ecosystem.created && (<p className="text-sm text-gray-900 dark:text-white">{formatLongDateUserLocale(ecosystem.created)}</p>)}
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                {resolveTranslatable({key: "dataview.tr.fields.participants"}, translate)}
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                0
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                {resolveTranslatable({key: "dataview.tr.fields.deposit"}, translate)}
              </label>
              <p className="text-sm font-mono text-gray-900 dark:text-white">
                {formatVNA(ecosystem.deposit)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
