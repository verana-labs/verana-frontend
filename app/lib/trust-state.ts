'use client';

import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "@/ui/dataview/types";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCircleCheck, faCircleExclamation, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { DidTrustState } from "@/lib/resolverClient";

export function trustStateBadge(state: DidTrustState | undefined | null): {
  label: string;
  icon: IconDefinition;
  iconColorClass: string;
} {
  switch (state) {
    case "TRUSTED":
      return {
        label: resolveTranslatable({ key: "permission.labeltruststate.trusted" }, translate) ?? "Trusted",
        icon: faCircleCheck,
        iconColorClass: "text-green-500",
      };
    case "UNTRUSTED":
      return {
        label: resolveTranslatable({ key: "permission.labeltruststate.untrusted" }, translate) ?? "Untrusted",
        icon: faCircleExclamation,
        iconColorClass: "text-red-500",
      };
    default:
      return {
        label: resolveTranslatable({ key: "permission.labeltruststate.unresolved" }, translate) ?? "Unresolved",
        icon: faCircleQuestion,
        iconColorClass: "text-gray-400 dark:text-gray-500",
      };
  }
}
