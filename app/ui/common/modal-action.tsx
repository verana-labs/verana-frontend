import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { resolveTranslatable } from "../dataview/types";
import { translate } from "@/i18n/dataview";

interface ModalActionProps {
  titleKey: string;       
  onClose: () => void;
  children: React.ReactNode;
  isActive: boolean;
  classModal?: string;
}

export const ModalAction: React.FC<ModalActionProps> = ({
  titleKey,
  onClose,
  children,
  isActive,
  classModal
}) => {
  if (!isActive) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className={classModal ?? "relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-white dark:bg-surface"}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{resolveTranslatable({ key: titleKey }, translate)}</h3>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-neutral-70 hover:text-gray-500 dark:hover:text-gray-300"
                    aria-label="Close"
                >
                    <FontAwesomeIcon icon={faXmark} />
                </button>
            </div>
            {children}
        </div>
    </div>
  );
};