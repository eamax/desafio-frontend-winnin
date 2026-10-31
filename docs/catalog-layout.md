# Catalog layout and loading

R11 uses a flex column shell with `min-height: 100vh` plus `100dvh` for dynamic browser viewports. The main region grows into spare space. The footer stays in normal flow: at the bottom for zero/one result, below the catalog for long pages. It is never fixed over content.

R12 starts with 12 skeleton cards in the same responsive grid and 316:270 proportions. Skeletons are decorative (`aria-hidden`); a separate status outside the busy result area announces loading without waiting for the request to finish. Their pulse is disabled for reduced motion.

Before a submitted search or format change, save the visible item count and measured height of the complete result region, including load-more. Pending criteria show that count as skeletons and reserve the measured minimum height, preserving grid top and footer position. Rapid changes during pending reuse this reservation. Old anime records are absent under new criteria. A fresh cached result renders immediately. Once a response resolves, the layout may resize naturally to its new count.

Fetching another page keeps current cards, appends 12 decorative skeletons in the same grid, and disables load-more with an announced loading state. Error, retry and cooldown behavior is unchanged.

Tests cover initial/changed loading, rapid criteria changes, desktop footer geometry for 0/1/24 records, pending filter/search geometry after 1/24 records, reduced motion and additional-page loading. Existing responsive/200% text-size tests continue to run.

After an empty result, criteria changes use compact decorative loading bars inside the measured previous result area; no proportional skeleton cards are added. This preserves footer position even on short mobile viewports. Initial page loading still uses 12 cards.
