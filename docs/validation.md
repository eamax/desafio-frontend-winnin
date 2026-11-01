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

## Visual tokens — R13

Developer specified approximate screenshot-derived sRGB colors before implementation. Added computed-style browser checks for numeric scores 49/50/80/81, neutral missing score, font size/weight/family, and inactive/selected filter text/border/background. Existing footer/skeleton geometry remains in the browser suite. Developer verification passed: npm run check (lint, TypeScript, 38 unit/integration tests and production build), 20 Chrome E2E including computed styles and all footer/skeleton regressions, and npm run format:check. Independent QA/reviewer gate pending; no approval claimed.

Independent QA passed 38 unit/integration tests, 20 Chromium E2E, lint, TypeScript, build and formatting. Root rebuilt Docker at PORT=18080 with healthy status; production browser confirmed inactive Movie text and border both rgb(97,36,197). Updated docs/preview.png using the production app with live AniList covers and inspected the result. Final reviewer gate remains pending before commit.

## Whole-page visual audit — initial V01/V02

Specified and corrected load-more plus, white regular label, height/radius and exact search placeholder. Added a computed-style/geometry/accessibility browser regression. Remaining full-page audit is pending; no final golden comparison or independent approval claimed. Developer checks passed: npm run check (38 unit/integration tests, lint, TypeScript, production build), 21 Chrome E2E including V01/V02 styles/geometry, and npm run format:check. Independent QA/reviewer approval pending; full visual audit remains open.

## Authenticated visual audit in progress

QA inspected Figma nodes after user authentication. Developer replaced approximated typography/tokens and implemented confirmed geometry. npm run check passed38unit/integration tests;23ChromeE2E passed after card changes. Targeted exact desktop flow regression passed:1316px grid,317×270cards,rowgap21,rows210/501/792,load-more1086/footer1158. Header/footer rendered positions differ under0.35px; header native font width differs1.5px from node width, retained without scaling. Final complete checks and independent golden review follow remaining authenticated icon/overlay/group details.

Consolidated authenticated audit developer verification: npm run check passed38unit/integration tests, lint, strict types and production build; format:check passed. All25functional E2E passed in bundled Chromium1.64.1. Two Mac screenshot candidates generated in e2e/visual.spec.ts-snapshots/ (catalog-desktop-chromium-darwin.png and catalog-mobile-chromium-darwin.png) and inspected by developer. Reference fixtures retain all12 historical strings/genres/scores and use neutral artwork. Screenshot comparisons permit zero divergent pixels after default Playwright perceptual tolerance; no binary equality or QA approval claimed. Independent source comparison and Linux/Docker verification remain pending.

QA revoked the initial golden candidate after identifying a hard newline omitted from the Zom fixture by accessibility-text flattening. Corrected the fixture from raw source Content and added newline-preservation/unit and browser line-geometry regressions. Existing Mac/Linux candidates remain rejected pending all12 raw source strings and regeneration; no updated visual approval claimed.

Final candidate correction: QA confirmed all remaining11 raw title strings have no hard newline and approved V02–V10 source comparison. QA rejected the square plus shape; round caps and anisotropic scaling now reproduce the observed≈19.88×16 cross. New candidate verification and V01/V11 approval remain pending.

After both final corrections, developer checks passed: npm run check (39unit/integration tests,lint,types,build),format:check,26functional E2E in bundled Chromium1.64.1. Two Mac candidates were regenerated and replayed successfully after raw-copy confirmation; their V01/V11 source comparison is still pending independent QA. Root will rebuild Docker and regenerate Linux candidates before the final gate.

V01 label-box correction: independent QA confirmed raw Ver mais contains no extra spaces and occupies a101.9px centered text layout box. Added a minimum-width span without scaling glyphs and individual icon/label/gap position regressions. Earlier candidates are superseded pending regeneration and joint V01/V11 approval.

After the confirmed101.9px centered label-box correction, all39unit/integration tests,26functional E2E,lint,types,build and formatting passed. Mac desktop/mobile candidates were regenerated and replayed successfully again with all three source corrections. Individual icon/label positions match the reference within1.5px; no glyph scaling was used. Joint V01/V11 independent source approval and corrected Linux verification remain pending.

## Cross-platform production test correction

Root ran26functional tests against the Linux production build:24passed;two expectations differed while independently approved runtime visuals remained unchanged. The same local Mulish WOFF2 returnedHTTP200 with SHA2568d1d33d6beea5a722b8f336d79c61c07405949457e37b5e65454c72dc10aba1a and loaded200–1000FontFace. Native Linux header width was234px versus macOS235.5px and Figma237px; only the header-width assertion now allows3px on Linux and1.5px elsewhere. Header40px/400/zero-spacing, source height/y and font-loaded assertions remain. Footer Linux widths142/170 remain inside their original tolerances. Native font layout can also differ in line wrapping; this is not merely antialiasing. No font,CSS or baseline was changed.

Production minification omits default gradient endpoint positions. The computed-style assertion now accepts explicit0%/100% or omitted defaults while still requiring exactly two black stops,85% then17% alpha, in vertical180deg or its implicit equivalent. Other directions/stops/colors remain rejected. This test-only change requires fresh QA ratification. Developer checks passed after the adjustment: npm run check (39unit/integration tests,lint,types,build),format:check,26Macfunctional E2E and2Macvisual replays against unchanged PNGs. Root will rerun Linux production tests.

Root production verification after V01/V11 corrections: Compose rebuild at PORT=18080 is healthy; Mulish FontFace loaded, live AniList preview refreshed in docs/preview.png. At1366x1212, Ver mais is x25/y1086/w1316/h48 and footer x0/y1158/w1366/h54. Linux candidates were regenerated and replayed successfully (2/2) in mcr.microsoft.com/playwright:v1.64.1-noble. Independent QA visually accepted V01–V11 on Mac and Linux after checking the rounded plus, 101.9px label box and literal Zom newline against the authenticated reference.

Cross-platform diagnosis found the same served WOFF2 (HTTP200; SHA2568d1d33d6beea5a722b8f336d79c61c07405949457e37b5e65454c72dc10aba1a), loaded Mulish200–1000, but native glyph advances differ: Linux measures261/301px for the Shingeki/Jujutsu probe strings, Mac264.38385/303.45578px. This changes wrapping, not merely antialiasing; separate approved platform baselines document it. A Linux production functional run initially found24/26 passing: the header width tolerance assumed Mac metrics and the gradient assertion required redundant default stop positions. Only those test oracles were corrected, preserving application CSS/font/baselines. The rerun passed26/26 on Linux. Header-only tolerance is3px on Linux and1.5px on Mac; other geometry assertions retain their tighter bounds. Gradient still requires exactly the ordered85%/17% black stops with vertical explicit/default direction. Final QA ratification of these test/document updates and the Code Reviewer gate are recorded separately before committing.
