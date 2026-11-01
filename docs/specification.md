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

- R11: Footer reaches the viewport bottom for empty/short catalogs and follows long content in normal document flow, without fixed positioning or overlap.
- R12: Initial loading shows 12 decorative skeleton cards and an accessible loading announcement. Criteria changes show the previous item count as skeletons (12 initially), reserve the previous complete result-area height including load-more, and never show old records under new criteria. After an empty result, show a compact decorative loading placeholder inside the measured previous result area instead of proportional cards. Grid top and footer position remain stable while pending; resolved results may naturally resize. Cached immediate success needs no skeleton. Additional-page loading keeps existing cards and appends 12 decorative skeletons in the same grid. Skeleton respects reduced motion.

- R13: Authenticated design tokens replace the earlier screenshot approximation: Primary#6324c6, Danger#e92151, Warning#ffb800, Success#01ada6, genre fill#774dc5 and genre/score text#e2e5e9. Inactive format text matches its Primary border; selected format text is white. Numeric score text is Mulish400/24px; neutral missing scores remain dark. Written80yellow takes precedence over the mockup.
- R14: Use licensed local Mulish variable200–1000 with preload, no runtime font CDN. Desktop header68px/Mulish40040px centered with cap trim; footer54px with Mulish40024px brand and40010px copyright, cap trim, gap10px, horizontal offsets+8/+9.5px. Search placeholder exactly `Digite algo aqui...`; form max1012px/gap10.11px, input38px high/border#c4cad4/radius4, placeholderMulish40014px#A7B0BE, button86×38/Mulish60014px white. Formats use Mulish60014px in32px controls, gap19px, minimum widths119/105/76/105/88/65/67/76px for All Formats/TV Show/Movie/TV Short/Special/OVA/ONA/Music, centered total834px at normal text size; controls may grow instead of clipping. Load-more max1316×48px/radius8/Warning fill, Mulish60020px with25px linebox in a centered minimum101.9px label box and icon gap12.43px. The extra label-box space is layout, not stretched glyphs. Icon is an authored inline basic-plus SVG in the authenticated29.82×24px slot,24×24viewBox with nonuniform scaling and round-capped2.286-unit strokes spanning5.143–18.857; visible cross≈19.88×16px follows QA zoom measurements. It is reconstructed from the vector reference because export was unavailable; do not claim byte-identical source asset. Format groupgap19/control widths are authenticated.
- R15: Card proportion317:270 with intrinsic growth for enlarged content. Preserve explicit API/source title newlines with white-space:pre-line; never inject fixture-specific breaks into production strings. Title Mulish70024px/30px linebox, inset top23px/left-right28px, title-to-genres gap11px. Genre chips Mulish40012px/16px, padding3px8px, gap11px/radius4. Numeric score68×37px at normal text size, Mulish40024px/31px, padding3px8px, radius4, independent right/bottom8px placement. Desktop grid max1316px, column-gap16px/row-gap21px, three rows852px high. At1366px viewport, gridtop210px/rows210,501,792/load-moretop1086/footer1158. Preserve natural document flow and viewport minimum instead of copying the fixed design frameheight. Overlay uses confirmed black85%/17% endpoint alphas. Vertical180deg with0%/100% stops follows visual inspection; angle/stop positions were not exposed numerically. Image cover/center is retained because crop mode was not exposed. The plus is an authored reconstruction, not an exported asset; independent screenshot acceptance and its limits are recorded in docs/visual-audit.md and docs/visual-regression.md.

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
