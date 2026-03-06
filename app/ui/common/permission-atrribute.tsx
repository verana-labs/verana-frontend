import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PermissionAction } from "../dataview/datasections/perm";
import { useEffect, useState } from "react";
import { copyToClipboard } from "@/util/util";
import { env } from 'next-runtime-env';
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "../dataview/types";

type PermissionAttributeProps = {
  label: string;
  value: string;
  mono?: boolean;
  actions?: PermissionAction[];
};

export default function PermissionAttribute({ label, value, mono, actions }: PermissionAttributeProps) {

  const [changeLabel, setChangeLabel] = useState(false);
  useEffect(() => {
    if (!changeLabel) return;
    const timeout = window.setTimeout(() => setChangeLabel(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [changeLabel]);

  // Returns the handler function to use in <button onClick={...}>
  const makeOnClick = (action: PermissionAction) => () => {
    switch (action.value) {
      case "copy":
        copyToClipboard(value);
        setChangeLabel(true);
        break;
      case "service":
        window.open(service(value), "_blank");
        break;
      case "explorer": {
        const explorerUrl = env('NEXT_PUBLIC_VERANA_EXPLORER_URL') || process.env.NEXT_PUBLIC_VERANA_EXPLORER_URL;
        if (explorerUrl) window.open(`${explorerUrl}/account/${value}`, "_blank");
        break;
      }
      default:
        console.error("PermissionAction", action);
    }
  };

  // Service action: only for did:web or did:webvh.
  // Extracts the domain (last part after the last ":") and redirects to https://{domain}
  function service(did: string): string | undefined {
    if (!did) return undefined;
    const isWeb = did.startsWith("did:web:");
    const isWebvh = did.startsWith("did:webvh:");
    if (!isWeb && !isWebvh) return undefined;
    const domain = did.split(":").pop();
    if (!domain) return undefined;
    return `https://${domain}`;
  }

  return (
    <div>
      <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">{label}</label>
      <p className={`text-sm ${mono ? "font-mono" : ""} text-gray-900 dark:text-white break-all`}>{value}</p>

      {actions?.length ? (
        <div className="flex items-center space-x-2 mt-1">
          {actions
            .filter((a) => a.value !== "service" || service(value))
            .map((a) => (
            <button
              key={`${label}-${a.label}`}
              onClick={makeOnClick(a)}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              type="button"
            >
              <FontAwesomeIcon icon={a.icon} className="mr-1" />
              { changeLabel && a.value === 'copy' ? resolveTranslatable({key: 'permissioncard.action.copied'}, translate) : a.label }
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}