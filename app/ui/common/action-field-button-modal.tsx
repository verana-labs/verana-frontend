'use client';

import { useEffect, useState } from "react";
import { ActionFieldProps, renderActionComponent } from "@/ui/common/data-view-typed";
import clsx from "clsx";
import IconLabelButton from "@/ui/common/icon-label-button";
import { ModalAction } from "@/ui/common/modal-action";

type ActionFieldButtonModalProps = {
  data: object;
  field: ActionFieldProps;
  onClickButton?: () => void;
  onClose: () => void;
  onRefresh?: () => void;
  isActive: boolean
};

export default function ActionFieldButtonModal({
  data,
  field,
  onClickButton,
  onClose,
  onRefresh,
  isActive
  } : ActionFieldButtonModalProps ) {
    const [modalHidden, setModalHidden] = useState(true);
    // Reset internal state when the modal is closed / deactivated
    useEffect(() => {
      if (!isActive) setModalHidden(true);
    }, [isActive]);

    return (
      <section>
        <IconLabelButton
          label={field.label}
          icon={field.icon}
          className={clsx(
            "btn-action-confirm text-sm", // base
            field.iconColorClass // specific
          )}
          onClick={onClickButton}
        />

        {field.value ? (
          <ModalAction
            onClose={onClose}
            titleKey={field.label}
            isActive={isActive}
            modalHidden={modalHidden}
          >
            {renderActionComponent(
              field.value,
              onClose,
              data,
              onRefresh,
              undefined,
              () => setModalHidden(false)
            )}
          </ModalAction>
        ) : null}
      </section>
    );
  }
