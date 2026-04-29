'use client';

import { PermState, RefreshState, TreeNode } from "@/ui/common/permission-tree";
import { useEffect, useMemo, useState } from "react";
import { Permission, PermissionAction, permissionActionLifecycle, permissionActionSlashing, permissionActionValidationProcess,
  permissionBusinessModels, permissionSlashing, VpState
} from "@/ui/dataview/datasections/perm";
import PermissionAttribute from "@/ui/common/permission-atrribute";
import { usePermissionHistory } from "@/hooks/usePermissionHistory";
import PermissionTimeline from "@/ui/common/permission-timeline";
import { countryCodeToFlag, countryNameFromCode, formatDateTime, formatVNAFromUVNA, permStateBadgeClass, roleBadgeClass, shortenDID, vpStateColor } from "@/util/util";
import { ActionFieldProps } from "@/ui/common/data-view-typed";
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "@/ui/dataview/types";
import { usePermission } from "@/hooks/usePermission";
import ActionFieldButtonModal from "./action-field-button-modal";
import { useIndexerEvents } from "@/providers/indexer-events-provider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChildReaching, faCopy, faCrown, faEye, faFileContract, faShieldHalved, faUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import { useDidTrustEnrichment } from "@/hooks/useDidTrustEnrichment";
import { serviceAvatarUrl, serviceIdenticonUrl } from "@/lib/resolverClient";
import TrustBadge from "./trust-badge";

const ROLE_SINGULAR_KEY: Record<string, string> = {
  ECOSYSTEM: "permissioncard.role.singular.ecosystem",
  ISSUER_GRANTOR: "permissioncard.role.singular.issuergrantor",
  VERIFIER_GRANTOR: "permissioncard.role.singular.verifiergrantor",
  ISSUER: "permissioncard.role.singular.issuer",
  VERIFIER: "permissioncard.role.singular.verifier",
  HOLDER: "permissioncard.role.singular.holder",
};

function roleLabelSingular(type: string | undefined): string {
  if (!type) return "";
  const key = ROLE_SINGULAR_KEY[type];
  if (key) return resolveTranslatable({ key }, translate) ?? type;
  return type;
}

type V4Item = {
  label: string;
  attr: keyof Permission;
  mono?: boolean;
  format?: (v: unknown) => string;
  extraActions?: PermissionAction[];
};

const t = (key: string, fallback: string) =>
  resolveTranslatable({ key }, translate) ?? fallback;

const accountActions: PermissionAction[] = [
  { icon: faCopy, label: t("permissioncard.action.copy", "copy"), value: "copy" },
  { icon: faEye, label: t("permissioncard.action.visualizer", "visualizer"), value: "visualizer" },
  { icon: faUpRightFromSquare, label: t("permissioncard.action.explorer", "explorer"), value: "explorer" },
];

const idActions: PermissionAction[] = [
  { icon: faCopy, label: t("permissioncard.action.copy", "copy"), value: "copy" },
  { icon: faEye, label: t("permissioncard.action.visualizer", "visualizer"), value: "visualizer" },
];

const didActions: PermissionAction[] = [
  { icon: faCopy, label: t("permissioncard.action.copy", "copy"), value: "copy" },
  { icon: faEye, label: t("permissioncard.action.visualizer", "visualizer"), value: "visualizer" },
  { icon: faUpRightFromSquare, label: t("permissioncard.action.service", "service"), value: "service" },
];

const v4MetaItems: V4Item[] = [
  { label: "DID", attr: "did", mono: true, extraActions: didActions },
  { label: "Grantee", attr: "grantee", mono: true, extraActions: accountActions },
  { label: "ID", attr: "id", mono: true, extraActions: idActions },
  { label: t("permissioncard.meta.deposit", "Deposit"), attr: "deposit", mono: true, format: (v) => formatVNAFromUVNA(String(v)) },
  { label: t("permissioncard.meta.effectivefrom", "Effective From"), attr: "effective_from", format: (v) => formatDateTime(v as string) },
  { label: t("permissioncard.meta.effectiveuntil", "Effective Until"), attr: "effective_until", format: (v) => formatDateTime(v as string) },
  { label: t("permissioncard.meta.country", "Country"), attr: "country", format: (v) => countryNameFromCode(v as string) },
  { label: t("permissioncard.meta.issued", "Issued Credentials"), attr: "issued" },
  { label: t("permissioncard.meta.verified", "Verified Credentials"), attr: "verified" },
];

const v4LifecycleItems: V4Item[] = [
  { label: t("permissioncard.lifecycle.created", "Created"), attr: "created", format: (v) => formatDateTime(v as string) },
  { label: t("permissioncard.lifecycle.createdby", "Created By"), attr: "created_by", mono: true, extraActions: accountActions },
  { label: t("permissioncard.lifecycle.modified", "Modified"), attr: "modified", format: (v) => formatDateTime(v as string) },
  { label: t("permissioncard.lifecycle.modifiedby", "Modified By"), attr: "modified_by", mono: true, extraActions: accountActions },
  { label: t("permissioncard.lifecycle.extended", "Extended"), attr: "extended", format: (v) => formatDateTime(v as string) },
  { label: t("permissioncard.lifecycle.extendedby", "Extended By"), attr: "extended_by", mono: true, extraActions: accountActions },
];

const v4VpItems: V4Item[] = [
  { label: t("permissioncard.validationprocess.vpexp", "VP Expiration"), attr: "vp_exp", format: (v) => formatDateTime(v as string) },
  { label: t("permissioncard.validationprocess.vplaststatechange", "VP Last State Change"), attr: "vp_last_state_change", format: (v) => formatDateTime(v as string) },
  { label: t("permissioncard.validationprocess.vpvalidatordeposit", "VP Validator Deposit"), attr: "vp_validator_deposit", mono: true, format: (v) => formatVNAFromUVNA(String(v)) },
  { label: t("permissioncard.validationprocess.vpcurrentfees", "VP Current Fees"), attr: "vp_current_fees", mono: true, format: (v) => formatVNAFromUVNA(String(v)) },
  { label: t("permissioncard.validationprocess.vpcurrentdeposit", "VP Current Deposit"), attr: "vp_current_deposit", mono: true, format: (v) => formatVNAFromUVNA(String(v)) },
  { label: t("permissioncard.validationprocess.vpsummarydigestsri", "VP Summary Digest"), attr: "vp_summary_digest_sri", mono: true },
];

type PermissionCardProps = {
  selectedNode: TreeNode;
  path: TreeNode[];
  csTitle: string;
  onRefresh?: (node: Permission) => void;
};

export default function PermissionCard({
  selectedNode,
  path,
  csTitle,
  onRefresh
}: PermissionCardProps) {

  const detailBreadcrumb = useMemo(() => {
    if (!path.length) return "";
    return path.filter((p) => !p.group).slice(0, -1).map((p) => p.name).join(" → ");
  }, [path]);

  const did = selectedNode.permission?.did as string | undefined;
  const { data: enrichment } = useDidTrustEnrichment(did);
  const serviceLabel = enrichment?.serviceName ?? (did ? shortenDID(did) : "");
  const orgLabel = enrichment?.organizationName ?? (did ? shortenDID(did) : "");
  const headerTitle = resolveTranslatable(
    {
      key: "permissioncard.header.title",
      values: {
        role: roleLabelSingular(selectedNode.permission?.type),
        schema: csTitle,
      },
    },
    translate,
  ) ?? `${roleLabelSingular(selectedNode.permission?.type)} role for schema ${csTitle}`;

  const toMetaValue = (v: unknown): string => {
    if (v == null) return "—";
    if (Array.isArray(v)) return v.join(", ");
    return String(v);
  };

  const granteeActions =
    selectedNode.isGrantee
      ? (selectedNode.permission?.grantee_available_actions ?? [])
      : [];
  const validatorActions =
    selectedNode.isValidator
      ? (selectedNode.permission?.validator_available_actions ?? [])
      : [];
  const allowed = new Set<string>([...granteeActions, ...validatorActions]);

  const slashingActionNames = new Set(permissionActionSlashing.map((a) => a.name).filter(Boolean) as string[]);
  const lifecycleActionsWithoutSlashing = permissionActionLifecycle.filter((a) => !a.name || !slashingActionNames.has(a.name));

  const permissionId = selectedNode.permission?.id as string;
  const {permissionHistoryList} = usePermissionHistory(permissionId);
  
  const {labelVpState, classVpState} = vpStateColor(selectedNode.permission?.vp_state as VpState, selectedNode.permission?.vp_exp as string, selectedNode.permission?.expire_soon ?? false);
  const {labelPermState, classPermState} = permStateBadgeClass(selectedNode.permission?.perm_state as PermState, selectedNode.permission?.expire_soon as boolean);

  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const [idUpdate, setIdUpdate] = useState<string|undefined>(undefined);
  const{ permission } = usePermission(idUpdate);
  const [refreshState, setRefreshState] = useState<RefreshState>({});
  const { latestProcessedHeight } = useIndexerEvents();
  
  useEffect(() => {
    if (refreshState.txHeight == null) return;
    console.info("PermissionCard", {txHeight: refreshState.txHeight, latestProcessedHeight, 'ss.mmm': new Date().toISOString().slice(17, 23)});
    if (latestProcessedHeight < refreshState.txHeight) return;
    setIdUpdate(permissionId);
    setRefreshState({});
  }, [refreshState.txHeight, latestProcessedHeight]);

  useEffect(() => {
    if (!permission || !selectedNode.permission) return;
    const permissionsAreEqual = selectedNode.permission.modified == permission.modified;
    if (!permissionsAreEqual) {
      selectedNode.permission = permission;
      onRefresh?.(permission);
      return;
    }
  }, [permission]);

  return (
    <section className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6">
    {selectedNode.permission && (
      <>
      <div className="pb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white break-words">
                {headerTitle}
              </h2>
              <FontAwesomeIcon icon={faCrown} className="text-yellow-500" aria-hidden="true" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleBadgeClass(selectedNode.permission.type)}`}
            >
              {selectedNode.permission.type}
            </span>

            { classPermState && labelPermState ? (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${classPermState}`}
              >
                {labelPermState}
              </span>
            ) : null}
          </div>
        </div>

        {detailBreadcrumb ? (
          <p className="text-sm text-neutral-70 dark:text-neutral-70 mt-2">
            {detailBreadcrumb}
          </p>
        ) : null}

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {resolveTranslatable({ key: "permissioncard.grantedservice.title" }, translate) ?? "Granted Service"}
          </h3>
          <div className="flex items-start space-x-4">
            <img
              src={serviceIdenticonUrl(did)}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white break-words">
                  {serviceLabel}
                </h4>
                <TrustBadge state={enrichment?.trustStatus} size="xl" />
              </div>
              {enrichment?.serviceDescription ? (
                <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-3 break-words">
                  {enrichment.serviceDescription}
                </p>
              ) : null}
              {(enrichment?.serviceMinAge || enrichment?.serviceTermsUrl || enrichment?.servicePrivacyUrl) ? (
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {enrichment.serviceMinAge ? (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <FontAwesomeIcon icon={faChildReaching} className="text-neutral-70 text-sm" aria-hidden="true" />
                      <span className="text-gray-900 dark:text-white font-medium text-sm">
                        {enrichment.serviceMinAge}
                      </span>
                    </div>
                  ) : null}
                  {enrichment.serviceTermsUrl ? (
                    <a
                      href={enrichment.serviceTermsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1"
                    >
                      <FontAwesomeIcon icon={faFileContract} className="text-xs" aria-hidden="true" />
                      <span>{resolveTranslatable({ key: "permissioncard.grantedservice.terms" }, translate) ?? "Terms & Conditions"}</span>
                    </a>
                  ) : null}
                  {enrichment.servicePrivacyUrl ? (
                    <a
                      href={enrichment.servicePrivacyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center space-x-1"
                    >
                      <FontAwesomeIcon icon={faShieldHalved} className="text-xs" aria-hidden="true" />
                      <span>{resolveTranslatable({ key: "permissioncard.grantedservice.privacy" }, translate) ?? "Privacy Policy"}</span>
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {resolveTranslatable({ key: "permissioncard.serviceprovider.title" }, translate) ?? "Service Provider"}
          </h3>
          <div className="flex items-start space-x-3">
            <img
              src={serviceAvatarUrl(did)}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-base font-medium text-gray-900 dark:text-white break-words">
                  {orgLabel || "—"}
                </h4>
                {!enrichment?.organizationName && did ? (
                  <span className="sr-only">Unverified organization</span>
                ) : null}
                {enrichment?.countryCode ? (
                  <span className="text-lg flex-shrink-0" aria-hidden="true">
                    {countryCodeToFlag(enrichment.countryCode)}
                  </span>
                ) : null}
                <TrustBadge state={enrichment?.trustStatus} size="lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{resolveTranslatable({key: "permissioncard.meta.title"}, translate)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {v4MetaItems.map((item) => {
            const raw = selectedNode.permission?.[item.attr];
            if (raw == null || raw === "") return null;
            return (
              <PermissionAttribute
                key={item.attr}
                label={item.label}
                value={item.format ? item.format(toMetaValue(raw)) : toMetaValue(raw)}
                mono={item.mono}
                actions={item.extraActions}
              />
            );
          })}
          </div>
        </div>

        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{resolveTranslatable({key: "permissioncard.lifecycle.title"}, translate)}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {v4LifecycleItems.map((item, idx, arr) => {
            const raw = selectedNode.permission?.[item.attr];
            if (raw == null || raw === "") {
              const isSecondInRow = idx % 2 === 1;
              const prevRaw = idx > 0 ? selectedNode.permission?.[arr[idx - 1].attr] : null;
              const prevRendered = prevRaw != null && prevRaw !== "";
              return isSecondInRow && prevRendered ? <div key={item.attr} /> : null;
            }
            return (
              <PermissionAttribute
                key={item.attr}
                label={item.label}
                value={item.format ? item.format(toMetaValue(raw)) : toMetaValue(raw)}
                mono={item.mono}
                actions={item.extraActions}
              />
            );
          })}
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
          {lifecycleActionsWithoutSlashing
            .filter((action) => action.name && allowed.has(action.name))
            .map((action, idx) =>
              <ActionFieldButtonModal isActive={activeActionId === String(action.name)} data={selectedNode.permission ?? {}} field={action as ActionFieldProps} key={`${action.name}-${idx}`}
                onRefresh={(id?: string, txHeight?: number) => setRefreshState({joinNode: undefined, id, txHeight})} onClickButton={() => setActiveActionId(activeActionId === String(action.name) ? null : String(action.name))} onClose={()=> setActiveActionId(null)}/>
          )}
          </div>
        </div>

        { selectedNode.permission?.vp_state!=="VALIDATION_STATE_UNSPECIFIED" ? (
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{resolveTranslatable({key: "permissioncard.validationprocess.title"}, translate)}</h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${classVpState}`}>
              {labelVpState}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {v4VpItems.map((item) => {
            const raw = selectedNode.permission?.[item.attr];
            if (raw == null || raw === "") return null;
            return (
              <PermissionAttribute
                key={item.attr}
                label={item.label}
                value={item.format ? item.format(toMetaValue(raw)) : toMetaValue(raw)}
                mono={item.mono}
                actions={item.extraActions}
              />
            );
          })}
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
          {permissionActionValidationProcess
            .filter((action) => action.name && allowed.has(action.name))
            .map((action, idx) => 
              <ActionFieldButtonModal isActive={activeActionId === String(action.name)} data={selectedNode.permission ?? {}} field={action as ActionFieldProps} key={`${action.name}-${idx}`} 
                onRefresh={(id?: string, txHeight?: number) => setRefreshState({joinNode: undefined, id, txHeight})} onClickButton={() => setActiveActionId(activeActionId === String(action.name) ? null : String(action.name))} onClose={()=> setActiveActionId(null)}/>
          )}
          </div>
        </div>
        ) : null
        }

        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{resolveTranslatable({key: "permissioncard.businessmodels.title"}, translate)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {permissionBusinessModels.map((item) => {
            const raw = selectedNode.permission?.[item.attr];
            if (raw == null) return null;

            return (
              <PermissionAttribute
                key={item.attr}
                label={item.label}
                value={item.format? item.format(toMetaValue(raw)) as string : toMetaValue(raw)}
                mono={item.mono}
                actions={item.extraActions}
              />
            )}
          )}
          </div>
        </div>

        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {resolveTranslatable({ key: "permissioncard.slashing.title" }, translate) ?? "Slashing"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {permissionSlashing.map((item) => {
            const raw = selectedNode.permission?.[item.attr] ?? "0";
            return (
              <PermissionAttribute
                key={item.attr}
                label={item.label}
                value={item.format ? item.format(toMetaValue(raw)) as string : toMetaValue(raw)}
                mono={item.mono}
                actions={item.extraActions}
              />
            );
          })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
          {permissionActionSlashing
            .filter((action) => action.name && allowed.has(action.name))
            .map((action, idx) =>
              <ActionFieldButtonModal isActive={activeActionId === String(action.name)} data={selectedNode.permission ?? {}} field={action as ActionFieldProps} key={`${action.name}-${idx}`}
                onRefresh={(id?: string, txHeight?: number) => setRefreshState({joinNode: undefined, id, txHeight})} onClickButton={() => setActiveActionId(activeActionId === String(action.name) ? null : String(action.name))} onClose={()=> setActiveActionId(null)}/>
          )}
          </div>
        </div>

        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{resolveTranslatable({key: "permissioncard.timeline.title"}, translate)}</h3>
          {permissionHistoryList.length > 0 ? (
            <div className="space-y-4">
            {permissionHistoryList.map((history, idx) => (
              <PermissionTimeline permissionHistory={history} key={`${history.entity_id}-${history.block_height}-${idx}`}/>
            ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-70 dark:text-neutral-70">
              {resolveTranslatable({key: "permissioncard.timeline.empty"}, translate) ?? "No activity yet."}
            </p>
          )}
        </div>

      </div>
      </> 
    )}
    </section>
  );
}