# Validation evidence

## Increment 1 — specifications

R1–R10 mapped in specification.md. Executable checks: not applicable (documentation only). QA and reviewer outcomes are captured in agent messages before commit; subsequent increments summarize resolved findings here.

## Increment 2 — foundation

Increment 1 approved by QA and independent reviewer with no blockers; committed as 6a85f04. Foundation introduces Vite, React strict TypeScript, quality scripts and CI. No behavior tests yet: temporary shell has no business behavior; test runner is checked with --passWithNoTests. R1 and tooling portion of R9.

Foundation checks executed successfully: lint, TypeScript, Vitest runner (--passWithNoTests), production build. npm 10 hit an internal Arborist error; installation succeeded using npm 11. npm audit --omit=dev: 0 vulnerabilities. Full audit: 12 moderate tooling findings through minimatch/ESLint; no forced breaking downgrade applied. These packages are excluded from production image.
Reviewer found the declared Node minimum was lower than transitive tooling requirements. Corrected engines/README to Node 22.20+. Local checks ran on 22.19; CI and Docker use current Node 22 and are the supported environment.

## Increment 3 — AniList contract

Foundation approved by QA and reviewer after correcting Node minimum. Added typed named GraphQL operation, nullable data mapping, cancellation/error handling and API unit tests. R5/R6/R9. Real public API smoke returned Cowboy Bebop ID 1 and score 86 using combined search/TV format. Removed temporary passWithNoTests CI exception.
API checks: npm run check passed with 16 tests; QA identified invalid negative Retry-After parsing. Developer corrected to 60-second fallback and added regression: 17 API tests passed. Full gate follows the corrected diff.

## Increment 4 — card presentation

GraphQL increment approved by QA and reviewer, 17 tests. Reviewer suggested making HTTP-date test distinct from fallback: changed expected date to +120 seconds. Added standalone Figma-style card, percent score with textual accessible name, null/failed-cover fallback and pure score classification. R2/R4/R7. Catalog composition follows in increment 5.

## Increment 5 — complete catalog

Standalone cards approved by QA/reviewer with 28 tests. Composed Figma-style page, refined titles/score to 24px based on desktop frame, submit search, combined format, infinite pagination/cache/deduplication, cooldown and recoverable states. Added MSW behavior tests and Playwright deterministic journeys/viewport captures (1440,768,390). Visual captures use simulated data; no claim of identical live artwork.
Catalog QA found score clipping with 200% text enlargement and many genres; developer replaced fixed card height with intrinsic grid sizing, preserving the Figma ratio as a minimum. Targeted zoom regression passed. Developer also fixed returning to cached filters: trim destination cache to page 1 without renewing its timestamp; added retained-cache regression. npm run check: 36 tests passed. Full browser gate follows corrected content.
Independent reviewer caught that initial loading was announced only to screen readers, leaving sighted users without feedback. Developer made pending status visible and added delayed-response browser regression; successful-result status remains visually hidden to follow the reference layout.

## Increment 6 — packaging and delivery

Catalog approved after independent QA (36 unit/integration tests, 8 Chrome E2E, lint/types/build) and reviewer recheck of loading feedback. Added production Docker/Compose, static-server config and final architecture sources. Packaging checks and live browser smoke are recorded below after execution.
Production packaging: initial 8080 and alternate8081 were occupied by existing unrelated services; left them untouched. Added PORT override and started with PORT=18080. Docker build completed with npm ci and Node22; Compose --wait reports healthy. Runtime uid=101 (nginx), HTTP root returned200. Real browser smoke after the format-null fix returned12 cards with Shingeki no Kyojin first; real covers loaded. Captured docs/preview.png and inspected it. Architecture SVG rendered and visually inspected; editable Mermaid source included. GitHub Actions definition is present but no remote run is claimed.

## Layout refinement — R11/R12

Developer specified footer flow and skeleton reservation before implementation. Added integration coverage for decorative initial skeletons, previous-count retention and rapid pending changes. Browser geometry checks exercise footer placement with 0/1/24 results and stable grid/complete-result-area bounds during filter/search after 1/24 records. Initial feedback regression now verifies visible skeletons plus accessible announcement, rather than a status paragraph that shifts the grid. Reduced-motion and additional-page preservation checks added. Developer checks passed: npm run check (lint, strict TypeScript, 37 unit/integration tests and production build), 16 Chrome Playwright journeys including geometry/reduced-motion/additional-page skeletons, and npm run format:check. Additional-page loading appends 12 skeletons while preserving existing cards. Independent QA/reviewer gate pending; Docker rebuild remains assigned to root.

QA correction: empty-to-pending previously expanded 12 placeholders. Compact decorative bars now fill only the measured empty result region; flow-root contains its margins. New regressions cover 1440x900,390x844,390x400 and assert result top/height, footer position, accessible announcement and absence of card placeholders. Corrected developer checks: 38 unit/integration tests and 19 Chrome E2E passed, including all three new geometry cases. Live status moved outside aria-busy with a DOM regression; final npm run check and format:check passed after this accessibility adjustment. Independent revalidation remains required.

Final independent QA revalidation passed: 38 unit/integration tests, 19 Chromium E2E, lint, TypeScript, production build and formatting. Empty-to-pending geometry differed by less than 1px across all three viewport regressions. Root rebuilt Docker with PORT=18080 and Compose --wait reported healthy; production-browser smoke at390x844 measured footer y794 both before and during a pending search. Final reviewer approval remains pending before commit; its outcome will be recorded in the gate messages.
