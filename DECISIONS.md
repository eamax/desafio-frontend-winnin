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
- Initial loading is visible and announced. Successful count announcements are visually hidden to preserve the reference spacing.
- System-font fallback avoids external font requests. Exact design font metadata was not available anonymously; visual matching is based on the visible desktop reference, with that fidelity limitation stated in README.
- Docker uses current Node 22 Alpine and nginxinc unprivileged stable Alpine. Tags track upstream maintenance; dependency versions are locked by npm. Production excludes the development dependency tree. Local audit found zero production findings and 12 moderate tooling findings through minimatch/ESLint; forcing a breaking downgrade was rejected.
