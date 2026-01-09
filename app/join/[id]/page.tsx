"use client";

import { useCSList } from "@/hooks/useCredentialSchemas";
import { usePermissions } from "@/hooks/usePermissions";
import { useTrustRegistryData } from "@/hooks/useTrustRegistryData";
import { translate } from "@/i18n/dataview";
import CsCard from "@/ui/common/cs-card";
import EcosystemCard from "@/ui/common/ecosystem-card";
import EgfCard from "@/ui/common/egf-card";
import { useNotification } from "@/ui/common/notification-provider";
import RoleCard, { Role } from "@/ui/common/role-card";
import { CsList } from "@/ui/datatable/columnslist/cs";
import { resolveTranslatable } from "@/ui/dataview/types";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { Permission } from '@/ui/dataview/datasections/perm';
import ValidatorCard from "@/ui/common/validator-card";
import { isValidDID } from "@/util/validations";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight, faQrcode } from "@fortawesome/free-solid-svg-icons";
import { useActionPerm } from "@/msg/actions_hooks/actionPerm";
import { PermissionType } from "proto-codecs/codec/verana/perm/v1/types";

function rolesSchema(schema: CsList): Role[] {
  const roles = new Set<Role>();

  // Issuance roles
  if (schema.issuerPermManagementMode === "GRANTOR_VALIDATION") {
    roles.add("ISSUER_GRANTOR");
    roles.add("ISSUER");
  } else {
    // OPEN o ECOSYSTEM
    roles.add("ISSUER");
  }

  // Verification roles
  if (schema.verifierPermManagementMode === "GRANTOR_VALIDATION") {
    roles.add("VERIFIER_GRANTOR");
    roles.add("VERIFIER");
  } else {
    // OPEN o ECOSYSTEM
    roles.add("VERIFIER");
  }

  roles.add("HOLDER");

  return Array.from(roles);
}

// function requiresValidation(schema: CsList, role: Role): boolean {
//   const issuanceRoles: Role[] = ["ISSUER_GRANTOR", "ISSUER", "HOLDER"];
//   const verificationRoles: Role[] = ["VERIFIER_GRANTOR", "VERIFIER"];

//   const isIssuanceRole = issuanceRoles.includes(role);
//   const isVerificationRole = verificationRoles.includes(role);

//   if (isIssuanceRole) {
//     return schema.issuerPermManagementMode !== "OPEN";
//   }

//   if (isVerificationRole) {
//     return schema.verifierPermManagementMode !== "OPEN";
//   }

//   return false;
// }

function validatorRole(schema: CsList, role: Role)  : Role {
  switch (role) {
    case "ISSUER":
      return schema.issuerPermManagementMode === "GRANTOR_VALIDATION" ? "ISSUER_GRANTOR" : "ECOSYSTEM";
    case "HOLDER":
      return "ISSUER";
    case "VERIFIER":
      return schema.verifierPermManagementMode === "GRANTOR_VALIDATION" ? "VERIFIER_GRANTOR" : "ECOSYSTEM";
    case "ISSUER_GRANTOR":
    case "VERIFIER_GRANTOR":
      return "ECOSYSTEM";
    default:
      return role;
  }
}

type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Step = {
  id: StepId;
  title: string;
  shortTitle: string;
  description?: string;
};

const steps: Step[] = [
  {
    id: 1,
    title: "Review Ecosystem Info",
    description: "Verify the ecosystem details before proceeding",
    shortTitle: "Review Info",
  },
  {
    id: 2,
    title: "Select Credential Schema",
    description: "Choose the credential schema you want to participate in",
    shortTitle: "Select Schema"
  },
  {
    id: 3,
    title: "Select Your Role",
    description: "Pick the role you want to have in this ecosystem for the selected schema",
    shortTitle: "Select Role"
  },
  {
    id: 4,
    title: "Review & Accept Governance Framework",
    description: "Review and accept the Ecosystem Governance Framework (EGF) before continuing",
    shortTitle: "Accept EGF"
  },
  {
    id: 5,
    title: "Select Validator",
    description: "Select a validator to process your permission request",
    shortTitle: "Pick Validator"
  },
  {
    id: 6,
    title: "Confirm & Submit",
    description: "Review your selections, provide your Service DID, and submit the request",
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

export default function JoinEcosystemWizard() {
  const params = useParams();
  const trId = params?.id as string;
  
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [enabledContinue, setEnabledContinue] = useState(true);
  const currentStepObj = useMemo(() => {
    return steps.find((s) => s.id === currentStep);
  }, [currentStep]);

  const [acceptEgf, setAcceptEgf] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<CsList | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedValidator, setSelectedValidator] = useState<Permission | null>(null);

  const [serviceDid, setServiceDid] = useState("");
 
  const { dataTR, errorTRData } = useTrustRegistryData(trId);

  const router = useRouter();
  const { csList } = useCSList (trId, true);
 
  const schemaId = selectedSchema?.id;
  const roleVal = (selectedSchema && selectedRole) ? validatorRole(selectedSchema, selectedRole) : undefined ;

  const { permissionsList } = usePermissions(schemaId, roleVal);
  
  const actionPerm = useActionPerm(undefined, 
    () => { setCurrentStep((prev) => prev + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
    });

  // Save handler: called when the form is submitted
  async function onSendActionPerm() {
      // Broadcast MsgCreateTrustRegistry transaction with user input
      const msgType = 'MsgStartPermissionVP';
      const type = permissionTypeFromString(selectedRole?? "");
      const validatorPermId = selectedValidator?.id ?? 0;
      const did= serviceDid;

      await actionPerm({
        msgType,
        creator: "",
        type,
        validatorPermId,
        country: "US",
        did,
      });      
  }

  // useEffect(() => {
  //   console.info("permissionsList", permissionsList);
  // }, [permissionsList]);
  
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

  const percentage = useMemo(() => ((currentStep - 1) / 6) * 100, [currentStep]);
  const progressText = `${Math.round(percentage)}%`;

  function proceedToStep() {
    if (currentStep === 4) {//2
      if (!acceptEgf) {
        notify("Please accept the Ecosystem Governance Framework", "error");
        return;
      }
    } else if (currentStep === 2) {//3
      if (!selectedSchema) {
        notify("Please select a credential schema", "error");
        return;
      }
    } else if (currentStep === 3) {//4
      if (!selectedRole) {
        notify("Please select a role", "error");
        return;
      }
    } else if (currentStep === 5) {
      if (!selectedValidator) {
        notify("Please select a validator", "error");
        return;
      }
    } else if (currentStep === 6) {
      submitPermissionRequest();
      return;
    }

    setCurrentStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    enableContinueStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  function enableContinueStep(){
    if (currentStep === 2) setEnabledContinue(acceptEgf);
    else if (currentStep === 3) setEnabledContinue(selectedSchema != null);
    else if (currentStep === 4) setEnabledContinue(selectedRole != null);
    else if (currentStep === 5) setEnabledContinue(selectedValidator != null);
    else setEnabledContinue(true);
  }

  function backToStep(){
    const backStep = currentStep > 1 ? currentStep - 1 : 1;
    setCurrentStep(backStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitPermissionRequest() {
    if (!serviceDid.trim() || !isValidDID(serviceDid)) {
      notify("Please enter your Service DID", "error");
      return;
    }
    onSendActionPerm();
    // setCurrentStep((prev) => prev + 1);
    // window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      {/* Page header */}
      <section id="page-header" className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{resolveTranslatable({key: "join.title"}, translate)}</h1>
        <p className="mt-2 text-sm text-neutral-70 dark:text-neutral-70">
          {resolveTranslatable({key: "join.desc"}, translate)}
        </p>
      </section>

      {/* Progress */}
      <section id="progress-section" className="mb-8">
        <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{resolveTranslatable({key: "join.progress"}, translate)}</span>
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">{progressText}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-success-500 to-success-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Desktop steps */}
          <div className="hidden sm:block">
            <div className="relative py-4">
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2" />
              <div className="flex justify-between items-center relative z-10">
                {steps.map((step) => {
                  const done = step.id < currentStep;
                  const active = step.id === currentStep;

                  return (
                    <div key={`step-${step.id}`} className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2",
                          done
                            ? "bg-success-500 text-white"
                            : active
                            ? "bg-primary-600 text-white"
                            : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        {done ? <span>✓</span> : step.id}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium text-center",
                          done
                            ? "text-success-600 dark:text-success-600"
                            : active
                            ? "text-gray-700 dark:text-gray-300"
                            : "text-gray-500 dark:text-gray-500"
                        )}
                      >
                        {step.shortTitle}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mobile steps */}
          <div className="sm:hidden">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold text-sm">
                {currentStep}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">of {steps.length}</span>
            </div>
            <p className="text-center text-sm text-neutral-70 dark:text-neutral-70 mt-2">{"stepNames[currentStep - 1]"}</p>
          </div>
        </div>
      </section>

      { currentStepObj ? 
      (
      <section className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{currentStepObj.title}</h2>
            <p className="text-sm text-neutral-70 dark:text-neutral-70 mt-1">{currentStepObj.description}</p>
          </div>
        </div>
                      
        {/* Step 1 */}
        {(currentStep === 1 && dataTR) ? (
          <EcosystemCard
            ecosystem={dataTR}
          />
        ) : null}

        {/* Step 2 */}
        {currentStep === 2 ? (
          <div className="space-y-4 mb-6">
            {csList.map((s) => {
              return (
                <CsCard
                  key={s.id}
                  cs={s}
                  selected={selectedSchema?.id === s.id}
                  onSelect={() => {
                    setSelectedSchema(s);
                    setEnabledContinue(true);
                  }}
                />
              );
            })}
          </div>
        ) : null}

        {/* Step 3 */}
        {(currentStep === 3 && selectedSchema) ? (
        <>
          {rolesSchema(selectedSchema).map((role) => {
            return (
              <RoleCard
                key={role}
                role={role}
                selected={selectedRole === role}
                onSelect={() => {
                  setSelectedRole(role);
                  setEnabledContinue(true);
                }}
              />
            );
          })}
        </>) : null}

        {/* Step 4 */}
        {(currentStep === 4 && dataTR) ? (
          <EgfCard
            ecosystem={dataTR}
            accepted={acceptEgf}
            onAcceptedChange={(v) => {
                                setAcceptEgf(v);
                                setEnabledContinue(v);
                              }}
          />
        ) : null}

        {/* Step 5 */}
        {currentStep === 5 ? (
          <>
            <div className="space-y-4 mb-6">
              {permissionsList.map((v) => {
                return (
                  <ValidatorCard
                    key={`validator-${v.id}`}
                    validator={v}
                    selected={selectedValidator?.id === v.id}
                    onSelect={() => {
                      setSelectedValidator(v);
                      setEnabledContinue(true);
                    }}
                  />
                );
              })}
            </div>

            {/* <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-neutral-70 dark:text-neutral-70">
                Showing {permissionsList.length} of {permissionsList.length} validators
              </span>
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  type="button"
                  disabled
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  type="button"
                  disabled
                >
                  Next
                </button>
              </div>
            </div> */}

          </>
        ) : null}

        {/* Step 6 */}
        {currentStep === 6 ? (
            <div className="space-y-4 mb-6">
              <div className="border border-neutral-20 dark:border-neutral-70 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Selected Validator</h3>

                {selectedValidator ? (
                  <ValidatorCard
                    validator={selectedValidator}
                    selected={true}
                  />

                ) : (
                  <p className="text-sm text-neutral-70 dark:text-neutral-70">No validator selected.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service DID</label>
                <input
                  type="text"
                  value={serviceDid}
                  onChange={(e) => setServiceDid(e.target.value)}
                  placeholder="did:verana:mainnet:..."
                  className="w-full px-4 py-3 border border-neutral-20 dark:border-neutral-70 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-surface text-gray-900 dark:text-white"
                />
                <p className="text-xs text-neutral-70 dark:text-neutral-70 mt-1">The DID of your service that will participate in the ecosystem</p>
              </div>
            </div>
        ) : null}

        <div className={`flex ${currentStep === 1 ? 'justify-end' : 'justify-between'}`}>
          {currentStep !== 1 && (
          <button
            onClick={currentStep === 1 ? undefined : backToStep}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            type="button"
          >
            {resolveTranslatable({key: "join.btn.back"}, translate)}
          </button>
          )}
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
            {resolveTranslatable({key: currentStep === 6 ? "join.btn.join" : "join.btn.continue"}, translate)}
          </button>
        </div>

      </section>
      ) : (
      <section className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-4xl">✓</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Congratulations!</h2>
          <p className="text-base text-neutral-70 dark:text-neutral-70 mb-8">
            Your request is being processed by the Ecosystem. Connect to the validator service to continue with the onboarding process by scanning
            this QR:
          </p>

          <div className="w-64 h-64 mx-auto mb-6 bg-white rounded-xl p-4 shadow-sm border border-neutral-20 dark:border-neutral-70">
            <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon  className="text-8xl text-gray-400" icon={faQrcode} />
            </div>
          </div>

          <button
            onClick={() => console.log("Continue to validator")}
            className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            type="button"
          >
            <FontAwesomeIcon className="mr-2" icon={faArrowRight} />
            Or click this link to continue
          </button>
        </div>
      </section>
      ) 
      }

    </>
  );
}