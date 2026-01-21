'use client';

import { formatDate } from "@/util/util";
import { PermissionHistory } from "../dataview/datasections/perm";
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faBan, faCheck, faPlay, faPlus, faQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";

export default function PermissionTimeline({
    permissionHistory
}: {
  permissionHistory: PermissionHistory;
}) {
    const { label, icon, iconClass } = getTimelineStyle (permissionHistory.event_type);
    console.log("permissionHistory", permissionHistory);
  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
        <FontAwesomeIcon icon={icon} className={`text-xs ${iconClass}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-neutral-70 dark:text-neutral-70 mt-1">{formatDate(permissionHistory.created_at)}</p>
        {renderChanges(permissionHistory.changes)}
      </div>
    </div>
  );
};

export function getTimelineStyle(eventType: string): { label: string, icon: IconDefinition; iconClass: string } {
  switch (eventType) {
    case "CREATE_ROOT_PERMISSION":
    case "CREATE_PERMISSION":
      return { label: "Permission Created", icon: faPlus, iconClass: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" };
    case "START_PERMISSION_VP":
      return { label: "Start Validation Process", icon: faPlay, iconClass: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" };
    case "SET_VALIDATED_VP":
      return { label: "Accept and Set Validated", icon: faCheck, iconClass: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400" };
    case "REVOKE_PERMISSION":
      return { label: "Permission Revoked", icon: faBan, iconClass: "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" };
    default:
      return { label: "",  icon: faQuestion, iconClass: "bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400" };
  }
};

function tryParseJson(input: string): unknown {
  const trimmed = input.trim();
  if (!trimmed) return input;
  // Only attempt JSON parse for object/array-like strings
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return input;
  try {
    return JSON.parse(trimmed);
  } catch {
    return input;
  }
}

function formatChangeValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((v) => formatChangeValue(v)).join(", ");
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function renderChanges(changes: unknown): ReactNode {
  if (changes == null) return null;

  const normalized: unknown = typeof changes === "string" ? tryParseJson(changes) : changes;

  // If it's still a string after normalization, render it plainly.
  if (typeof normalized === "string") {
    const text = normalized.trim();
    if (!text) return null;
    return <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 break-all">{text}</p>;
  }

  // If it's an array, render each entry.
  if (Array.isArray(normalized)) {
    if (!normalized.length) return null;
    return (
      <ul className="mt-1 space-y-1">
        {normalized.map((item, idx) => {
          const text = formatChangeValue(item);
          if (!text) return null;
          return (
            <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 break-all">
              {text}
            </li>
          );
        })}
      </ul>
    );
  }

  // If it's an object, render key/value pairs.
  if (typeof normalized === "object") {
    const entries = Object.entries(normalized as Record<string, unknown>);
    if (!entries.length) return null;

    return (
      <div className="mt-1 space-y-1">
        {entries.map(([key, val]) => (
          <div key={key} className="text-xs break-all">
            <span className="font-medium text-gray-900 dark:text-white">{key}:</span>{" "}
            <span className="text-gray-700 dark:text-gray-300">{formatChangeValue(val)}</span>
          </div>
        ))}
      </div>
    );
  }

  // Fallback
  const fallback = formatChangeValue(normalized);
  if (!fallback) return null;
  return <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 break-all">{fallback}</p>;
}
