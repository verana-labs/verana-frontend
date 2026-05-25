# Screenshot assets for README.md

These images are referenced from the root `README.md`. Refresh them when the
UI changes substantially (color palette, layout, navigation).

## Files

| File | Where in the app | Notes |
| --- | --- | --- |
| `dashboard.png` | `/dashboard` | Hero shot. Light mode. Wallet connected. |
| `trust-registry.png` | `/tr/[id]` | A trust registry detail with the credential schema list visible. |
| `credential-schema.png` | `/tr/cs/[id]` | A credential schema with the formatted JSON Schema panel open. |
| `permission-tree.png` | `/participants/[id]` | Permission tree with several states visible (ACTIVE, INACTIVE, REPAID). |
| `join-ecosystem.gif` | full flow | Wallet connect through joining an ecosystem. Under 5 MB. |

## How to regenerate

1. Spin up against a populated network: either local devnet or `app.testnet.verana.network`.
2. For PNGs, use the browser dev tools at 1440x900 viewport, light mode unless noted. Trim chrome.
3. For the GIF, record with [Kap](https://getkap.co/) at 15 fps, export as GIF, then optimize with
   `gifsicle -O3 --lossy=80 input.gif -o join-ecosystem.gif` to keep under 5 MB.
4. Replace files in place. Filenames are referenced from `README.md`, do not rename.
