# AI-Business-Intelligence-Platform

A Replit project placeholder exported from [replit.com/@channel40000000/AI-Business-Intelligence-Platform](https://replit.com/@channel40000000/AI-Business-Intelligence-Platform).

## Features

None yet — this is a workspace template, not an app. What exists:

- A pnpm workspace skeleton: `artifacts/api-server` (Express API server with only a `/health` route), `artifacts/mockup-sandbox` (UI mockup scaffold), and shared libs `lib/db` (PostgreSQL + Drizzle schema), `lib/api-spec` (OpenAPI spec), `lib/api-zod`, `lib/api-client-react`.
- Standard workspace tooling: `pnpm-workspace.yaml`, TypeScript project references, `scripts/` helpers.

The `replit.md` project brief is unfilled (`# [Project name]`, "Replace the heading above…"), so no product functionality is defined.

## Tech stack

pnpm workspaces, Node.js 24, TypeScript 5.9, Express 5, PostgreSQL + Drizzle ORM, Zod (v4), Orval API codegen, esbuild.

## Getting started

The template documents these commands in `replit.md`:

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` / `pnpm run build` — typecheck and build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Project structure

```
├── artifacts/api-server/      # Express server (health route only)
├── artifacts/mockup-sandbox/  # UI mockup scaffold
├── lib/db/                    # Drizzle ORM + Postgres schema
├── lib/api-spec/              # OpenAPI spec + Orval codegen config
├── lib/api-zod/               # Zod schemas
├── lib/api-client-react/      # React API client
└── scripts/                   # workspace helper scripts
```

## Status

Stub / template scaffold. Exported from Replit with no product code written; the project name, description, and features were never filled in.
