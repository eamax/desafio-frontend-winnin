# BUSCANIME specification

Source: https://github.com/winnin/desafio/blob/master/FRONTEND.md
Design: https://www.figma.com/design/PPvIPPITdlgZo9CeGDVezk?node-id=3396-64

## Acceptance criteria

- R1: React + TypeScript SPA; public AniList GraphQL data, no backend or authentication.
- R2: Figma BUSCANIME purple header/footer, format controls, search and four-column desktop grid. Cards show cover, title, genres and score; yellow Ver mais appends 12 results. Tablet two columns and mobile one, without horizontal overflow.
- R3: All Formats, TV Show, Movie, TV Short, Special, OVA, ONA, Music map to null, TV, MOVIE, TV_SHORT, SPECIAL, OVA, ONA, MUSIC. Search submits by button/Enter, trimmed; format changes combine with last submitted search. Changing criteria resets pages.
- R4: Score <50 red, 50 through 80 yellow, >80 green. Null means Sem avaliação. Text accompanies color. Written rule overrides green 80 in mockup.
- R5: Named query AnimeCatalog uses Page(page,perPage:12).media(type:ANIME,search,format,sort:[POPULARITY_DESC,ID]); selects id,title{romaji english native},coverImage{large},genres,averageScore and pageInfo{currentPage hasNextPage}. Omit the format variable for All Formats: explicit null changes upstream results. Typed nullable mapping; title fallback romaji/english/native/Sem título.
- R6: Cache keyed by search/format, stale after five minutes, infinite pages, AbortSignal cancellation, deduplicate IDs. No automatic retry or window-focus refetch. HTTP and GraphQL errors handled; 429 cooldown honors Retry-After or defaults to 60 seconds. Failed additional page preserves existing cards.
- R7: Initial/additional loading, empty, recoverable error, missing image, accessible labels/focus/keyboard/live status. No raw API HTML.
- R8: Docker multi-stage build, unprivileged Nginx port 8080, Compose, healthcheck; local and container instructions.
- R9: Tests for score boundaries, mapping, GraphQL failures, filters, pagination/reset/races, recovery and responsive journeys. CI independent of live API. Separate real-API smoke.
- R10: README, DECISIONS, AI_LOG, AGENTS, docs per increment and final Mermaid + SVG architecture accurately describe delivered behavior.

## SDD workflow

Specify -> derive tests -> implement -> QA -> corrections/revalidation -> reviewer -> commit. Update this specification before changing intended behavior. Evidence maps requirement IDs to checks; never label unexecuted checks as passed.

## Delivery increments

1. Specifications/instructions and initial records.
2. Vite React TypeScript, quality scripts and CI.
3. Typed GraphQL transport, pagination contract and tests.
4. Figma catalog/card implementation and tests.
5. Search/filter/resilience integration and E2E.
6. Docker, final docs and architecture.

Visual reference observed in browser: Desktop - 2, four columns/three rows, image background cards with dark overlay, white titles, purple genre chips, score bottom-right, yellow load-more bar. Exact artwork is live API content, not fixed mockup records. Additional responsive layouts are documented adaptations.
