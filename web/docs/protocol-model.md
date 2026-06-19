# The Enten Model

Enten systems are built from a small, fixed **core** and a larger set of replaceable
**capabilities**. The core holds the accounting and upgrade invariants; the capabilities
implement everything a system actually does. This page explains how those pieces fit
together and how backing works.

## The core

Four contracts are deployed with every system and never change for the life of that system.

### Controller

The Controller is the center of the system. Everything flows through it:

- It is the only contract that can write the system's state or move its funds.
- It manages the system's capabilities — installing, upgrading, activating, deactivating,
  and replacing them.
- It runs **settlement**: every meaningful state change (a mint, a redemption, a borrow, a
  treasury movement) is expressed as a settlement and validated by the Controller before it
  takes effect.
- It enforces the backing‑per‑token invariant on every settlement.

The Controller holds a small set of administrative roles (for example, an executor that can
upgrade the system, and a guardian that can pause settlements in an emergency). These roles
are typically held by governance — ideally a timelock — once a system is live.

### Token

The Token is a standard ERC‑20 with two differences: it has a **fixed maximum supply**, and
it can only be minted or burned by the Controller. This guarantees that supply never grows
except through a settlement that satisfies the backing invariant.

### Vault

The Vault holds all of the system's assets and tracks the accounting that defines backing.
It organizes assets into **buckets**, each with a distinct purpose:

- **Backing (redeemable):** assets that stand behind circulating tokens. This bucket can
  never be reduced except by a redemption that burns a proportional amount of tokens — the
  system is structurally prevented from spending its backing.
- **Treasury:** protocol‑controlled assets that can be deployed into strategies or used for
  operations.
- **Team:** the team's share of incoming payments.
- **Borrow:** backing assets currently lent out to borrowers (still counted as backing,
  because they are fully collateralized by tokens).
- **Collateral:** tokens that borrowers have deposited as collateral.

Only the Controller can instruct the Vault to move funds.

### Kernel

The Kernel is the system's unified storage. All system state — balances, configuration,
user positions — lives in the Kernel as named storage slots. Because storage is shared and
separate from logic, the system's capabilities can be upgraded or replaced without
migrating any user state. It works like a standard upgradeable‑contract storage pattern,
but shared across the whole system rather than per contract.

## Backing and NAV

**Backing per token** is the system's net asset value (NAV) for a given backing asset:

```
backing per token = (redeemable backing + borrowed backing) / circulating supply
```

A few details make this precise:

- **Circulating supply** excludes tokens that are still locked for the team, so unvested
  team allocations don't dilute the NAV calculation.
- **Borrowed backing counts as backing.** When someone borrows against their tokens, the
  backing leaves the redeemable bucket but is still owed to the system and remains fully
  collateralized, so it stays in the NAV.
- **Multiple backing assets are supported.** A system can be backed by a basket of assets;
  the invariant is enforced per asset, which naturally supports index‑like or
  multi‑collateral designs.

### The core invariant

Every settlement is checked so that **backing per token does not decrease** for any backing
asset. Before circulating supply exists, a per‑asset **bootstrap floor** is enforced instead
(a minimum backing‑per‑token the very first mint must satisfy), since there is no ratio to
preserve yet.

This single rule is what makes the system's capabilities safe to compose. An auction can
mint new tokens *only* because buyers pay in more backing than they dilute. A borrower can
take backing assets *only* against tokens worth at least as much. A redeemer gets their fair
share and the ratio is preserved for everyone who stays.

## Capabilities: modules and policies

Everything beyond the core is built from two kinds of components.

- **Modules** expose a single bounded capability against the core — for example, "mint
  tokens for a payment," "move treasury assets," or "open and adjust borrow positions."
  A module is the only thing allowed to perform its kind of settlement, and even then only
  when explicitly permitted.
- **Policies** are the user‑facing and operator‑facing logic. They decide *when and how* a
  capability is used and call into modules to do it. An auction, a presale, a borrowing
  front‑end, and a governance gateway are all policies.

The split keeps authority explicit: a policy can only do what its module permits, and a
module can only do what the Controller permits. You can always answer "which contract is
allowed to mint?" by looking at which module holds mint permission and which policies are
allowed to call it.

The capabilities Enten ships are catalogued in
[Built Modules & Policies](enten-built-modules-and-policies.md). The most important ones:

| Capability | Module | Typical policy |
|---|---|---|
| Mint for payment | `MINTR` | Auction, PresaleAuction |
| Borrow against tokens | `BRRWR` | BorrowPolicy |
| Burn & redeem | `BRNER` | BurnerPolicy, deflation hook |
| Treasury movement | `TRSRY` | TreasuryHandler |
| Mint‑and‑capture (AMO) | `CAPTR` | CaptureAMO |
| System administration | `ADMIN` | Gateway |

## Where payments go

When tokens are minted for a payment (for example, an auction buy), the incoming assets are
split:

1. A small **protocol fee** (2.5%) goes to the shared protocol collector.
2. The remainder is split between **backing**, **team**, and **treasury** according to the
   system's configured percentages. The split is bounded so that **at least half of every
   payment goes to backing**, guaranteeing each sale is accretive to NAV.

Because the backing share is always large enough and auction pricing is always above NAV,
every primary sale increases backing per token.

## Team vesting (burn‑to‑vest)

If a launch reserves tokens for the team, those tokens start **locked** and are tracked in
the Kernel. They vest through a **burn‑to‑vest** mechanism: whenever the system burns
circulating tokens (through the deflation hook or other burns), an equal amount of the
team's locked allocation unlocks and becomes claimable. The team's upside is therefore tied
directly to deflation that benefits every holder.

## Extensibility, responsibly

The Controller and Kernel let a system evolve without user migrations. That power comes with
responsibility: modules and policies are trusted components, so only reviewed, trusted code
should ever be installed, and live systems should put upgrades behind a timelock. See
[Building Modules & Policies](building-modules-and-policies.md) for the developer view.
