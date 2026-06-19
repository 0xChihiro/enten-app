# Overview

Enten is a launchpad for **complete token systems**. Instead of shipping just an ERC‑20
and leaving every team to rebuild the same accounting, distribution, treasury, and upgrade
machinery from scratch, Enten launches the whole system on day one — and lets it evolve
afterwards without asking holders to migrate.

The goal is to keep the values this space was built on — fair distribution, transparent
backing, credible neutrality — while giving teams the flexibility modern protocols need.
No one knows what the future holds, so Enten gives you the tools to adapt to it.

## What you get at launch

Every Enten system is launched with four core contracts that hold the system's accounting
and upgrade invariants:

1. **Controller** — the coordination and settlement hub. It installs and upgrades the
   system's capabilities, routes every state change, and enforces the rules that keep the
   system solvent. New tokens can only be minted through it, and only when the system's
   backing grows to support them.
2. **Token** — the system's ERC‑20. It has a fixed maximum supply and can only be minted
   or burned by the Controller.
3. **Vault** — the accounting layer. It holds the system's assets, tracks how much backing
   stands behind each token, and moves funds during redemptions, borrows, and treasury
   operations.
4. **Kernel** — unified storage for the entire system. Because state lives in one shared
   layer, modules and policies can be upgraded or replaced without forcing users to move to
   a new token or storage layout.

On top of that core, a system can switch on optional **capabilities** — Dutch auctions,
presales, borrowing, redemption, on‑chain deflation, treasury strategies, and more — each
implemented as a self‑contained, permissioned component.

## The one invariant that matters

**Backing per token can never decrease as a result of a system action.**

Backing per token is the system's net asset value (NAV): the assets held in the Vault on
behalf of holders, divided by the circulating supply. Every action the system performs —
minting, selling at auction, borrowing, redeeming, routing treasury funds — is checked
against this invariant and reverts if it would dilute holders. This is what makes Enten
tokens *backed* rather than merely *capped*: the floor under the token can only rise.

See [The Enten Model](protocol-model.md) for how this works in detail.

## How a system stays adaptable

- **Capabilities hold bounded authority.** Minting, burning, borrowing, treasury movement,
  and capture are split into separate components instead of being concentrated in one
  contract. Each is granted only the narrow permissions it needs.
- **The Controller coordinates upgrades.** A system can add, remove, or replace
  capabilities over time through a controlled, auditable process — typically behind a
  timelock once the system is live.
- **The Kernel keeps state unified.** Upgrades change behavior, not storage, so holders
  never have to migrate.

## The launch model

An Enten launch starts with the core token, accounting, upgrade, and permission structure
already in place. Teams then choose the distribution model, treasury strategy, and market
mechanics that fit their system.

The default Dutch‑auction distribution is *one* path, not the only one. Because the core
only enforces the backing invariant, teams can use bonding curves, presales, fair launches,
or fully custom mechanics — all while inheriting the same accounting and permission rules.

## Where to go next

- New to the system? Read [The Enten Model](protocol-model.md).
- Want to participate? See [Auctions & Presales](auction-system.md) and
  [Borrowing & Redemption](borrowing-and-redemption.md).
- Launching your own? Jump to [Launching Your Own System](launching-your-own-token.md).
