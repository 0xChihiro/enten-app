# Enten Documentation

Enten is a launchpad and framework for deploying complete, modular, NAV‑backed token
systems in a single transaction. A launch ships with a hardened accounting and upgrade
core, and an optional library of capabilities — auctions, presales, borrowing,
redemption, deflation, treasury strategies — that teams switch on as they need them.

These docs come in two tracks.

## User documentation

For anyone who wants to understand the system as a whole — what Enten is, how value
flows through it, and how to interact with a live system.

- [Overview](overview.md) — what Enten is and why it exists.
- [The Enten Model](protocol-model.md) — the core contracts, backing, and how the pieces fit.
- [Auctions & Presales](auction-system.md) — how new tokens are distributed.
- [Borrowing & Redemption](borrowing-and-redemption.md) — borrowing against your tokens, redeeming for backing, and the deflation mechanisms.
- [Treasury & Liquidity](treasury-and-liquidity.md) — how systems manage treasury assets and build protocol‑owned liquidity.
- [Routing & Swaps](portal-swaps.md) — how asset movement works in the app.
- [Accounts & Permissions](wallet-connection.md) — who can call what.
- [Glossary](glossary.md) — key terms in one place.

## Developer documentation

For teams who want to launch and build their own Enten system.

- [Architecture](architecture.md) — the Kernel, Controller, Vault, Token, and the settlement engine.
- [Contracts & Repositories](contracts.md) — where the code lives.
- [Launching Your Own System](launching-your-own-token.md) — the canonical factory launch flow.
- [Building Modules & Policies](building-modules-and-policies.md) — extend a system with new capabilities.
- [Built Modules & Policies](enten-built-modules-and-policies.md) — the capabilities Enten ships.
- [Deployment](deployment.md) — process, tooling, and public addresses.
- [Integration Notes](integration-notes.md) — integrating with a live system.

> These docs describe the public smart contracts, system components, invariants, and
> integration rules. The source of truth for exact function signatures is always the
> deployed, verified contract — the developer track is intentionally narrative and points
> you to the code for signatures.
