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
