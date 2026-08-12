# URBANOVA Architecture

This document describes the current repository architecture and the planned architecture for each unfinished roadmap milestone. It is the source of truth for where things live and where they are going.

---

## Current architecture (live)

URBANOVA is a pnpm monorepo with a frontend-first product surface. The core experience runs entirely in the browser without a database or account provisioning, while a reserved API server and database layer stand ready for future server-backed features.

### Repository layout

```
URBANOVA/
├── artifacts/
│   ├── urbanova/              # @workspace/urbanova — the live frontend app
│   │   ├── src/
│   │   │   ├── App.tsx        # Product routes, demo interactions, auth, wallet flows
│   │   │   ├── index.css      # URBANOVA visual system and responsive styling
│   │   │   ├── components/    # Urbanova3D, UrbanovaCityPreview, UI primitives
│   │   │   ├── hooks/         # useAuth (Supabase session)
│   │   │   ├── lib/           # supabase client
│   │   │   └── pages/         # not-found and future page splits
│   │   ├── public/            # Static assets
│   │   ├── vite.config.ts     # Vite + Tailwind + Replit plugins
│   │   └── package.json
│   ├── api-server/            # @workspace/api-server — Express 5 (reserved)
│   │   ├── src/
│   │   └── build.mjs          # esbuild CJS bundle
│   └── mockup-sandbox/        # Design and prototype sandbox
├── lib/
│   ├── api-spec/              # @workspace/api-spec — OpenAPI contract (source of truth)
│   │   └── openapi.yaml
│   ├── api-client-react/      # @workspace/api-client-react — Orval-generated React Query hooks
│   ├── api-zod/               # @workspace/api-zod — Orval-generated Zod schemas
│   └── db/                    # @workspace/db — Drizzle ORM schema + migrations
├── scripts/                   # Workspace tooling and post-merge helpers
├── .github/workflows/
│   └── deploy-pages.yml       # Build + deploy to GitHub Pages on push to main
├── repo/                      # Repository meta (mirrors root for Pages tooling)
├── package.json               # Workspace root — build, typecheck scripts
├── pnpm-workspace.yaml        # Workspace packages + dependency catalog
├── tsconfig.base.json         # Shared TypeScript compiler options
├── tsconfig.json              # Project references (lib/db, api-client-react, api-zod)
└── replit.md                  # Operating notes and conventions
```

### Package responsibilities

| Package | Name | Role |
| --- | --- | --- |
| `artifacts/urbanova` | `@workspace/urbanova` | The live product. React 19 + Vite 7 SPA with routing via wouter, Tailwind CSS 4 design system, Three.js 3D city, Framer Motion animations, Supabase auth. |
| `artifacts/api-server` | `@workspace/api-server` | Express 5 API server. Reserved for future server-backed product features. Currently scaffolded, not consumed by the frontend. |
| `artifacts/mockup-sandbox` | — | Design and prototype sandbox for exploring visual ideas before they move into the product. |
| `lib/api-spec` | `@workspace/api-spec` | The OpenAPI contract — source of truth for the API surface. Orval codegen reads this. |
| `lib/api-client-react` | `@workspace/api-client-react` | Auto-generated React Query hooks from the OpenAPI spec. Consumed by the frontend when it needs server data. |
| `lib/api-zod` | `@workspace/api-zod` | Auto-generated Zod schemas from the OpenAPI spec. Used for runtime validation. |
| `lib/db` | `@workspace/db` | Drizzle ORM schema definitions and migrations for PostgreSQL. |
| `scripts` | — | Workspace tooling, post-merge hooks, and helper scripts. |

### Data flow (current)

```
Browser
  │
  ├── localStorage ──── demo session, city preferences, analytics toggle
  │
  ├── Supabase Auth ──── email/password session (useAuth hook)
  │
  ├── GitHub API ─────── public profile fetch (direct from browser, no backend)
  │
  └── Wallet provider ── browser-injected EIP-1193 provider detection
```

The frontend talks directly to Supabase for auth and to GitHub for public profile data. No URBANOVA-owned backend is in the request path today. The API server and database packages exist and compile but are not yet wired into the product.

### Deployment

GitHub Actions workflow (`.github/workflows/deploy-pages.yml`) on every push to `main`:

1. Check out the repo
2. Set up pnpm 10 + Node 24
3. `pnpm install --frozen-lockfile`
4. Build the frontend: `pnpm --filter @workspace/urbanova run build` (with `BASE_PATH=/`, `PORT=4173`, `NODE_ENV=production`, and Supabase env vars from secrets)
5. Prepare SPA routes — copy `index.html` into each route folder (`/demo`, `/about`, `/how-to`, `/roadmap`, `/legal`, `/privacy`, `/terms`, `/cookies`, `/login`, `/dashboard`) plus a `404.html` fallback
6. Add `.nojekyll` so GitHub Pages serves the SPA assets
7. Upload and deploy the Pages artifact

### Key architectural decisions

- **Frontend-first demo.** The first product surface is a frontend-only SPA so the core experience works without database or account provisioning. This lets the city be explored immediately.
- **localStorage for session state.** Demo sessions and preferences use browser localStorage, making the preview usable while keeping the access gate explicit. Auth has since moved to Supabase, but demo preferences remain local.
- **Wallet detection, not assumption.** Wallet access detects browser providers and requests a real connection when available, with a clear recovery message when not installed. No mock wallet.
- **OpenAPI as contract.** The API spec in `lib/api-spec/openapi.yaml` is the source of truth. Client hooks and Zod schemas are generated from it via Orval, keeping the frontend and any future server in sync.
- **Original branding.** URBANOVA uses original branding and copy. The public GitHub City concept is a high-level reference only.

---

## Planned architecture (roadmap)

The following sections describe the intended architecture for each unfinished roadmap milestone. These are design directions, not shipped code. Each milestone builds on the previous one.

### SEP 2026 — Games & Playable Districts

**Goal:** Turn the city from a readable map into a playable space.

Planned additions:

```
artifacts/urbanova/src/
├── components/
│   ├── games/                # New
│   │   ├── GameCanvas.tsx    # Shared canvas for mini-games
│   │   ├── QuestEngine.tsx   # Quest state machine tied to builder activity
│   │   └── minigames/        # Individual playable mini-games per district
│   └── ...
├── hooks/
│   ├── use-quests.ts         # New — quest progress and reward state
│   └── ...
└── lib/
    ├── game-state.ts         # New — local game state schema (Zod-validated)
    └── ...
```

Architecture notes:

- Mini-games run inside district cards on the existing 3D city canvas, not a separate route.
- Quests are driven by real builder activity signals (releases, merges, writing) fetched the same way the current demo fetches GitHub data.
- Reward state starts in localStorage and migrates to Supabase when the on-chain layer lands in October.
- No new backend package required yet — games are client-side with activity-signal inputs.

### OCT 2026 — Onchain & Wallet Access

**Goal:** Add a real on-chain ownership layer and expand data sources beyond GitHub.

Planned additions:

```
artifacts/urbanova/src/
├── hooks/
│   ├── use-wallet.ts         # New — wallet connection, signature, account state
│   └── ...
├── lib/
    ├── chain.ts              # New — chain client (RPC provider, contract ABIs)
    ├── city-registry.ts      # New — on-chain city ownership record reads/writes
    └── activity-sources/     # New — pluggable multi-source activity adapters
        ├── github.ts
        ├── writing.ts
        └── conversations.ts

lib/
└── db/
    └── schema/
        ├── city-ownership.ts  # New — Drizzle schema for on-chain city records
        └── activity-events.ts # New — normalized activity event log
```

Architecture notes:

- Wallet login replaces (or supplements) email auth. The existing `useAuth` hook gains a wallet session path alongside Supabase.
- NFT-gated district customization: district appearance and metadata are gated by NFT ownership verified on-chain.
- On-chain city ownership records: each city is an NFT. Ownership and transfer history come from chain reads, not a URBANOVA table.
- Multi-source activity feeds: the current single GitHub adapter becomes one of several pluggable adapters behind a shared `ActivitySource` interface. New adapters (writing, conversations) feed the same normalized event log.
- Cross-district navigation: signals link back to their source (a release, a discussion, a post) with deep links.
- The API server (`artifacts/api-server`) comes online here to proxy chain reads and normalize multi-source activity, keeping private keys and rate-limited RPC calls server-side.

### NOV 2026 — Exchange & Civic Layer

**Goal:** Launch the URBANOVA Exchange and a civic context layer.

Planned additions:

```
artifacts/urbanova/src/
├── components/
│   ├── exchange/             # New
│   │   ├── TradingView.tsx   # Token trading pairs and price chart
│   │   ├── LiquidityPools.tsx
│   │   └── OrderBook.tsx
│   └── civic/
│       ├── ContextNotes.tsx  # Builder-left context, notes, invitations
│       └── Invitations.tsx
├── pages/
│   ├── exchange.tsx          # New route
│   └── marketplace.tsx       # New — city NFT marketplace

lib/
├── api-spec/
│   └── openapi.yaml           # Extended — exchange + civic endpoints
└── db/
    └── schema/
        ├── orders.ts          # New — order book state
        ├── liquidity.ts       # New — liquidity pool state
        ├── civic-notes.ts     # New — context notes and invitations
        └── nft-listings.ts     # New — marketplace listings
```

Architecture notes:

- URBANOVA Exchange integrates with the EasyA Kickstart launchpad (already listed) for deeper trading pairs and liquidity.
- The civic layer is a server-backed feature: builders leave context, notes, and invitations that persist across sessions. This is the first feature that requires the database for writes, not just reads.
- The NFT marketplace for trading city NFTs uses the on-chain ownership records from October as its source of truth.
- OpenAPI spec extends to cover exchange and civic endpoints; Orval regenerates the React Query hooks and Zod schemas.

### DEC 2026 — Mobile & Year in Review

**Goal:** Ship a mobile app beta and a builder API.

Planned additions:

```
artifacts/
├── mobile/                   # New — React Native (Expo) app
│   ├── app/
│   ├── src/
│   │   ├── components/        # Shared with web where possible
│   │   ├── hooks/             # useAuth, useWallet, useCity (shared)
│   │   └── lib/               # supabase, chain clients (shared)
│   ├── app.json
│   └── package.json
└── urbanova/
    └── src/
        └── pages/
            └── year-in-review.tsx  # New — annual city health report

lib/
├── api-spec/
│   └── openapi.yaml           # Extended — public builder API endpoints
└── db/
    └── schema/
        └── annual-reports.ts  # New — cached annual city health snapshots
```

Architecture notes:

- Mobile app built with React Native (Expo) because the workspace already pins React and React DOM to Expo-compatible versions.
- Shared logic (auth, wallet, chain, activity sources) extracted into platform-agnostic modules consumed by both web and mobile.
- Builder API: a public, read-only API for reading and embedding city data. Extends the OpenAPI spec with public endpoints; rate-limited and authenticated via API keys.
- Year in Review: a slower, deeper read of a builder's year in public — what stayed lit, what changed shape, annual city health reports, and a mint calendar for the next year. Cached annually in the database as snapshots.

---

## Conventions

- **pnpm only.** The root `preinstall` script blocks npm and yarn. Use pnpm for all installs.
- **Minimum release age.** `pnpm-workspace.yaml` enforces a 1-day minimum release age for npm packages as a supply-chain defense. Do not disable it.
- **Typecheck after frontend changes.** Run `pnpm --filter @workspace/urbanova run typecheck` after any frontend edit.
- **Artifact workflow for preview.** The Vite config requires injected `PORT` and `BASE_PATH` values, so use the artifact workflow for local preview rather than running Vite directly without those env vars.
- **Ship in small batches.** Push each completed batch rather than accumulating large changes.
- **No em dashes or AI placeholder copy** in user-facing content.
