'use client';

import React from "react";
import { TrData } from "../dataview/datasections/tr";
import { resolveTranslatable } from "../dataview/types";
import { translate } from "@/i18n/dataview";
import Link from "next/link";
import { formatLongDateUserLocale } from "@/util/util";
import { getLabelByValue } from "../dataview/datasections/gfd";

export type EgfCardProps = {
  ecosystem: TrData;
  accepted: boolean;
  onAcceptedChange: (next: boolean) => void;
};

export default function EgfCard({
  ecosystem,
  accepted,
  onAcceptedChange,
}: EgfCardProps) {
    const keyPoints = (resolveTranslatable({ key: "join.egf.keypoints" }, translate) as string)
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
    const version = ecosystem.versions?.find((x) => x.version === ecosystem.active_version);
    const egfDoc = version?.documents?.[0];
    const language = getLabelByValue(egfDoc?.language)??'';
  return (
    <div className="border border-neutral-20 dark:border-neutral-70 rounded-xl p-6 mb-6">
      <div className="flex items-start space-x-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
          {"icon"}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {ecosystem.did}
          </h3>
          <p className="text-sm text-neutral-70 dark:text-neutral-70 mt-1">
            {ecosystem.aka}
          </p>
          <p className="text-xs font-mono text-neutral-70 dark:text-neutral-70 mt-2">
            {ecosystem.did}
          </p>
        </div>
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <span>✅</span>
          <p className="text-sm font-medium text-green-800 dark:text-green-300">
            {resolveTranslatable({ key: "join.egf.verifiedtext" }, translate)}
          </p>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center mb-4">
        <div className="text-6xl text-gray-400 dark:text-gray-500 mb-4">
          📄
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {resolveTranslatable({ key: "join.egf.title" }, translate)}
        </h3>
        <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-4">
          {`${resolveTranslatable({ key: "join.egf.version.label" }, translate)} ${ecosystem.active_version}  • ${resolveTranslatable(language, translate)} • ${resolveTranslatable({ key: "join.egf.lastupdate.label" }, translate)} ${version?.active_since && formatLongDateUserLocale(version?.active_since)}`}
        </p>
        <Link
          href={egfDoc?.url??''}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {egfDoc?.url}
        </Link>
          
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {resolveTranslatable({ key: "join.egf.keypoints.label" }, translate)} 
        </h4>

        <ul className="space-y-2">
          {keyPoints.map((t) => (
            <li key={t} className="flex items-start">
              <span className="text-primary-500 mr-2 mt-0.5 text-sm">✔</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-start space-x-3">
        <input
          id="egf-accept"
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-1 w-4 h-4 text-primary-600 bg-white dark:bg-surface border-neutral-20 dark:border-neutral-70 rounded focus:ring-primary-500"
        />
        <label   
          htmlFor="egf-accept"
          className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
        >
          {resolveTranslatable({ key: "join.egf.acceptancemessage" }, translate)} 
        </label>
      </div>
    </div>
  );
}
