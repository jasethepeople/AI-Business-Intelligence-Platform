# Signal Foundry

Signal Foundry helps operators and investors discover, score, and investigate local service businesses with acquisition and automation potential.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/signal-foundry/` — React/Vite web app with dashboard, target universe, target investigation, discovery, and activity routes
- `artifacts/api-server/src/routes/` — Express API route handlers
- `lib/api-spec/openapi.yaml` — source of truth for the API contract
- `lib/db/src/schema/businesses.ts` — source of truth for target, signal, memo, discovery-run, and activity tables
- `artifacts/signal-foundry/src/index.css` — shared visual theme and responsive layout tokens

## Architecture decisions

- API contracts are defined in OpenAPI and generated into the shared React Query client and Zod validators.
- Business intelligence is stored as separate targets, signals, memos, discovery runs, and activity records so later modules can reuse the same evidence model.
- Discovery is modeled as a persisted run that creates target and signal records; it is ready to be replaced by connected data sources without changing the UI contract.
- The first memo engine is deterministic and evidence-backed so the product remains usable without an external provider; an LLM provider can be added behind the same memo endpoint later.

## Product

- Dashboard with target counts, qualified targets, average score, revenue pool, automation lift, and latest discovery run
- Searchable and filterable business target universe
- Target investigation view with signal evidence, pipeline stage updates, and acquisition memo generation
- Local discovery runs by location and business categories
- Recent activity timeline

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- Run `pnpm --filter @workspace/db run push` after changing `lib/db/src/schema/`.
- The API server seeds a small demo dataset only when the target table is empty; it exits if the seed cannot persist.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
