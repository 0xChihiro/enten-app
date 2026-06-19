# Borrowing & Redemption

Because every token is backed, holders can do more than buy and sell. They can borrow
against their tokens, redeem them for their share of backing, and benefit from mechanisms
that burn supply to raise everyone's backing per token. This page covers those flows.

## Borrowing against your tokens

A holder can deposit tokens as collateral and borrow backing assets against them — interest
free.

### How it works

- **Deposit collateral.** You deposit tokens into the system; they're held in the collateral
  bucket and tracked as your position.
- **Borrow up to NAV.** Your borrow limit for each backing asset is your collateral
  multiplied by that asset's backing per token. In other words, you can borrow up to the
  full current backing value of your tokens.
- **Repay and withdraw.** Repay the borrowed assets to free your collateral. You can do
  these in one step (deposit‑and‑borrow, or repay‑and‑withdraw) or separately.

### Why it's safe for the system

The borrow limit is exactly the redemption value of the collateral. The backing you borrow
leaves the redeemable bucket but is still counted as backing (it's owed back and fully
collateralized by your tokens), so **borrowing doesn't change backing per token** for anyone
else. Positions are validated on every change to ensure they remain collateralized.

This makes borrowing a natural way to access liquidity without selling: instead of selling
tokens (and giving up future upside), you borrow their backing value and repay later to
reclaim them.

## Redemption

Redemption is the holder's exit straight to backing. When you redeem, your tokens are burned
and you receive your **pro‑rata share of the backing assets**.

- You get the same backing‑per‑token ratio everyone else has — redemption is fair by
  construction.
- Because both supply and backing fall proportionally (with rounding that always favors the
  system), redemption preserves backing per token for the holders who stay.

Redemption is what gives the token a hard floor: it can always be exchanged for the assets
backing it.

## Deflation: burning to raise NAV

Separately from redemption, tokens can be **burned without taking backing out**. When that
happens, supply falls but backing stays — so backing per token rises for every remaining
holder. Enten ships two ways this happens.

### The trading deflation hook

For systems that pair their token with a Uniswap v4 pool, Enten provides a **deflation hook**
that applies a small fee (0.8%) on trades involving the token and **burns** it. Every trade
therefore slightly increases backing per token. Burns accrued from sells are collected and
finalized on chain. The hook only acts while the system's burn capability is active and the
system isn't paused.

### The capture AMO

The **capture AMO** is an operator capability that lets a system mint new tokens, sell them
on the open market, and route **100% of the proceeds into backing**. It is bounded by
**per‑transaction and daily limits** so it can't disrupt the natural flow of the market. The
net effect is to convert market demand into permanent backing while keeping the backing
invariant intact.

## How deflation feeds team vesting

If a launch reserved team tokens, those tokens vest through **burn‑to‑vest**: each token the
system burns unlocks an equal amount of the team's locked allocation. The mechanisms above —
the deflation hook and other burns — are therefore also what gradually vests the team, tying
team rewards to deflation that benefits all holders. See
[The Enten Model](protocol-model.md) for the accounting.
