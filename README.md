<div align="center">
  <img src="https://verana.io/logo.svg" alt="Verana" height="88" />

  <h2>Verana Frontend</h2>

  <p>Verana dashboard for managing and joining digital trust ecosystems.</p>

  <a href="https://nodejs.org/en"><img alt="Node" src="https://img.shields.io/badge/Node-%3E%3D22-339933?logo=node.js&logoColor=white&style=flat-square"></a>
  <a href="https://nextjs.org/"><img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white&style=flat-square"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square"></a>
  <a href="https://tailwindcss.com/"><img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square"></a>
  <a href="#docker"><img alt="Docker" src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white&style=flat-square"></a>
  <a href="#helm"><img alt="Helm" src="https://img.shields.io/badge/Helm-chart-0F1689?logo=helm&logoColor=white&style=flat-square"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-Apache--2.0-9D2A6D?style=flat-square"></a>
  <a href="https://github.com/verana-labs/verana-frontend/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/verana-labs/verana-frontend/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://discord.gg/edjaFn252q"><img alt="Discord" src="https://img.shields.io/badge/Discord-join-5865F2?logo=discord&logoColor=white&style=flat-square"></a>

  <br/><br/>

  <a href="https://app.testnet.verana.network/dashboard"><b>Try the live demo →</b></a>
</div>

<div align="center">
  <img src="public/screenshots/dashboard.png" alt="Verana Frontend dashboard" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
</div>

---

### What is this?

Verana is an open initiative building a decentralized trust layer for the internet: DIDs, verifiable credentials, and public permissionless trust registries. The Verana network is a Cosmos SDK Layer 1 appchain that acts as a Verifiable Public Registry, a registry of trust registries. Learn more at [docs.verana.io](https://docs.verana.io/).

This repo is the web dashboard where participants connect a wallet and act on the network: create trust registries, define credential schemas, manage issuer and verifier permissions, join ecosystems, and track validation processes. Looking for the read-only explorer instead? See [verana-visualizer](https://github.com/verana-labs/verana-visualizer) (live at [vis.testnet.verana.network](https://vis.testnet.verana.network)).

---

### Table of contents

- [Architecture](#architecture)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Docker](#docker)
- [Kubernetes](#kubernetes)
- [Helm](#helm)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License and community](#license-and-community)

---

### Architecture

```mermaid
flowchart TD
    user["User<br/>(browser)"]
    user --> fe["verana-frontend<br/>Next.js"]
    fe --> wallet["Cosmos-Kit<br/>wallet"]
    fe --> rest["REST API<br/>api.testnet.verana.network"]
    fe --> idx["Indexer<br/>idx.testnet.verana.network"]
    fe --> resolver["DID Resolver<br/>resolver.testnet.verana.network"]
    wallet --> rpc["Verana RPC<br/>rpc.testnet.verana.network"]
    rest --> chain[("Verana Chain<br/>Cosmos SDK appchain")]
    idx --> chain
    rpc --> chain
```

Queries go through the REST API (high-level reads) and the indexer (permissions, ecosystem state, websocket events). Writes go through Cosmos-Kit, which signs and broadcasts to the chain's RPC. DID resolution goes through the universal resolver.

---

### Features

- Wallet connect via Cosmos-Kit (Keplr, Leap, WalletConnect)
- Browse trust registries, credential schemas, and ecosystems
- Permission tree per ecosystem with active, inactive, repaid, slashed, and future states
- Create trust registries and credential schemas
- Issue, grant, and revoke permissions for issuers, verifiers, grantors, and holders
- Join ecosystems through validation processes
- Track pending tasks for processes you participate in
- DID directory backed by the universal resolver
- Trust deposit and topup flows
- Live updates via the indexer websocket
- Light and dark theme, responsive layout, basic i18n surface

<div align="center">
  <img src="public/screenshots/join-ecosystem.gif" alt="Connecting a wallet on Verana Frontend" style="max-width: 100%; border-radius: 8px;" />
</div>

A few of the main screens:

<table>
<tr>
<td align="center"><img src="public/screenshots/trust-registry.png" alt="Trust registry detail" width="420"/><br/><sub>Trust registry detail</sub></td>
<td align="center"><img src="public/screenshots/credential-schema.png" alt="Credential schema" width="420"/><br/><sub>Credential schema</sub></td>
</tr>
<tr>
<td align="center" colspan="2"><img src="public/screenshots/permission-tree.png" alt="Permission tree" width="420"/><br/><sub>Permission tree</sub></td>
</tr>
</table>

---

### Tech stack

- Next.js + React
- TypeScript
- Cosmos ecosystem integrations
- NextAuth authentication

---

### Quick start

Prerequisites:

- Node.js 22+
- Corepack enabled (ships with Node)

```bash
git clone https://github.com/verana-labs/verana-frontend.git
cd verana-frontend
corepack enable
pnpm install
pnpm dev
```

Open http://localhost:3000

The repo ships an `.env` with testnet defaults. To point at a different chain or environment, override the relevant `NEXT_PUBLIC_VERANA_*` variables in `.env.local`.

---

### Configuration

Public runtime variables. Source of truth is `.env` at the repo root.

**Chain identity**

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_VERANA_CHAIN_ID` | Cosmos chain ID | `vna-testnet-1` |
| `NEXT_PUBLIC_VERANA_CHAIN_NAME` | Display name | `VeranaTestnet1` |

**RPC and REST endpoints**

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_VERANA_RPC_ENDPOINT` | Tendermint RPC | `https://rpc.testnet.verana.network` |
| `NEXT_PUBLIC_VERANA_REST_ENDPOINT` | Verana REST API | `https://api.testnet.verana.network` |
| `NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_REGISTRY` | Trust registry module | `https://idx.testnet.verana.network/verana/tr/v1` |
| `NEXT_PUBLIC_VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA` | Credential schema module | `https://idx.testnet.verana.network/verana/cs/v1` |
| `NEXT_PUBLIC_VERANA_REST_ENDPOINT_DID` | DID module | `https://idx.testnet.verana.network/verana/dd/v1` |
| `NEXT_PUBLIC_VERANA_REST_ENDPOINT_PERM` | Permission module | `https://idx.testnet.verana.network/verana/perm/v1` |
| `NEXT_PUBLIC_VERANA_REST_ENDPOINT_TRUST_DEPOSIT` | Trust deposit module | `https://idx.testnet.verana.network/verana/td/v1` |
| `NEXT_PUBLIC_VERANA_REST_ENDPOINT_INDEXER` | Indexer high-level | `https://idx.testnet.verana.network/verana/indexer/v1` |
| `NEXT_PUBLIC_VERANA_REST_ENDPOINT_METRICS` | Metrics | `https://idx.testnet.verana.network/verana/metrics/v1` |
| `NEXT_PUBLIC_VERANA_REST_ENDPOINT_RESOLVER` | DID resolver | `https://resolver.testnet.verana.network/v1` |
| `NEXT_PUBLIC_VERANA_WEBSOCKET` | Indexer events | `wss://idx.testnet.verana.network/verana/indexer/v1/events` |

**Wallet provider (WalletConnect and Cosmos-Kit)**

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_PROJECT_ID` | WalletConnect project ID | `e09f8de2a0b30d2e2ee9d061afb2667b` |
| `NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_RELAY_URL` | WalletConnect relay | `wss://relay.walletconnect.org` |
| `NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_NAME` | App name shown in wallet | `Verana` |
| `NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_DESCRIPTION` | App description | `Verana dashboard for managing and joining digital trust Ecosystems` |
| `NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_URL` | App URL | `https://verana.io` |
| `NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_ICONS` | App icons | `https://verana.io/logo.svg` |

**Runtime tuning**

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_VERANA_SIGN_DIRECT_MODE` | Force Direct sign mode (false leaves Amino fallback) | `false` |
| `NEXT_PUBLIC_SESSION_LIFETIME_SECONDS` | Auth session lifetime | `86400` |
| `NEXT_PUBLIC_LOW_BALANCE_WARN_UVNA` | Low balance warning threshold in uvna | `1000000` |

**External links**

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_VERANA_EXPLORER_URL` | Block explorer | `https://explorer.testnet.verana.network/Verana%20Testnet` |
| `NEXT_PUBLIC_VERANA_VISUALIZER_URL` | Sister visualizer | `https://vis.testnet.verana.network` |
| `NEXT_PUBLIC_VERANA_TOPUP_VS` | Faucet/topup verifiable service | `did:web:faucet-vs.testnet.verana.network` |

All `NEXT_PUBLIC_*` values are exposed to the client by design (standard Next.js behavior). Override per environment via `.env.local` or container env vars.

---

### Docker

The app ships as a single container, multi-stage build on `node:22-alpine`.

Build:

```bash
docker build -t verana/verana-frontend:local .
```

Run (override the relevant env vars for your chain):

```bash
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_VERANA_CHAIN_ID=vna-testnet-1 \
  -e NEXT_PUBLIC_VERANA_CHAIN_NAME=VeranaTestnet1 \
  -e NEXT_PUBLIC_VERANA_RPC_ENDPOINT=https://rpc.testnet.verana.network \
  -e NEXT_PUBLIC_VERANA_REST_ENDPOINT=https://api.testnet.verana.network \
  verana/verana-frontend:local
```

Compose files in `docker-compose/` cover dev (`docker-dev`, `docker-dev-no-environment`) and hub-pulled (`docker-hub`, `docker-hub-no-environment`).

---

### Kubernetes

Apply the provided manifest:

```bash
kubectl apply -f kubernetes/verana-frontend-deployment.yaml
```

Edit env vars under `spec.template.spec.containers[0].env` for your chain.

---

### Helm

Chart at `charts/`. Install:

```bash
helm install verana-frontend ./charts \
  --set image.repository=verana/verana-frontend \
  --set image.tag=latest
```

Common overrides (see [charts/README.md](charts/README.md) for the full values reference):

- `replicas` (default 1)
- `service.type` (default ClusterIP)
- `env.NEXT_PUBLIC_VERANA_*` (override per environment)

---

### Project structure

```
app/
├─ dashboard/         # Overview and entry KPIs
├─ tr/                # Trust registries (list, detail, add)
│  ├─ cs/             # Credential schemas under a TR
│  └─ [id]/           # TR detail
├─ participants/      # Permission tree per ecosystem
│  └─ [id]/
├─ pendingtasks/      # Validation processes you participate in
├─ discover/          # Ecosystem discovery
├─ did/               # DID directory and lookup
├─ join/[id]/         # Ecosystem join flow
├─ account/           # Connected wallet, balance, low-balance warn
├─ api/sri/           # Internal API route
├─ msg/               # Cosmos msg builders and tx flows
├─ providers/         # React context providers (chain, wallet, indexer events)
├─ hooks/             # Data hooks (queries, indexer subscriptions)
├─ ui/                # Reusable UI primitives (data view, data table, common)
├─ lib/               # logger, env helpers
├─ util/              # cross-cutting utils
├─ i18n/              # i18n surface
├─ types/             # TypeScript types
└─ styles/            # Tailwind and globals
```

Plus top-level: `charts/`, `kubernetes/`, `docker-compose/`, `public/`, `Dockerfile`, `next.config.ts`, `biome.json`, `tsconfig.json`.

---

### Roadmap

Upcoming work is tracked in the [issues](https://github.com/verana-labs/verana-frontend/issues) and in the [verana-frontend-spec](https://verana-labs.github.io/verana-frontend-spec/) browsable spec. `CHANGELOG.md` is generated by release-please and reflects shipped versions.

---

### Contributing

1. Fork the repo
2. Create a branch with a conventional prefix (`feat/`, `fix/`, `chore/`, `docs/`)
3. Use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
4. Open a PR with context, screenshots if the UI changes, and a link to the issue it closes
5. CI must pass: `check-format` and `check-types`

Spec: https://verana-labs.github.io/verana-frontend-spec/

---

### License and community

This project is licensed under Apache-2.0 (see `LICENSE`).

- Docs: https://docs.verana.io/
- GitHub: https://github.com/verana-labs
- Repo: https://github.com/verana-labs/verana-frontend
- Discord: https://discord.gg/edjaFn252q
- X: https://x.com/Verana_io

Don't trust. Verify.
