"use client";

import { useTrustRegistryData } from "@/hooks/useTrustRegistryData";
import { translate } from "@/i18n/dataview";
import EgfCard from "@/ui/common/egf-card";
import { useNotification } from "@/ui/common/notification-provider";
import { resolveTranslatable } from "@/ui/dataview/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TreeNode } from "@/ui/common/permission-tree";
import ActionFieldButton from "@/ui/common/action-field-button";
import { PermissionType } from "proto-codecs/codec/verana/perm/v1/types";

type StepId = 1 | 2 ;

type Step = {
  id: StepId;
  title: string;
  shortTitle: string;
  description?: string;
};

const steps: Step[] = [
  {
    id: 1,
    title: "Review & Accept Governance Framework",
    description: "Review and accept the Ecosystem Governance Framework (EGF) before continuing",
    shortTitle: "Accept EGF"
  },
  {
    id: 2,
    title: "Confirm & Submit",
    description: "You must run a Validation Process (VP) to obtain a permission for this schema. Start the Validation Process by filling this form.",
    shortTitle: "Confirm"
  },
];

function permissionTypeFromString(type?: string): PermissionType {
  switch (type) {
    case "ISSUER":
      return PermissionType.ISSUER;
    case "VERIFIER":
      return PermissionType.VERIFIER;
    case "ISSUER_GRANTOR":
      return PermissionType.ISSUER_GRANTOR;
    case "VERIFIER_GRANTOR":
      return PermissionType.VERIFIER_GRANTOR;
    case "ECOSYSTEM":
      return PermissionType.ECOSYSTEM;
    case "HOLDER":
      return PermissionType.HOLDER;
    default:
      return PermissionType.UNSPECIFIED;
  }
}

function cn(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

type AddJoinPageProps = {
  trId: string;
  nodeJoin: TreeNode;
  onCancel: () => void;
  onRefresh: (id?: string) => void;
}

export default function AddJoinPage({ trId, nodeJoin, onCancel, onRefresh }: AddJoinPageProps) {
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [enabledContinue, setEnabledContinue] = useState(true);
  const currentStepObj = useMemo(() => {
    return steps.find((s) => s.id === currentStep);
  }, [currentStep]);

  const [acceptEgf, setAcceptEgf] = useState(false);
  const type = permissionTypeFromString(nodeJoin.type);
  const selectedValidator = nodeJoin.parentId?? "0";
 
  const { dataTR, errorTRData } = useTrustRegistryData(trId);
  const router = useRouter();

  const dataStartPermissionVP = {
    type,
    validator_perm_id: selectedValidator,
    // country: "US",
    did: "",
  }
    
  const [errorNotified, setErrorNotified] = useState(false);
  // Notification context for showing error messages
  const { notify } = useNotification();

  // Notify and redirect if there is an error fetching account data
  useEffect(() => {
      // Show a notification if an error occurred
      if (errorTRData && !errorNotified) {
      (async () => {
          await notify(errorTRData, 'error', resolveTranslatable({key: "error.fetch.tr.title"}, translate));
          setErrorNotified(true);
          router.push('/');
      })();
      }
  }, [errorTRData, router, errorNotified]);

  function proceedToStep() {
    if (currentStep === 1) {
      if (!acceptEgf) {
        notify("Please accept the Ecosystem Governance Framework", "error");
        return;
      }
      setCurrentStep(2);
    }
  }

  useEffect(() => {
    enableContinueStep();
    document.getElementById("app-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  function enableContinueStep(){
    if (currentStep === 1) setEnabledContinue(acceptEgf);
    else setEnabledContinue(true);
  }

  return (
    <>
      { currentStepObj ? 
      (
      <section>
        <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-4">{currentStepObj.description}</p>
                      
        {/* Step 1 */}
        {(currentStep === 1 && dataTR) ? (
          <>
          <EgfCard
            ecosystem={dataTR}
            accepted={acceptEgf}
            onAcceptedChange={(v) => {
                                setAcceptEgf(v);
                                setEnabledContinue(v);
                              }}
          />
          <div className={'flex justify-between'}>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              type="button"
            >
              {resolveTranslatable({key: "join.btn.cancel"}, translate)}
            </button>
            <button
              onClick={proceedToStep}
              disabled={!enabledContinue}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-colors",
                enabledContinue
                  ? "bg-primary-600 text-white hover:bg-primary-700"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              )}
              type="button"
            >
              {resolveTranslatable({key: "join.btn.continue"}, translate)}
            </button>
          </div>
        </>
        ) : null }

        {/* Step 2 */}
        {currentStep === 2 ? (
          <ActionFieldButton 
            type='button'
            data={dataStartPermissionVP} 
            field={{name: "joinEcosytem", 
              label: resolveTranslatable({key: "join.btn.join"}, translate)??"",
              value: "MsgStartPermissionVP"}}
            onClose={onCancel}
            onRefresh={onRefresh}
            isActive={true}
          />
        ) : null }

      </section>
      ) : null }

    </>
  );
}