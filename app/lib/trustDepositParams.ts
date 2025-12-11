import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';
import { env } from 'next-runtime-env';

export type TrustDepositParams = {
  didDirectoryTrustDeposit: string | number | null;
  trustRegistryTrustDeposit: string | number | null;
  trustUnitPrice: string | number | null;
  trustDepositReclaimBurnRate: string | number | null;
  credentialSchemaTrustDeposit: string | number | null;
};

export const trustDepositParamsInitialState: TrustDepositParams = {
  didDirectoryTrustDeposit: null,
  trustRegistryTrustDeposit: null,
  trustUnitPrice: null,
  trustDepositReclaimBurnRate: null,
  credentialSchemaTrustDeposit: null,
};

type ParamConfigKey = keyof TrustDepositParams;

type ParamConfig = {
  key: ParamConfigKey;
  responseKey: string;
  envKey: string;
  transform?: (value: unknown) => string | number | null;
};

const configs: ParamConfig[] = [
  {
    key: 'didDirectoryTrustDeposit',
    responseKey: 'did_directory_trust_deposit',
    envKey: 'NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID',
    transform: value => (value == null ? null : Number(value)),
  },
  {
    key: 'trustRegistryTrustDeposit',
    responseKey: 'trust_registry_trust_deposit',
    envKey: 'NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY',
    transform: value => (value == null ? null : Number(value)),
  },
  {
    key: 'trustUnitPrice',
    responseKey: 'trust_unit_price',
    envKey: 'NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY',
    transform: value => (value == null ? null : Number(value)),
  },
  {
    key: 'trustDepositReclaimBurnRate',
    responseKey: 'trust_deposit_reclaim_burn_rate',
    envKey: 'NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_DEPOSIT',
    transform: value => (value == null ? null : Number(value) * 100),
  },
  {
    key: 'credentialSchemaTrustDeposit',
    responseKey: 'credential_schema_trust_deposit',
    envKey: 'NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA',
    transform: value => (value == null ? null : Number(value)),
  },
];

function getEndpointBase(envKey: string) {
  return env(envKey) || process.env[envKey];
}

function extractParam(json: unknown, responseKey: string) {
  if (
    typeof json === 'object' &&
    json !== null &&
    'params' in json &&
    typeof (json as Record<string, unknown>).params === 'object' &&
    (json as { params?: Record<string, unknown> }).params !== null
  ) {
    const params = (json as { params?: Record<string, unknown> }).params;
    return params ? params[responseKey] : undefined;
  }

  return undefined;
}

export type TrustDepositParamsResult = {
  params: TrustDepositParams;
  errorTrustDepositParams: string | null;
};

export async function getTrustDepositParams(): Promise<TrustDepositParamsResult> {
  const params: TrustDepositParams = { ...trustDepositParamsInitialState };
  const errors: string[] = [];

  await Promise.all(
    configs.map(async ({ key, responseKey, envKey, transform }) => {
      const base = getEndpointBase(envKey);
      if (!base) {
        errors.push(`${resolveTranslatable({key: "error.fetch.td.param.missing"}, translate)} ${envKey}`);
        return;
      }

      try {
        const response = await fetch(`${base}/params`);
        if (!response.ok) {
          errors.push(`${resolveTranslatable({key: "error.fetch.td.param.failed"}, translate)} ${responseKey}`);
          return;
        }

        const json = await response.json();
        const value = extractParam(json, responseKey);
        if (value === undefined) {
          errors.push(`${responseKey} ${resolveTranslatable({key: "error.fetch.td.param.notfound"}, translate)}`);
          return;
        }

        params[key] = transform ? transform(value) : (value as string | number | null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${resolveTranslatable({key: "error.fetch.td.param.failed"}, translate)} ${responseKey}: ${message}`);
      }
    }),
  );

  return {
    params,
    errorTrustDepositParams: errors.length ? errors.join(' | ') : null,
  };
}
