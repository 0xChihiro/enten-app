# Auctions & Presales

Distribution is how new tokens enter circulation. Enten ships two distribution policies — a
continuous **Dutch auction** and a one‑time **presale** — but neither is mandatory. Because
the core only enforces the backing invariant, a team can use either, both, or an entirely
custom mechanism. This page explains the two built‑in options from a participant's view.

## What makes Enten auctions different

- **Always above NAV.** A backing‑per‑token floor means an auction's price can never decay
  below net asset value (plus fees). The last clearing price sits slightly above NAV so the
  backing invariant holds — auctions don't decay toward zero, and they can't fail late in
  the epoch.
- **Not winner‑take‑all.** Buyers don't have to take the whole remaining lot. Anyone can buy
  any amount at the current price, so participants enter at whatever price they're
  comfortable with.
- **Accretive by construction.** Every buy pays in more backing than it dilutes, so each
  purchase pushes backing per token *up* — sometimes nudging the live price up momentarily
  because price is quoted as a multiple of NAV.
- **Multi‑asset aware.** If a system is backed by more than one asset, auction pricing and
  payment automatically span all backing assets. The same mechanics power single‑backed
  tokens and index‑style baskets.

## The Dutch auction

The Dutch auction is a continuous, epoch‑based mechanism.

### How pricing works

At the start of each epoch the price opens at a multiple of NAV (configurable, up to 3×) and
**decays linearly** over the epoch toward a floor of 1.1× NAV. Price is always quoted
relative to current backing per token, then grossed up to cover the protocol fee and the
team/treasury split so that the backing portion of every payment still keeps NAV
non‑decreasing.

Because price tracks NAV, two things happen at once during an epoch: the multiplier decays
with time (price down), while buys raise NAV (price up). The net effect is a market‑driven
clearing price that never falls below the backing floor.

### Buying

1. Read the current epoch and price.
2. Choose how many tokens to buy.
3. Provide a maximum payment per backing asset (your slippage protection).
4. Approve the payment asset(s) to the system's Vault if needed.
5. Submit the buy. The system mints your tokens and routes your payment into backing, team,
   and treasury.

You can also buy the entire remaining lot in one call.

### Epochs and rollovers

Each epoch offers a fixed lot of tokens (bounded by the token's remaining max supply). When
a lot sells out, the next epoch starts immediately. If an epoch ends without selling out,
the next epoch must be started manually — but **anyone** can start it; it is a permissionless
call and requires no purchase. The next epoch's opening price is informed by the previous
round's realized average price, so pricing stays anchored to real demand.

## The presale

The presale is a single‑asset, fixed‑duration sale designed for a launch's opening
distribution.

- **One backing asset.** The presale prices against exactly one backing asset. (Adding a
  second backing asset while a presale is live will halt it — systems should not register
  additional backing assets until the presale concludes.)
- **Floor plus premium.** The price is the fee‑grossed backing floor plus a premium that
  starts high and decays over the sale. The premium uses a virtual‑reserve curve, so larger
  buys move the price more — similar in spirit to a bonding curve.
- **Explicit open.** The sale's clock doesn't start at deployment. An admin calls `open()`
  once backing is seeded and fees are set, which starts the duration and premium decay
  together. This avoids silently burning the premium during setup.
- **Minimum bids.** Buys must clear a configured minimum size (except when buying the final
  remaining amount).

Buying works like the auction: choose an amount (or buy the remaining size), set a maximum
payment as slippage protection, and submit before the deadline.

## Choosing a model

Teams launching with Enten are free to choose:

- the **Dutch auction** for ongoing, fair, price‑discovering distribution;
- the **presale** for a bounded launch event;
- both in sequence (presale to bootstrap, then ongoing auctions);
- or a **custom** policy — bonding curves, standard auctions, or a "fair launch" that routes
  everything into liquidity are all viable, as long as the backing invariant holds.

For integrators wiring these into an interface, see [Integration Notes](integration-notes.md).
