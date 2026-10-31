# Development instructions

Use React, strict TypeScript and AniList GraphQL. Follow the approved specification in docs/specification.md before implementation. Every implementation updates relevant docs and meaningful tests.

Before EVERY commit: developer delivers -> QA inspects and validates -> developer corrects -> QA revalidates -> independent Code Reviewer reviews final diff -> resolve blockers and repeat affected checks -> commit. No edits after approval without revalidation. Documentation-only commits follow this sequence with executable checks marked not applicable. Never fabricate evidence. Preserve real iteration with English Conventional Commits. Commit identity is the local Andrew identity; do not change global Git settings.

Agents: frontend_expert owns implementation; qa_expert validates acceptance and regressions; code_reviewer_expert applies the code-review skill and reviews correctness, contracts, security and maintainability. No agent commits independently.
