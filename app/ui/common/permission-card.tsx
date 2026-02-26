'use client';

import { PermState, TreeNode } from "./permission-tree";
import { useEffect, useMemo, useState } from "react";
import { Permission, permissionActionLifecycle, permissionActionSlashing, permissionActionValidationProcess, 
  permissionBusinessModels, permissionLifecycle, permissionMetaItems, permissionSlashing, permissionValidationProcess, VpState 
} from "../dataview/datasections/perm";
import PermissionAttribute from "./permission-atrribute";
import { usePermissionHistory } from "@/hooks/usePermissionHistory";
import PermissionTimeline from "./permission-timeline";
import { permStateBadgeClass, roleBadgeClass, shortenDID, vpStateColor } from "@/util/util";
import { ActionFieldProps, renderActionFieldModalAndButton } from "./data-view-typed";
import { translate } from "@/i18n/dataview";
import { resolveTranslatable } from "../dataview/types";
import { usePermission } from "@/hooks/usePermission";

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

  const permissionId = selectedNode.permission?.id as string;
  const {permissionHistoryList} = usePermissionHistory(permissionId);
  
  const {labelVpState, classVpState} = vpStateColor(selectedNode.permission?.vp_state as VpState, selectedNode.permission?.vp_exp as string, selectedNode.permission?.expire_soon ?? false);
  const {labelPermState, classPermState} = permStateBadgeClass(selectedNode.permission?.perm_state as PermState, selectedNode.permission?.expire_soon as boolean);

  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const [idUpdate, setIdUpdate] = useState<string|undefined>(undefined);
  const{ permission } = usePermission(idUpdate);

  useEffect(() => {
    if (permission){
      selectedNode.permission = permission;
      onRefresh?.(permission);
    }
  }, [permission]);

  return (
    <section className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6">
    {selectedNode.permission && (
      <>
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white break-all">{shortenDID(selectedNode.name as string)}</h2>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 justify-end">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleBadgeClass(selectedNode.permission.type)}`}
            >
              {selectedNode.permission.type}
            </span>

            { selectedNode.permission.perm_state ? (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${classPermState}`}
              >
                {labelPermState}
              </span>
            ) : null}

            { selectedNode.permission?.vp_state ? (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classVpState}`}>
                {labelVpState}
              </span>
            ) : null}

          </div>
        </div>

        <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-2">
          {detailBreadcrumb}
        </p>

        <p className="text-sm text-gray-700 dark:text-gray-300 break-all">{csTitle}</p>
      </div>

      <div className="space-y-8">
        {/* Key Metadata */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{resolveTranslatable({key: "permissioncard.meta.title"}, translate)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {permissionMetaItems.map((item) => {
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

        {/* Permission Lifecycle */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{resolveTranslatable({key: "permissioncard.lifecycle.title"}, translate)}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {permissionLifecycle.map((item) => {
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

          <div className="flex flex-wrap gap-3 mt-4">
          {permissionActionLifecycle
            .filter((action) => action.name && allowed.has(action.name))
            .map((action, idx) => 
              renderActionFieldModalAndButton(selectedNode.permission ?? {}, action as ActionFieldProps, idx, activeActionId === String(action.name), () => setActiveActionId(activeActionId === String(action.name) ? null : String(action.name)), ()=> setActiveActionId(null), ()=> setIdUpdate(permissionId))
          )}
          </div>
        </div>

        {/* Validation Process */}
        { selectedNode.permission?.vp_state!=="VALIDATION_STATE_UNSPECIFIED" ? (
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{resolveTranslatable({key: "permissioncard.validationprocess.title"}, translate)}</h3>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${classVpState}`}>
              {labelVpState}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {permissionValidationProcess.map((item) => {
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

          <div className="flex flex-wrap gap-3 mt-4">
          {permissionActionValidationProcess
            .filter((action) => action.name && allowed.has(action.name))
            .map((action, idx) => 
              renderActionFieldModalAndButton(selectedNode.permission ?? {}, action as ActionFieldProps, idx, activeActionId === String(action.name), () => setActiveActionId(activeActionId === String(action.name) ? null : String(action.name)), ()=> setActiveActionId(null), ()=> setIdUpdate(permissionId))
          )}
          </div>
        </div>
        ) : null
        }

        {/* Business Models */}
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

        {/* Slashing */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{resolveTranslatable({key: "permissioncard.slashing.title"}, translate)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {permissionSlashing.map((item) => {
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
          <div className="flex flex-wrap gap-3 mt-4">
          {permissionActionSlashing
            .filter((action) => action.name && allowed.has(action.name))
            .map((action, idx) => 
              renderActionFieldModalAndButton(selectedNode.permission ?? {}, action as ActionFieldProps, idx, activeActionId === String(action.name), () => setActiveActionId(activeActionId === String(action.name) ? null : String(action.name)), ()=> setActiveActionId(null), ()=> setIdUpdate(permissionId))
          )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{resolveTranslatable({key: "permissioncard.timeline.title"}, translate)}</h3>
          <div className="space-y-4">
          {permissionHistoryList.map((history, idx) => {
            return (
              <PermissionTimeline permissionHistory={history} key={`${history.permission_id}-${idx}`}/>
            )}
          )}
          </div>
        </div>

      </div>
      </> 
    )}
    </section>
  );
}