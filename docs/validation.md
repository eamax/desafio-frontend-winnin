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
