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
| `service.type` | Service type | `ClusterIP` |
| `service.port` | Service port | `3000` |
| `service.targetPort` | Container port | `3000` |
| `nodeSelector` | Node selector map | `kubernetes.io/hostname: cluster-utc-node-07efe5` |
| `env` | Env vars (see below); the network ones have no default | required |
| `extraEnv` | Additional env entries (`[{name, value}]`) | `[]` |
| `resources` | Pod resources | `{}` |
| `ingress.enabled` | Enable ingress | `false` |
> **Note:** The image tag should match the Chart version by default to ensure deployment consistency. It can be overridden for debugging purposes if needed.

### Environment variables

Defined under `env`. The network values have no default and rendering fails when one is missing, so every deploy passes `values-devnet.yaml`, `values-testnet.yaml` or its own file:

- `NEXT_PUBLIC_PORT`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_VERANA_CHAIN_ID`
- `NEXT_PUBLIC_VERANA_CHAIN_NAME`
- `NEXT_PUBLIC_VERANA_RPC_ENDPOINT`
- `NEXT_PUBLIC_VERANA_REST_ENDPOINT`
- `NEXT_PUBLIC_VERANA_INDEXER_BASE_URL`
- `NEXT_PUBLIC_VERANA_TOPUP_VS`
- `NEXT_PUBLIC_VERANA_SIGN_DIRECT_MODE`
- `NEXT_PUBLIC_SESSION_LIFETIME_SECONDS`
- `NEXT_PUBLIC_LOW_BALANCE_WARN_UVNA`

### Quick examples

Render:

```bash
helm template ./charts -f ./charts/values-devnet.yaml
```

Install/upgrade on devnet (override the image tag if needed):

```bash
helm upgrade --install verana-frontend ./charts \
  -n vna-devnet-1 \
  -f ./charts/values-devnet.yaml \
  --set image.tag=v0.16.0
```
