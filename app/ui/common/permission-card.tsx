'use client';

import { PermState, TreeNode } from "./permission-tree";
import { useMemo } from "react";
import { permissionActionLifecycle, permissionActionSlashing, permissionActionTasks, permissionActionValidationProcess, permissionBusinessModels, permissionLifecycle, permissionMetaItems, permissionSlashing, permissionValidationProcess, VpState } from "../dataview/datasections/perm";
import PermissionAttribute from "./permission-atrribute";
import IconLabelButton from "./icon-label-button";
import clsx from "clsx";
import { usePermissionHistory } from "@/hooks/usePermissionHistory";
import PermissionTimeline from "./permission-timeline";
import { permStateBadgeClass, roleBadgeClass, vpStateColor } from "@/util/util";


type PermissionCardProps = {
  type: "participants" | "tasks";
  selectedNode: TreeNode;
  path: TreeNode[];
  csTitle: string;
};

export default function PermissionCard({
  type,
  selectedNode,
  path,
  csTitle
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

  const granteeActions = selectedNode.permission?.grantee_available_actions ?? [];
  const validatorActions = selectedNode.permission?.validator_available_actions ?? [];
  const allowed = new Set<string>([...granteeActions, ...validatorActions]);

  const permissionId = selectedNode.permission?.id as string;
  const {permissionHistoryList} = usePermissionHistory(permissionId);
  
  const {labelVpState, classVpState} = vpStateColor(selectedNode.permission?.vp_state as VpState, selectedNode.permission?.vp_exp as string);

  return (
    <section className="bg-white dark:bg-surface border border-neutral-20 dark:border-neutral-70 rounded-xl p-6">
    {selectedNode.permission && (
      <>
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedNode.name}</h2>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleBadgeClass(selectedNode.permission.type)}`}
            >
              {selectedNode.permission.type}
            </span>

            { type==="participants" && selectedNode.permission.perm_state ? (
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${permStateBadgeClass(
                  selectedNode.permission.perm_state as PermState,false)}`}
              >
                {selectedNode.permission.perm_state}
              </span>
            ) : null}

            { type==="tasks" && selectedNode.permission?.vp_state ? (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${classVpState}`}>
                {labelVpState}
              </span>
            ) : null}

          </div>
        </div>

        <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-2">
          {detailBreadcrumb}
        </p>

        <p className="text-sm text-gray-700 dark:text-gray-300">{csTitle}</p>
      </div>

      <div className="space-y-8">
        {/* Key Metadata */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Metadata</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Permission Lifecycle</h3>

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
            .map((action, idx) => {
              return (
              <section key={`action-${String(action.name)}-${idx}`}>
              <IconLabelButton 
                label={action.label}
                icon={action.icon}
                className={clsx(
                  "btn-action-confirm text-sm", // base
                  action.buttonClass // specific
                )}
                onClick={action.onClick}
              />
              {/* <ModalAction
                onClose={() => setActiveActionId(null)}
                titleKey={field.label}
                isActive={isActive}
              >
                {renderActionComponent(String(messageType), () => setActiveActionId(null), data, onRefresh?? undefined, onBack?? undefined )}
              </ModalAction> */}
              </section>
            )}
          )}
          </div>
        </div>

        {type === "participants" ? (
        <>
        {/* Validation Process */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Validation Process</h3>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
              VALIDATED
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
            .map((action, idx) => {
              return (
              <section key={`action-${String(action.name)}-${idx}`}>
              <IconLabelButton 
                label={action.label}
                icon={action.icon}
                className={clsx(
                  "btn-action-confirm text-sm", // base
                  action.buttonClass // specific
                )}
                onClick={action.onClick}
              />
              {/* <ModalAction
                onClose={() => setActiveActionId(null)}
                titleKey={field.label}
                isActive={isActive}
              >
                {renderActionComponent(String(messageType), () => setActiveActionId(null), data, onRefresh?? undefined, onBack?? undefined )}
              </ModalAction> */}
              </section>
            )}
          )}
          </div>
        </div>

        {/* Business Models */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Models</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Slashing</h3>
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
            .map((action, idx) => {
              return (
              <section key={`action-${String(action.name)}-${idx}`}>
              <IconLabelButton 
                label={action.label}
                icon={action.icon}
                className={clsx(
                  "btn-action-confirm text-sm", // base
                  action.buttonClass // specific
                )}
                onClick={action.onClick}
              />
              {/* <ModalAction
                onClose={() => setActiveActionId(null)}
                titleKey={field.label}
                isActive={isActive}
              >
                {renderActionComponent(String(messageType), () => setActiveActionId(null), data, onRefresh?? undefined, onBack?? undefined )}
              </ModalAction> */}
              </section>
            )}
          )}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Timeline</h3>
          <div className="space-y-4">
          {permissionHistoryList.map((history, idx) => {
            return (
              <PermissionTimeline permissionHistory={history} key={`${history.permission_id}-${idx}`}/>
            )}
          )}
          </div>
        </div>
        </>
        ):(
        <>
        {/* Actions */}
        <div className="border-t border-neutral-20 dark:border-neutral-70 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actions</h3>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
          {permissionActionTasks
            // .filter((action) => action.name && allowed.has(action.name))
            .map((action, idx) => {
              return (
              <section key={`action-${String(action.name)}-${idx}`}>
              <IconLabelButton 
                label={action.label}
                icon={action.icon}
                className={clsx(
                  "btn-action-confirm text-sm", // base
                  action.buttonClass // specific
                )}
                onClick={action.onClick}
              />
              {/* <ModalAction
                onClose={() => setActiveActionId(null)}
                titleKey={field.label}
                isActive={isActive}
              >
                {renderActionComponent(String(messageType), () => setActiveActionId(null), data, onRefresh?? undefined, onBack?? undefined )}
              </ModalAction> */}
              </section>
            )}
          )}
          </div>
        </div>
        </>
        )}


      </div>
      </> 
    )}
    </section>
  );
}