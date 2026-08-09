# URBANOVA Mini Games — Architecture & Roadmap Alignment

## Purpose

Mini games are playable lessons in how URBANOVA reads public work. Each game maps to a real URBANOVA district, shares the same colors and vocabulary as the main map, and ships alongside the roadmap month that introduces its district.

This document defines the architecture and roadmap alignment for the Mini Games page at `urbanova.app/mini-games`. It is a design and planning reference, not a shipping implementation. Game logic is mocked.

## Design system

Mini games reuse the URBANOVA visual system with no divergence:

- **Fonts**: Manrope (body), Space Grotesk (display), DM Mono (labels)
- **Colors**: primary `#f4b94e` (amber), secondary `#4bb5a9` (teal), dark navy background `hsl(228 28% 9%)`
- **Components**: shared `SiteHeader`, `Footer`, `Logo`, `SectionLabel` from the main app
- **Motion**: `animate-rise`, `shimmer-text`, `animate-pulse-soft`, `animate-gradient-drift` from the main CSS

## District binding

Each game is bound to one of the four URBANOVA districts. A game cannot go live before its district is readable on the main map.

| District | Label | Color | Games |
|---|---|---|---|
| Signal Quarter | communication | `#f4b94e` | Signal Rush |
| Workshop Row | building | `#4bb5a9` | District Builder |
| Commons | shared spaces | `#4bb5a9` | Wayfinder, Civic Signal |
| Archive | memory | `#f4b94e` | Night Reader |

## Architecture layers

1. **Signal layer** — Game state and scores live in the browser first, matching the frontend-first demo principle. No account needed to play.
2. **City binding** — Each game maps to a real URBANOVA district so play reinforces the same mental model the map uses.
3. **Mint path** — High scores and district milestones are designed to become mintable city NFTs once the November marketplace goes live.
4. **Roadmap sync** — Games ship alongside the district they teach. A game only goes live after its district is readable on the main map.

## Roadmap alignment

| Month | Roadmap milestone | Game status |
|---|---|---|
| AUG 2026 | Foundations (shipped) | none yet |
| SEP 2026 | Districts (shipped) | Signal Rush + District Builder go live |
| OCT 2026 | Wayfinding (in the works) | Wayfinder enters preview |
| NOV 2026 | Civic layer (in the works) | Civic Signal + score minting |
| DEC 2026 | Night mode (in the works) | Night Reader goes live |

## Game lineup

### Signal Rush (live)
A reflex game where public signals stream across the Signal Quarter. Tap the lit windows before they dim.

### District Builder (live)
A spatial puzzle that mirrors Workshop Row. Arrange falling blocks into districts that match real repository shapes.

### Wayfinder (coming soon)
A route puzzle set on the city grid. Find the cleanest path between two lit signals. Ties into October wayfinding.

### Civic Signal (planned)
A matching game for the civic layer. Route context notes to the district they belong to. Preview of November civic layer.

### Night Reader (planned)
A slow observation game tied to December night mode. Identify what stayed lit across the year.

## Status

This is a mockup. Game interactions are illustrative and not wired to live game logic. The page is ready for review and branding alignment before implementation begins.
