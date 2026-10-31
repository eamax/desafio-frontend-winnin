# Decisions

- React + Vite + strict TypeScript, CSS Modules: small static application without SSR requirements.
- TanStack Query + fetch: cache, cancellation and infinite pagination without a second GraphQL client or global state library.
- Search on submit follows the Figma Buscar button; no automatic debounce requests.
- Popularity descending, ID tie-breaker; 12 items per page. These are explicit product defaults.
- Written score boundaries override the mockup's green 80. Missing score is neutral.
- SDD uses lightweight Markdown; no Spec Kit. Docker only, hosted deployment excluded.
- No login, favorites, detail routes or backend. Prefer focused behavior tests over coverage targets.
- Responsive layouts beyond provided desktop are adaptations. Live catalog titles/covers/scores vary over time.

## With more time

Hosted preview, broader browser/device checks, and designer review of responsive adaptations.

## Delivery refinements

- Cards use an intrinsic grid with a ratio spacer: preserve the desktop proportion while allowing enlarged text and long genre lists to grow the card. Fixed aspect-ratio height caused real score clipping at 200% text size and was rejected.
- Returning to cached criteria trims only the destination pages to page 1 and preserves dataUpdatedAt; restarting pagination does not artificially refresh cache age.
- Loading uses visible decorative skeletons and a separate screen-reader announcement. Before criteria changes, measure the whole result area (including load-more) and retain its height and previous card count while pending. Keep the same reservation across rapid changes; never show old records under new filters. Results may naturally contract after success. Additional-page fetches keep existing cards and append 12 skeletons. Reduced motion disables the pulse.
- Empty-to-pending transitions use compact decorative bars inside the measured prior area rather than proportional cards, preserving footer position even on short mobile screens. Live announcements sit outside the busy results container to avoid deferral.
- A flex page shell with minimum viewport height keeps the footer at the bottom for sparse results without a fixed footer or content overlap.
- System-font fallback avoids external font requests. Exact design font metadata was not available anonymously; visual matching is based on the visible desktop reference, with that fidelity limitation stated in README.
- Docker uses current Node 22 Alpine and nginxinc unprivileged stable Alpine. Tags track upstream maintenance; dependency versions are locked by npm. Production excludes the development dependency tree. Local audit found zero production findings and 12 moderate tooling findings through minimatch/ESLint; forcing a breaking downgrade was rejected.
