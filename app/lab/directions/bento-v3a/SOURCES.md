# bento-v3a sources (Command bento)

| File | Component | Source |
|---|---|---|
| ui/chart-area-interactive.tsx | shadcn Area Chart Interactive (dashboard-01 variant with ToggleGroup) | https://ui.shadcn.com/r/styles/new-york-v4/dashboard-01.json |
| ui/number-ticker.tsx | Magic UI Number Ticker | https://magicui.design/r/number-ticker.json |
| ui/animated-list.tsx | Magic UI Animated List | https://magicui.design/r/animated-list.json |
| ui/animated-list-demo.tsx | Magic UI Animated List demo (Notification item) | https://magicui.design/r/animated-list-demo.json |
| ui/shimmer-button.tsx | Magic UI Shimmer Button | https://magicui.design/r/shimmer-button.json |
| ui/dot-pattern.tsx | Magic UI Dot Pattern | https://magicui.design/r/dot-pattern.json |
| ecosystems-card.tsx | shadcn Card + Table + Avatar + Badge composition (kept from bento-v2) | https://ui.shadcn.com/docs/components/table |
| ui/chart-bar-mixed.tsx | shadcn Bar Chart Mixed (participants by role, from bento-v3b) | https://ui.shadcn.com/r/styles/new-york-v4/chart-bar-mixed.json |
| ui/bento-grid.tsx + count-tiles.tsx | Magic UI Bento Card with Dot Pattern and Number Ticker (count tiles, from bento-v2) | https://magicui.design/r/bento-grid.json |
| schemas-card.tsx | shadcn Card + Table + Badge composition, same pattern as the ecosystems table | https://ui.shadcn.com/docs/components/table |

Adaptations: `motion/react` to `framer-motion`, icon packs to `lucide-react`, comments stripped, registry theme animations (`animate-marquee`, `animate-shimmer-slide`, `animate-spin-around`, `animate-gradient`) inlined as arbitrary `animate-[...]` with keyframes in the page `<style>`, brand colours, Verana data and copy.

Behaviour change: `AnimatedList` loops forever (interval index, `visible` window of the last N items) instead of stopping after the last child, so the feed keeps cycling inside its card.

Dropped from bento-v2: Border Beam (credentials card), Shine Border, Bento Grid, Grid Pattern, bar and radial charts.
