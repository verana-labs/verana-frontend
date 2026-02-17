# CI/CD Verana Frontend

This document explains how the workflows in `.github/workflows` work and how developers should use them.

## Workflow list

- `lint-pr.yml` (Lint PR): validates PR titles against Conventional Commits.
- `dev-release.yml` (Dev Pre-release): generates pre-releases with `semantic-release`, publishes `dev` Docker images, and deploys to testnet with Helm.
- `stable-release.yml` (Release Please): creates stable releases with Release Please and publishes stable Docker images.

## General rules

- PR titles must follow Conventional Commits (preset `angular`). See https://www.conventionalcommits.org/en/v1.0.0/ for the spec. Valid examples: `feat: add login`, `fix: route bug`, `refactor: clean hooks`.
- The lint workflow enforces `validateSingleCommit: true`, so each PR must end up with a single commit (squash or rebase).

## Workflow: Lint PR (`lint-pr.yml`)

**Trigger**  
Runs on `pull_request_target` when the PR is opened, edited, or synchronized.

**What it does**  
Validates the PR title with `amannn/action-semantic-pull-request`.

**How to use it**  

1. Open the PR with a title like `feat: short description`.
2. If it fails, adjust the title and/or squash the PR to one commit.

## Workflow: Dev Pre-release (`dev-release.yml`)

**Trigger**  
Runs on push to `main` and branches matching `release/**`.

**What it does**  

1. Runs `semantic-release` with a `dev` pre-release on `main`.
2. If a new release is published, builds and pushes `dev` Docker images.
3. If a new release is published, deploys with Helm to namespace `vna-testnet-1`.

**Versioning**  
Uses `@semantic-release/commit-analyzer` with preset `angular`. Types `refactor` and `build` also trigger a patch release.

**Docker tags**  
Publishes:  
`verana-front:dev`,  
`verana-front:v<major>-dev`,  
`verana-front:v<major>.<minor>-dev`,  
`verana-front:v<version>`.

**How to use it**  

1. Ensure commits use Conventional Commits prefixes.
2. Merge to `main` or push to `release/**`.
3. If `semantic-release` publishes a release, build, push, and deploy run automatically.

## Workflow: Release Please (`stable-release.yml`)

**Trigger**  
Runs on push to `main`.

**What it does**  

1. `release-please` creates or updates a release PR.
2. When a release is created, stable Docker images are published.

**Docker tags**  
Publishes:  
`verana-front:latest`,  
`verana-front:<tag_name>`.

**How to use it**  

1. Merge changes to `main`.
2. Review and merge the release PR created by Release Please.
3. When the release is created, stable images are published.

## Release PR examples (chore)

Release Please generates PRs with `chore` titles. Examples:

- `chore(main): release 1.2.3`
- `chore(main): release 0.8.0`
- `chore(main): release 2.0.0`
