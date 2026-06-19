# Integration Notes

This page is for developers integrating with a live Enten system — building an interface,
a router, a bot, or another protocol on top. The guiding principle: start from contract
boundaries. For each action, know which system you're integrating, which contracts you call,
which assets move, and which invariants must still hold afterwards.

## Ground rules

- **Use verified addresses** for the target network (see [Deployment](deployment.md)).
- **Read state from contracts**, not from product copy. The deployed, verified contract is
  the source of truth.
- **Document every approval's spender** — usually the Vault (payments, redemptions) or a
  policy (actions it mediates).
- **Preserve the backing assumptions.** Any action you compose must leave backing per token
  non‑decreasing; the core will revert otherwise, so handle that case.
- **Treat module and policy authority as part of your surface.** Which policy is active and
  what it's permitted to do is part of what you're integrating against.

## Reading system state

The Vault exposes current bucket balances (backing, treasury, team, borrow, collateral) and
the registered backing assets. The Controller exposes the active policies, installed modules,
the permission matrix, and pause/disable flags. Backing per token can be derived from backing
balances and circulating supply (total supply minus team‑locked). Prefer these on‑chain reads
over caching values that move.

## Distribution integrations

Before preparing a buy against an auction or presale:

- Read the **current epoch/round** and **price**, the **remaining lot/size**, and the
  **timing** (start, period/duration, deadline behavior).
- Compute payment from the current price and pass a **maximum payment** (per backing asset
  for the multi‑asset auction) as slippage protection.
- Ensure the payment asset(s) are **approved to the Vault**.
- For the auction, support the permissionless **next‑round start** once an epoch ends or sells
  out; simulate the call before submitting.

## Borrowing, redemption, and treasury integrations

- **Borrowing/redemption** flows go through their policies; read a user's position and limits
  from the borrow policy, and remember borrow limits track backing per token.
- **Treasury/strategy** flows are role‑gated operator actions, not user actions — integrate
  them as privileged operations and respect the strategy allow‑list.

## Router and swap integrations

Make the execution contract explicit. If a route depends on an external router, a universal
router, Permit2, or a custom routing contract, document the **approved spender, input asset,
output asset, and minimum‑output** assumptions. What matters is that the route preserves the
expected accounting and delivers output to the intended receiver — not whether it's single‑
or multi‑hop. See [Routing & Swaps](portal-swaps.md).

## Expectations

Integrators should not rely on UI copy as truth. The source of truth is the deployed contract
interface, the verified address, and the documented system invariant. When in doubt, simulate
the call and confirm the post‑state.
