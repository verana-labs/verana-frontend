# Verana Frontend Helm Chart

This chart deploys the Verana frontend (Next.js) as a Deployment with a Service, optional ingress, configurable environment variables, and node scheduling controls.

## Features

- Deploys the web app with configurable image repo/tag and replica count.
- Exposes the app via ClusterIP service; optional ingress block if you need it.
- Captures all required env vars from docker-compose/k8s manifests with override support.
- Allows nodeSelector and resource overrides.

## Kubernetes Resources

- Service (ClusterIP by default)
- Deployment
- Optional Ingress (disabled by default)

## Configuration

| Parameter | Description | Default |
| --- | --- | --- |
| `name` | Application name/labels | `verana-frontend` |
| `replicas` | Deployment replicas | `1` |
| `image.tag` | Image tag | `{{ .Chart.Version }}` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `3000` |
| `service.targetPort` | Container port | `3000` |
| `nodeSelector` | Node selector map | `kubernetes.io/hostname: cluster-utc-node-07efe5` |
| `env` | Required env vars (see below) | devnet defaults |
| `extraEnv` | Additional env entries (`[{name, value}]`) | `[]` |
| `resources` | Pod resources | `{}` |
| `ingress.enabled` | Enable ingress | `false` |
> **Note:** The image tag should match the Chart version by default to ensure deployment consistency. It can be overridden for debugging purposes if needed.

### Required environment variables

Defined under `env` with devnet reference values; override per environment:

- `NEXT_PUBLIC_PORT`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_VERANA_CHAIN_ID`
- `NEXT_PUBLIC_VERANA_CHAIN_NAME`
- `NEXT_PUBLIC_VERANA_RPC_ENDPOINT`
- `NEXT_PUBLIC_VERANA_REST_ENDPOINT`
- `NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_DEPOSIT`
- `NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID`
- `NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY`
- `NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA`
- `NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM`
- `NEXT_PUBLIC_VERANA_TOPUP_VS`
- `NEXT_PUBLIC_VERANA_SIGN_DIRECT_MODE`
- `NEXT_PUBLIC_SESSION_LIFETIME_SECONDS`

### Quick examples

Render:

```bash
helm template ./charts
```

Install/upgrade (override image tag and a couple env vars):

```bash
helm upgrade --install verana-frontend ./charts \
  -n vna-testnet-1 \
  --set env.NEXT_PUBLIC_BASE_URL=https://frontend.testnet.verana.network \
  --set env.NEXT_PUBLIC_VERANA_CHAIN_ID=vna-testnet-1
```
