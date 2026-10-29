# URBANOVA

<p align="center">
  <strong>A living digital city for builders.</strong><br/>
  <sub>Your work is already a city.</sub>
</p>

<p align="center">
  <a href="https://urbanova.app">urbanova.app</a> · <a href="https://github.com/appurbanova/URBANOVA">Source</a> · <a href="#roadmap">Roadmap</a> · <a href="#architecture">Architecture</a>
</p>

---

URBANOVA turns public builder activity into a living digital city where you can explore projects, signals, communities, and ideas. Instead of a chronological feed, your releases, writing, and conversations become explorable districts with readable shape and health.

A map, not a feed.

## What's live

The first product surface is a frontend-first demo so the core experience works without a database or account provisioning. It is deployed to GitHub Pages at **urbanova.app**.

| Surface | Status | Description |
| --- | --- | --- |
| Landing page | Shipped | Hero, district cards, activity ticker, and CTA at `urbanova.app` |
| Interactive 3D city demo | Shipped | Walkable abstract city model with four live districts |
| GitHub public signal integration | Shipped | Reads public GitHub profiles to shape the visual preview |
| City health model | Shipped | A readable 0-100 health score for your city |
| Email access gate | Shipped | Supabase email auth to enter the preview |
| Wallet-ready access | Shipped | Detects browser providers and requests a real connection |
| Command center (dashboard) | Shipped | Private dashboard with city health, active districts, and signals |
| Product education pages | Shipped | About, How it works, Roadmap, Community |
| Legal center | Shipped | Privacy, Terms, Cookies, and local-storage controls |
| URBANOVA Agentic Pass (NFT) | Shipped | ERC-721 on BNB Chain for Binance Agentic Wallets; mint gated on-chain by SPACE ID Agent ID; mint is live |

## URBANOVA Agentic Pass

The city's first collectible: an ERC-721 pass on BNB Chain, minted **only by Binance Agentic Wallets holding a SPACE ID Agent ID** — the gate is enforced on-chain by the contract itself, in the same pattern as NOMIO.

| Item | Value |
| --- | --- |
| Contract | `0x4a800D4775F1c0aCAF8124422127CB7Fe3D5b959` (BNB Smart Chain, chain id 56) |
| Supply | 3,333 — the first 333 are free (1 per wallet); the rest carry a platform commission only |
| Mint model | Agent-driven: `mint()` (calldata `0x1249c58b`), value read from `currentPrice()`; no wallet connection on the website |
| Gate | Caller must hold a SPACE ID Agent ID (`0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`); contract callers are rejected |
| Agent skill | [urbanova.app/uap-skill.md](https://urbanova.app/uap-skill.md) — machine-readable mint instructions for agents |
| Metadata | `https://urbanova.app/metadata/<tokenId>` |
| Status | Deployed and verified; **mint is open** — free phase first (333 passes, 1 per wallet) |
| Source | [`contracts/UrbanovaAgenticPassV2.sol`](./contracts/UrbanovaAgenticPassV2.sol) in this repo |

### Districts

The city is organized into four districts, each representing a layer of your public work:

- **Signal Quarter** — communication. Public conversations, notes, and open decisions become light along the east edge.
- **Workshop Row** — building. Repositories, releases, and shipped work shape this district.
- **Commons** — community. A shared civic layer for the people who use, test, and extend your work in the open.
- **Archive Heights** — memory. Past experiments remain visible. A city should remember what it learned, not just what it launched.

## Roadmap

Building the city in public. A monthly view of the places, tools, and rituals coming online next.

| Month | Milestone | Status |
| --- | --- | --- |
| AUG 2026 | **Foundations Live** — landing page, 3D city demo, GitHub signal integration, city health model, URBANOVA Agentic Pass contract live on BNB Chain | Shipped |
| SEP 2026 | **Games & Playable Districts** — playable mini-games inside districts, reward-earning quests tied to builder activity, gamified signals | In the works |
| OCT 2026 | **Onchain & Wallet Access** — full on-chain layer, wallet login, NFT-gated district customization, on-chain city ownership records, multi-source activity feeds, cross-district navigation | In the works |
| NOV 2026 | **Exchange & Civic Layer** — URBANOVA Exchange with deeper DEX integration, token trading pairs, liquidity features, civic context layer, NFT marketplace | In the works |
| DEC 2026 | **Mobile & Year in Review** — mobile app beta (App Store + Google Play), builder API for reading and embedding city data, annual city health reports, mint calendar | In the works |

Progress: 1 of 5 live. The roadmap is a conversation — we build in the open and adjust when the city tells us something we did not expect.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full repository layout, package responsibilities, data flow, and the architecture planned for each unfinished roadmap milestone.

## Stack

- **Monorepo:** pnpm workspaces, Node.js 24, TypeScript 5.9
- **Frontend:** React 19, Vite 7, Tailwind CSS 4, Framer Motion, Three.js, wouter
- **UI:** Radix UI primitives, lucide-react icons, custom design system
- **Backend (reserved):** Express 5 API server, PostgreSQL + Drizzle ORM
- **Validation:** Zod (`zod/v4`), `drizzle-zod`
- **API codegen:** Orval (from OpenAPI spec)
- **Build:** esbuild (CJS bundle)
- **Auth:** Supabase (email/password)
- **Deploy:** GitHub Pages via GitHub Actions

## Getting started

```bash
# Install dependencies (pnpm required)
pnpm install

# Run the frontend dev server
pnpm --filter @workspace/urbanova run dev

# Run the API server (reserved for future server-backed features)
pnpm --filter @workspace/api-server run dev

# Full typecheck across all packages
pnpm run typecheck

# Build everything (typecheck + build all packages)
pnpm run build

# Regenerate API hooks and Zod schemas from the OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push
```

### Required environment

- `DATABASE_URL` — Postgres connection string (for the reserved API server)
- `VITE_SUPABASE_URL` — Supabase project URL (frontend auth)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (frontend auth)

## Project structure

```
URBANOVA/
├── artifacts/
│   ├── urbanova/          # Frontend app (React + Vite) — the live product
│   ├── api-server/        # Express API server (reserved for future features)
│   └── mockup-sandbox/    # Design and prototype sandbox
├── lib/
│   ├── api-spec/          # OpenAPI contract source of truth
│   ├── api-client-react/  # Generated React Query hooks (Orval)
│   ├── api-zod/           # Generated Zod schemas (Orval)
│   └── db/                # Drizzle ORM schema and migrations
├── scripts/               # Workspace tooling and helpers
├── .github/workflows/     # CI/CD (GitHub Pages deploy)
├── contracts/             # URBANOVA Agentic Pass contract source (deployed on BNB Chain)
├── package.json           # Workspace root
├── pnpm-workspace.yaml    # Workspace + catalog config
├── tsconfig.base.json     # Shared TypeScript config
└── replit.md              # Operating notes
```

## Design principles

- **Frontend-first.** The core experience works without a database or account provisioning. Demo sessions and preferences use browser localStorage so the preview is usable while keeping the access gate explicit.
- **Wallet-aware.** Wallet access detects browser providers and requests a real connection when available, with a clear recovery message when not installed.
- **Mobile first, product-studio quality.** Every surface is built mobile-first with meticulous attention to detail.
- **No vanity metrics.** No productivity theatre. Just a thoughtful surface for the work, people, and ideas you have chosen to make visible.
- **Original branding.** URBANOVA uses original branding and copy, referencing the public GitHub City concept only as a high-level metaphor for a developer activity city.

## Community

Join the URBANOVA community across X, Telegram, and Discord. Connect with builders shaping a living digital city from public work.

## License

MIT
