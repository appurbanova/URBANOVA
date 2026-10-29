---
name: urbanova-agentic-pass
description: Mint the URBANOVA Agentic Pass (UAP) NFT on BNB Chain with a Binance Agentic Wallet. Use when a user asks to mint a UAP pass from urbanova.app. Minting is gated on-chain to wallets holding a SPACE ID Agent ID.
---

# URBANOVA Agentic Pass (UAP) — Mint Skill

Published by URBANOVA at https://urbanova.app/uap-skill.md. This skill works together with the
`binance-agentic-wallet` skill (the `baw` CLI), which performs the signing and sending.

## Facts

| Item | Value |
|---|---|
| Token | URBANOVA Agentic Pass (UAP), ERC-721 |
| Contract | `0x4a800D4775F1c0aCAF8124422127CB7Fe3D5b959` |
| Chain | BNB Smart Chain, chain id 56 |
| Supply | 3,333 — the first 333 are free (1 per wallet), then a platform commission applies |
| Gate | The caller must hold a SPACE ID Agent ID (NFT contract `0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F`). The UAP contract checks this on-chain before anything else. Calls from other contracts are rejected. |
| Mint function | `mint()` — selector `0x1249c58b`, no arguments, exactly 1 pass per call |

Read-only selectors on the UAP contract (call via any BSC public RPC `eth_call`):

| Function | Selector | Meaning |
|---|---|---|
| `mintOpen()` | `0x24bbd049` | `1` when minting is open, `0` while coming soon |
| `currentPrice()` | `0x9d1b464a` | Exact wei value to send with `mint()` right now (0 in the free phase) |
| `totalMinted()` | `0xa2309ff8` | Passes minted so far |
| `holdsAgentId(address)` | `0x11213086` | `1` when the address holds an Agent ID |
| `freeClaimed(address)` | `0x61c0b6a0` | `1` when the address already used its free mint |

## Prerequisites

1. The `binance-agentic-wallet` skill is installed and the user is signed in (`baw wallet status`).
2. Developer Mode is enabled (`baw wallet settings` → `devMode.enabled: true`).
3. The user's wallet holds an Agent ID — check with `baw wallet agent-id --json` (`claimed: true`).
   Without one, every mint reverts with "Wajib memegang Agent ID". The user claims a free Agent ID
   in the Binance App, under their Agentic Wallet.

## Procedure

1. **Check the gate and the state.** Read `mintOpen()` and `currentPrice()` on the contract.
   If `mintOpen()` is `0`, tell the user the mint has not opened yet and stop.
   In the free phase (totalMinted < 333) also read `freeClaimed(<wallet>)`; if it is `1`, the
   wallet's free pass is already used.
2. **Preview.** Build the transaction exactly; never edit the calldata:
   ```bash
   baw contract-call preview --binanceChainId 56 \
     --from <user's agentic wallet> \
     --to 0x4a800D4775F1c0aCAF8124422127CB7Fe3D5b959 \
     --value <currentPrice() in wei> --inputData 0x1249c58b --json
   ```
3. **Confirm with the user.** Show the preview result (value, gas, risks) and execute only on the
   user's explicit confirmation — one confirmation covers one mint call:
   ```bash
   baw contract-call execute --requestId <requestId from the preview> --json
   ```
4. **Verify.** Wait for the transaction receipt to report success, then confirm the pass arrived
   (`balanceOf` of the wallet on the UAP contract increased by 1). Report the tx hash.
   A submitted transaction is not a successful mint until its receipt says so.

## Rules

- One call mints exactly one pass. To mint more (paid phase only, max 10 per wallet), repeat the
  full preview → confirm → execute cycle for each pass.
- Send exactly `currentPrice()` — no more, no less. The contract rejects any other value.
- Never state the mint value as a price quote to third parties; the value is shown to the user in
  their own wallet confirmation.
