# AGENTS.md

What is specific to `verana-frontend`, for anyone, human or agent, working here. The rules shared across our repositories (branches, commits, PR titles, releases, checks before pushing) are in the [organization AGENTS.md](https://github.com/2060-io/organization/blob/main/AGENTS.md). This file wins where the two differ. If you change a command, path or convention listed here, update this file in the same PR.

## What this is

The Verana v4 console: a Next.js 16 app (React, TypeScript strict, Tailwind 4, cosmos-kit) where a connected wallet acts for a Corporation on the Verana Verifiable Public Registry: ecosystems, credential schemas, participants, trust deposits and group proposals.

- Spec: `v4/verana-frontend/spec.md` in [verana-labs/verana-spec](https://github.com/verana-labs/verana-spec/blob/main/v4/verana-frontend/spec.md). Requirements have ids like `[VFE-DATA-SRC-1]`.
- The indexer contract it consumes is `v4/verana-indexer/spec.md` in the same repo.

## Setup

```bash
corepack enable                  # pnpm 9.15.9, pinned in packageManager
pnpm install --frozen-lockfile
pnpm dev                         # next dev --turbopack, http://localhost:3000
```

CI runs Node 24, the Docker image builds and runs on Node 22. The committed `.env` targets devnet (`vna-devnet-1`), put local overrides in `.env.local` (gitignored).

| Command | Runs |
|---|---|
| `pnpm build` | `next build` (standalone output) |
| `pnpm check-format` | `biome check`, lint and format, no writes |
| `pnpm fix-format` | `biome check --write --unsafe` |
| `pnpm check-types` | `tsc --noEmit` |
| `pnpm test` / `pnpm test:watch` | vitest once / watch |
| `pnpm e2e` | `playwright test` on every spec, including the ones that broadcast |

## CI

`.github/workflows/ci.yml` runs Lint, Types & Tests (the shared workflow), Unit (vitest) and Validate PR Title on every PR to `main`.

- E2E Ring A only runs on manual dispatch, so a PR does not run it. Run it locally when you touch a flow it covers.
- Validate Helm Charts lints nothing here: the chart is at `./charts/Chart.yaml` and `ci.yml` does not set `charts-dir`. Run `helm lint charts -f charts/values-devnet.yaml` yourself when you touch the chart.
- Biome warnings do not fail CI, errors do.

## Layout

- `app/<route>/page.tsx`: `account`, `agents`, `corporation`, `credential-schemas`, `dashboard`, `discover`, `ecosystems`, `participants`, `pendingtasks`, `settings`, `wallet`. Legacy `/tr` redirects live in `next.config.ts`.
- `app/api/`: route handlers (`sri`, `language-options`, `verified-fetch`).
- `app/config/`: `env.ts` holds the runtime variables the app reads and the derived indexer endpoints, `veranaChain.client.ts` the cosmos-kit chain info, `veranaChain.sign.client.ts` the registry, amino types and gas settings.
- `app/hooks/`: data hooks (`use<Thing>.ts`).
- `app/msg/`: transactions. `actions_hooks/` action hooks per module, `util/` signing, simulation, broadcast and indexer wait, `constants/` Msg type config.
- `app/providers/`: chain, acting corporation, indexer events socket, notifications, protocol params, transaction confirmation.
- `app/ui/`: `common/`, `account/`, `agents/`, `corporation/`, and the declarative `dataview/` and `datatable/`.
- `app/lib/`: domain logic and `logger`. `app/util/`: validations and helpers. `app/i18n/dataview/`: dictionaries.
- `e2e/`: Playwright specs, `e2e/support/` and `e2e/mocks/` hold the Keplr mock, mock chain and indexer stubs.
- `charts/` (Helm, `values-devnet.yaml`, `values-testnet.yaml`), `Dockerfile`, `entrypoint.sh`. `docker-compose/` is stale (`yarn start`), deploy through the chart.

## Data sources

- Indexer v4 for every registry read. `app/config/env.ts` derives `{NEXT_PUBLIC_VERANA_INDEXER_BASE_URL}/v4/<module>` routes and the `/v4/indexer/subscribe` websocket from the base URL.
- Chain RPC (`NEXT_PUBLIC_VERANA_RPC_ENDPOINT`) for simulation, signing and broadcast (`app/msg/util/signAndBroadcastManual*.ts`) and account-local queries such as the balance.
- Chain REST (`NEXT_PUBLIC_VERANA_REST_ENDPOINT`) only feeds the cosmos-kit chain info. The spec forbids depending on it (`[VFE-DATA-SRC-1]`), so do not add REST reads.

## Runtime environment

- `NEXT_PUBLIC_*` values are read at runtime so one image serves any network: `<PublicEnvScript />` from `next-runtime-env` in `app/layout.tsx` exposes them, `readEnv` in `app/config/env.ts` reads them. Import from `@/config/env`, do not read `process.env.NEXT_PUBLIC_*` in app code, Next inlines those at build time. The one exception is `NEXT_PUBLIC_APP_VERSION`, injected from `package.json` at build time in `next.config.ts`.
- `entrypoint.sh` injects nothing. It fails the container start if a required variable is missing (chain id and name, RPC, indexer base URL, explorer), then runs `node server.js`.
- A new variable the app reads goes in `app/config/env.ts`, `.env`, `.env.ci` and `charts/values*.yaml`. If it is required, also in `REQUIRED_VARS` in `entrypoint.sh` and the `$network` list in `charts/templates/deployment.yaml`. Document it in the README configuration table.

## i18n

- Every user-facing string goes through `translate('some.key')` from `@/i18n/dataview` (layouts read `getDictionary()` for metadata). Placeholders use `{name}`: `translate('corporation.threshold.total', { total })`.
- Keys are flat dotted strings in `app/i18n/dataview/en.json` and `es.json`. Add, rename and delete in both so the key sets stay identical. Nothing checks this, and a missing key silently falls back to English, then to the raw key:

```bash
node -e "const e=Object.keys(require('./app/i18n/dataview/en.json')),s=new Set(Object.keys(require('./app/i18n/dataview/es.json')));console.log(e.length===s.size&&e.every(k=>s.has(k)))"
```

## Code

- TypeScript strict. Avoid `any`, use `unknown` and narrow. No non-null `!` (biome error).
- No `console`, use `logger` from `@/lib/logger` (biome `noConsole` is an error outside `e2e/`).
- New files are kebab-case, hooks are `use<Thing>.ts`. Older code under `app/msg/` and `app/util/` uses camelCase or snake_case names, match the folder you are in.
- Import from `app/` through the `@/` alias. Formatting is biome's, run `pnpm fix-format`.

## Testing

Unit (vitest):

- Only `app/**/*.test.{ts,tsx}` runs, in a node environment: there is no DOM. Put the test next to the code and test exported logic (parsers, validators, state derivation).
- Modules importing `@/config/env` read variables at import time. Mock `next-runtime-env` or `@/config/env` with `vi.mock`, see `app/config/env.test.ts`.

Playwright:

- Once: `pnpm exec playwright install chromium` (add `--with-deps` on Linux). The browser is headed unless `E2E_HEADLESS=true`.
- Ring A (`e2e/ring-a-*.spec.ts`) is fund-free and nothing reaches the chain: the Keplr mock signs in the page, specs stub the indexer routes they depend on, and `e2e/support/mock-chain.ts` intercepts the RPC for specs that submit a transaction. Run `E2E_HEADLESS=true pnpm exec playwright test e2e/ring-a-`.
- `playwright.config.ts` starts `PORT=3100 pnpm dev` and reuses any server already on :3100, even one serving another branch. `baseURL` is fixed there, so for another port use an untracked copy of the config with its own `baseURL` and `webServer`, and set `E2E_BASE_URL` to the same URL for the warm-up global setup.
- Specs calling `requireFundedMnemonic()` run against devnet and need a funded wallet in `E2E_MNEMONIC`, `SECRET_WORDS` or `.test-mnemonic` (gitignored). CI never runs them.

## Known traps

- `pnpm check-format | tail` returns the exit code of `tail`. Redirect to a file, check `$?`, then read the file.
- The shared lint workflow runs `pnpm test:e2e` whenever that script exists. The e2e script is named `e2e`, so CI skips it. Renaming it to `test:e2e` would make CI run the funded specs.
- Ring A specs must install indexer stubs (`page.route`, `stubCorporationRoutes`, `installCorporationStubs`) before `connectWallet`: connecting starts corporation discovery against the real indexer right away.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
