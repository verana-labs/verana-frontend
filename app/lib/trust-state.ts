'use client';

import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "@/ui/dataview/types";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCertificate, faCircleExclamation, faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { DidTrustState } from "@/lib/resolverClient";

type TrustStateBadge = {
  label: string;
  icon: IconDefinition;
  iconColorClass: string;
};

function badge(labelKey: string, fallbackLabel: string, icon: IconDefinition, iconColorClass: string): TrustStateBadge {
  return {
    label: resolveTranslatable({ key: labelKey }, translate) ?? fallbackLabel,
    icon,
    iconColorClass,
  };
}

export function trustStateBadge(state: DidTrustState | undefined | null): TrustStateBadge {
  switch (state) {
    case "TRUSTED":
      return badge("permission.labeltruststate.trusted", "Trusted", faCertificate, "text-green-500");
    case "UNTRUSTED":
      return badge("permission.labeltruststate.untrusted", "Untrusted", faCircleExclamation, "text-red-500");
    default:
      return badge("permission.labeltruststate.unresolved", "Unresolved", faCircleQuestion, "text-gray-400 dark:text-gray-500");
  }
}
