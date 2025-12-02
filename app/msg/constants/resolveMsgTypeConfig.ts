import { resolveTranslatable, Translatable } from "@/ui/dataview/types";
import { MessageType } from "./types";
import { msgTypeConfig } from "./msgTypeConfig";
import { translate } from "@/i18n/dataview";

export type ResolvedMsgTypeInfo = {
  label: string;
  description: string;
  cost: string; // untranslated template (keeps placeholders)
  warning: string;
};

// Ensure no interpolation in cost
function stripValues(t: Translatable): Translatable {
  return typeof t === "string" ? t : { key: t.key, fallback: t.fallback };
}

/**
 * Returns resolved label and description, and the raw cost template (with placeholders like {value}).
 */
export function resolveMsgCopy(type: MessageType): ResolvedMsgTypeInfo {
  const cfg = msgTypeConfig[type];

  const label =
    resolveTranslatable(cfg.label as Translatable, translate) ?? "";

  const description =
    resolveTranslatable(cfg.description as Translatable, translate) ?? "";

  // cost should stay as a template, so we strip possible values before resolving
  const costTemplate = stripValues(cfg.cost as Translatable);
  const cost =
    resolveTranslatable(costTemplate, translate) ?? "";

  const warning =
    resolveTranslatable(cfg.warning, translate) ?? "";

  return { label, description, cost, warning };
}