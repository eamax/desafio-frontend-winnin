# Deterministic visual regression

`npm run test:visual` runs only `e2e/visual.spec.ts`; ordinary `test:e2e` excludes screenshots. Desktop is1366×1212; mobile390×844 is an explicit responsive adaptation. Tests mock GraphQL with the historical12-title Figma copy, genres and scores in `e2e/fixtures/catalog.ts`. Literal Masamune-jun and final Kanketsu... are preserved; production still uses live AniList data. Score80 stays yellow under the written requirement.

Reference covers are deliberately replaced by a uniform neutral local SVG fixture so artwork changes never hide typography/layout regressions. This is not a claim of identical cover artwork or verified historical crop. Font readiness and eager fixture-image decoding precede capture. Animations/caret are disabled, and comparisons allow zero divergent pixels after Playwright’s default0.2 perceptual/antialias tolerance. This is not a binary PNG equality claim. No high difference threshold hides mismatched fonts. Platform-specific baselines remain separate.

## Review and update

A baseline generated from the application is only a candidate. Independent QA must compare the consolidated desktop output with the Figma, including typography, spacing, tokens and plus shape, before approving it. Mobile approval covers the documented adaptation. Updates must not silently replace a failed reference.

macOS uses the bundled Chromium matching Playwright1.64.1. Leave PLAYWRIGHT_CHANNEL unset when creating or comparing these baselines:

```sh
npm run test:visual -- --update-snapshots
npm run test:visual
```

Linux CI and baseline generation use the exact official image matching the lockfile: `mcr.microsoft.com/playwright:v1.64.1-noble`. The root agent controls that CI job. Run npm ci inside that environment and then:

```sh
E2E_BASE_URL=http://host.docker.internal:18080 npm run test:visual -- --update-snapshots
E2E_BASE_URL=http://host.docker.internal:18080 npm run test:visual
```

Use the real reachable production-app URL for your container network. When E2E_BASE_URL is provided, Playwright does not start Vite. Without it, the normal local web server starts at4173. CI must compare inside the same pinned Linux renderer used to create Linux baselines; a different host distribution can rasterize fonts differently. Baselines use Playwright's default project/platform suffixes and live beside the test in `e2e/visual.spec.ts-snapshots/`.

## Candidate history (superseded)

The first developer-generated candidates replayed successfully but had not been approved against the source. Independent QA rejected the lost literal Zom newline and the square/small plus. Reading all12 raw Content properties confirmed only Zom contains a hard newline. The fixture and white-space:pre-line preserve received breaks without injecting historical formatting into live API strings.

After the newline and rounded-plus corrections, regenerated Mac candidates replayed successfully. Linux regeneration and joint source approval were still pending at that stage. A subsequent source inspection confirmed the101.9px centered label box; developer corrected its geometry without stretching glyphs, regenerated Mac candidates and replayed them.

The root agent then regenerated and replayed Linux candidates in the pinned renderer. Independent QA compared the corrected Mac/Linux captures with the source and accepted them as recorded below. Successful generation or replay alone never established source fidelity.

## Native font layout and production serialization

The identical bundled Mulish file can have different native text advances/wrapping across macOS and Linux, beyond antialiasing. Measured header width: macOS235.5px,Linux234px,Figma237px, with source40px/400/zero-spacing and verified loaded font unchanged. The functional header-width assertion alone allows1.5px on macOS and3px on Linux; other geometry expectations retain their original tolerances. Platform baselines stay separate and approved PNGs are unchanged. No glyph scaling or broader screenshot threshold compensates for this difference.

Vite production minification may omit default0%/100% gradient endpoints from computed serialization. Functional tests accept omitted or explicit defaults only, preserving the exact two alphas/order and vertical direction. Screenshot behavior is unchanged.

## Accepted candidates

Independent QA accepted the corrected desktop/mobile Mac and Linux baselines after source comparison, not merely replay. The original candidates were rejected for the lost literal Zom newline and the square/small plus; the label box was then corrected without stretching glyphs. Current baselines include all three corrections. Code review remains a separate pre-commit gate.
