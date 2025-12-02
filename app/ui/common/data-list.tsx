'use client';

import React, { useState } from 'react';
import { isResolvedActionField, isResolvedStringListField, Section, translateSections, visibleFieldsForMode } from "@/ui/dataview/types";
import IconLabelButton from './icon-label-button';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { msgTypeStyle } from '@/msg/constants/msgTypeConfig';
import clsx from 'clsx';
import { MessageType } from '@/msg/constants/types';
import { resolveMsgCopy } from '@/msg/constants/resolveMsgTypeConfig';
import { renderActionComponent, validTRAction } from './data-view-typed';
import { ModalAction } from './modal-action';

interface DataListProps<T extends object> {
  sectionsI18n: Section<T>[];
  data: T;
  listTitle?: string;
  onRefresh?: () => void;
  onBack?: () => void;
}

export function DataList<T extends object>({
  sectionsI18n,
  data,
  listTitle,
  onRefresh,
  onBack
}: DataListProps<T>) {
  
  const sections = translateSections(sectionsI18n);
  const section = sections[0];
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const showFields = (section.type === "advanced" && section.fields && section.fields.length > 0) ?
                      visibleFieldsForMode(section.fields, "view") 
                      : [];


  return (
    <section id="data-list-section" className="mb-8">
      { showFields && showFields.length > 0 && (
      <div className="data-table-section-div p-6">
        <div className="flex items-center justify-between mb-6">
            <h3 className="data-table-title">{listTitle}</h3>
            <div className="flex space-x-3">
              {showFields.map((field, fieldIndex) => {
                const messageType = data[field.name];
                const messageTypeStyle = msgTypeStyle[messageType as MessageType];
                if (isResolvedActionField(field) && messageType !== undefined){
                  const isActive = activeActionId === String(field.name);
                  return (
                  <>
                  <IconLabelButton key={`action-${fieldIndex}`}
                    label={field.label}
                    icon={messageTypeStyle.icon}
                    className={clsx(
                      "btn-action-confirm text-sm", // base
                      messageTypeStyle.button // specific
                    )}
                    onClick={() => setActiveActionId(isActive ? null : String(field.name))}
                  />
                  <ModalAction
                    onClose={() => setActiveActionId(null)}
                    titleKey={field.label}
                    isActive={isActive}
                  >
                    {renderActionComponent(String(messageType), () => setActiveActionId(null), data, onRefresh?? undefined, onBack?? undefined )}
                  </ModalAction>
                  </>
                  
                )}
                // For fields that don't match the condition, return null
                return null;
              })}
            </div>
        </div>

        <div id={`${section.name}-list`} className="space-y-3">
          {/* Render list fields as a full-width row */}
          {showFields.map((field, fieldIndex) => {
            const value = data[field.name];
            if (isResolvedStringListField(field) && value !== null && Array.isArray(value)) {
              // Return the mapped
              return (value as string[]).map((html, i) => (
                <div
                  key={`div-value-${fieldIndex}-${i}`}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ));
            }
            // For fields that don't match the condition, return null
            return null;
          })}
        </div>

      </div>
      )}
    </section>
  );
}
