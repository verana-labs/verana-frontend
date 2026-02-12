'use client';

import { useState } from "react";
import { ActionFieldProps, renderActionComponent } from "./data-view-typed";
import clsx from "clsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import IconLabelButton from "./icon-label-button";

type ActionFieldButtonProps = {
  data: object;
  field: ActionFieldProps;
  type?: 'button' | 'extend';
  onClickButton?: () => void;
  onClose?: () => void;
  onRefresh?: () => void;
};

export default function ActionFieldButton({
  data,
  field,
  type,
  onClickButton,
  onClose,
  onRefresh,
}: ActionFieldButtonProps) {
  const [active, setActive] = useState<boolean>(false);

  const toggle = () => {
    const next = !active;
    setActive(next);
    if (next) onClickButton?.();
    else onClose?.();
  };

  return (
    <div>
        {type === 'button' && !active && (
            <IconLabelButton
            label={field.label}
            icon={field.icon}
            className={clsx(
                "btn-action-confirm text-sm", // base
                field.iconColorClass // specific
            )}
            onClick={toggle}
            />
            )
        }
        
        {type !== 'button' && (
            <button
                type="button"
                onClick={toggle}
                className={clsx(
                "w-full px-6 py-4 text-left flex items-center justify-between transition-colors",
                field.isWarning
                    ? "hover:bg-red-50 dark:hover:bg-red-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                )}
            >
                <div className="flex items-center">
                {field.icon && (
                    <div
                    className={clsx(
                        "w-10 h-10 rounded-lg flex items-center justify-center mr-3",
                        field.iconClass
                    )}
                    >
                    <FontAwesomeIcon
                        icon={field.icon}
                        className={field.iconColorClass ?? field.iconClass ?? ""}
                    />
                    </div>
                )}
                <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {field.label}
                    </h4>
                    <p className="text-sm text-neutral-70 dark:text-neutral-70">
                    {field.description}
                    </p>
                </div>
                </div>
                <FontAwesomeIcon icon={active ? faChevronUp : faChevronDown} />
            </button>
            )
        }

        {active
            ? renderActionComponent(field.value, toggle, data, onRefresh)
            : null
        }
    </div>
  );
}