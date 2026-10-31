# BUSCANIME

Anime catalog challenge, implemented with React, TypeScript and AniList GraphQL.

Implementation in progress. Specification: [docs/specification.md](docs/specification.md). Technical choices: [DECISIONS.md](DECISIONS.md). AI usage: [AI_LOG.md](AI_LOG.md). Development instructions: [AGENTS.md](AGENTS.md).

Docker and end-to-end instructions will be added with their implementation.

## Local development

Node.js 22.20+ and npm are required. Run `npm ci`, then `npm run dev`. Production: `npm run build` and `npm run preview`.

Quality scripts: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Unit tests cover the GraphQL contract, nullable fields, cancellation, failures and rate limits without contacting the live API.
