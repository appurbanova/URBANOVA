# URBANOVA

URBANOVA turns public builder activity into a living digital city with an explorable demo, wallet-ready access, and a personal command center.

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

- `artifacts/urbanova/src/App.tsx` — product routes, demo interactions, local session, and wallet connection flows
- `artifacts/urbanova/src/index.css` — URBANOVA visual system and responsive styling
- `artifacts/api-server` — shared API service reserved for future server-backed product features
- `lib/api-spec/openapi.yaml` — shared API contract source of truth

## Architecture decisions

- The first product surface is a frontend-first demo so the core experience works without a database or account provisioning.
- Demo sessions and preferences use browser localStorage, making the preview usable while keeping the access gate explicit.
- Wallet access detects browser providers and requests a real connection when available, while showing a clear recovery message when not installed.
- The product is original URBANOVA branding and copy, using the public GitHub City concept only as a high-level reference for a developer activity city.

## Product

URBANOVA includes a public landing page, interactive city demo, email and wallet-ready access gate, authenticated dashboard, product education pages, cookie controls, and an August to December 2026 roadmap.

## User preferences

- Keep the experience mobile first and product-studio quality.
- Do not use em dashes or generic AI placeholder copy in user-facing content.
- Ship work in small, committed batches and push each completed batch.

## Gotchas

- Run the artifact workflow for preview because its Vite configuration requires injected `PORT` and `BASE_PATH` values.
- Run `pnpm --filter @workspace/urbanova run typecheck` after frontend changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
