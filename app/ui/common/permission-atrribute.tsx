import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PermissionAction } from "../dataview/datasections/perm";

type PermissionAttributeProps = {
  label: string;
  value: string;
  mono?: boolean;
  actions?: PermissionAction[];
};

export default function PermissionAttribute({ label, value, mono, actions }: PermissionAttributeProps) {
  return (
    <div>
      <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">{label}</label>
      <p className={`text-sm ${mono ? "font-mono" : ""} text-gray-900 dark:text-white break-all`}>{value}</p>

      {actions?.length ? (
        <div className="flex items-center space-x-2 mt-1">
          {actions.map((a) => (
            <button
              key={`${label}-${a.label}`}
              onClick={a.onClick}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              type="button"
            >
              <FontAwesomeIcon icon={a.icon} className="mr-1" />
              {a.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}