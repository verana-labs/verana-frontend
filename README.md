
# Verana Frontend - Next.js Starter Project

This is a starter project for React that uses Next.js.

## Running locally in development mode

This project uses [pnpm](https://pnpm.io/) as its package manager, pinned via
the `packageManager` field in `package.json`. The simplest way to get the
correct version is [Corepack](https://nodejs.org/api/corepack.html), which ships
with Node.js 22+:

    corepack enable

To get started, just clone the repository:

    git clone https://github.com/verana-labs/verana-frontend.git

and run `pnpm install && pnpm dev`:

    pnpm install
    pnpm dev

## Building and deploying in production

If you wanted to run this site in production, you should install modules then build the site with `pnpm build` and run it with `pnpm start`:

    pnpm install
    pnpm build
    pnpm start

## Code quality

Linting and formatting are handled by [Biome](https://biomejs.dev/). These are
the checks CI enforces:

    pnpm check-format   # Biome lint + format check
    pnpm check-types    # TypeScript type check

To apply Biome's automatic fixes:

    pnpm fix-format
