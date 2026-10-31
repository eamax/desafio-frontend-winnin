# BUSCANIME

Anime catalog challenge, implemented with React, TypeScript and AniList GraphQL.

Specification: [docs/specification.md](docs/specification.md). Technical choices: [DECISIONS.md](DECISIONS.md). AI usage: [AI_LOG.md](AI_LOG.md). Development instructions: [AGENTS.md](AGENTS.md).

Docker instructions will be added with packaging.

## Local development

Node.js 22.20+ and npm are required. Run `npm ci`, then `npm run dev`. Production: `npm run build` and `npm run preview`.

Quality scripts: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Unit/integration tests cover the GraphQL contract, scores, cards, combined filters, pagination, races and recovery without contacting the live API.

Browser tests: `npx playwright install chromium`, then `npm run test:e2e`. Deterministic viewport captures are saved under `test-results/`.
