# Architecture

This page is the developer's mental model of an Enten system: the four core contracts, how
state and funds are organized, and how the settlement engine turns capability requests into
validated state changes. It is intentionally narrative — for exact signatures, read the
verified source in the [repositories](contracts.md).

## The shape of a system

```
                         ┌───────────────┐
        roles ──────────▶│  Controller   │  installs/upgrades modules,
                         │  (+ Dispatch) │  activates/deactivates policies,
                         │               │  runs settle(), enforces invariant
                         └──┬────┬────┬───┘
            writes state    │    │    │   moves funds
                  ┌─────────┘    │    └─────────┐
                  ▼              ▼              ▼
            ┌──────────┐   ┌──────────┐   ┌──────────┐
            │  Kernel  │   │  Token   │   │  Vault   │
            │ (storage)│   │ (ERC-20) │   │ (assets) │
            └──────────┘   └──────────┘   └────┬─────┘
                  ▲                            │ reads/writes balances
                  └────────────────────────────┘  (as the accounting writer)

   Modules  ── expose bounded capabilities, call Controller.settle()
   Policies ── call modules; hold permissions granted at activation
```

The design lineage is the "Default" framework (Kernel / modules / policies), adapted so that
the Kernel is pure storage and a dedicated Controller owns settlement and the backing
invariant.

## Core contracts

### Kernel — unified storage

The Kernel stores all system state as raw storage slots and exposes generic read/write
primitives:

- **Write** arbitrary slots — restricted to the Controller.
- **Add / subtract** numeric slots with overflow/underflow checks — restricted to the
  Controller and the Vault (the "accounting writer").
- **Read** single slots, contiguous ranges, or slot lists.

Slots are **namespaced** by hashing a human‑readable label (e.g. `enten.vault.backing.amount`)
and, where per‑asset or per‑user, combined with the address. Keeping state in one shared
layer is what lets modules and policies be replaced without migrating user data.

### Controller (+ Dispatch) — coordination and settlement

The Controller is two things in one contract:

- **Registry / upgrade manager.** It tracks installed modules by keycode, the set of active
  policies, the module↔policy permission matrix, and each policy's declared dependencies. An
  executor drives changes through four actions: install module, upgrade module, activate
  policy, deactivate policy. Activation captures a policy's dependencies and permission
  requests for deterministic cleanup on deactivation.
- **Settlement engine (Dispatch).** It exposes `settle()`, the single entry point through
  which modules enact state changes, and it enforces the backing invariant.

Key roles:

| Role | Capability |
|---|---|
| `DEFAULT_ADMIN_ROLE` | Manage role assignments |
| `EXECUTOR_ROLE` | Install/upgrade modules, activate/deactivate policies |
| `MINT_PERMISSION_ROLE` | Grant or revoke a module's mint permission |
| `CREDITOR_ROLE` | Move assets between non‑backing buckets; sync surplus |
| `GUARDIAN_ROLE` | Pause settlements; disable a module |

### Token — capped, controller‑minted ERC‑20

A standard ERC‑20 with an immutable max supply. `mint` and `burnFrom` are restricted to the
Controller, so supply only changes inside a validated settlement. An optional pre‑mine is
distributed at launch.

### Vault — assets and bucket accounting

The Vault custodies every asset and records balances per bucket in the Kernel:

| Bucket | Meaning |
|---|---|
| `Redeem` | Redeemable backing (reserved for holders; can't be lowered except by redemption) |
| `Borrow` | Backing currently lent to borrowers (still counts as backing) |
| `Treasury` | Protocol working capital |
| `Team` | Team's accrued share |
| `Collateral` | Tokens deposited as borrow collateral |

The Vault performs ERC‑20 transfers and the matching Kernel add/sub calls together, and it
validates that on‑chain balances never fall below accounted balances. It refuses to lower the
backing bucket through ordinary credits and refuses to sync the system token as surplus.

## Settlement

A **settlement** is a typed request a module submits to `Controller.settle()`. Each one
carries a payer, an amount, a transition type, and optional receipts (asset/amount pairs),
state updates, and external calls. The transition types:

| Transition | Effect |
|---|---|
| `Payment` | Mint tokens to the payer; route payment into backing/team/treasury (requires mint permission) |
| `Redeem` | Burn tokens; send pro‑rata backing to the payer |
| `Borrow` / `Repay` | Move backing out to / back from a borrower |
| `Deposit` / `Withdraw` | Move token collateral in / out |
| `Deploy` / `Recall` | Move treasury assets out to / back from a strategy |
| `Burn` | Burn tokens with no asset movement (deflation) |
| `StateUpdate` | Write Kernel slots only (no transfers) |
| `ExternalCall` | Call an external target (used by AMO‑style flows) |

### The settlement lifecycle

1. A module (the `msg.sender`) calls `settle()` with one or more settlements. The Controller
   confirms the caller is an installed, enabled module and that settlements aren't paused.
2. It snapshots **circulating supply** and **per‑asset backing** (redeem + borrow).
3. For each settlement it builds the necessary Vault transfers, bucket credits, and Kernel
   state updates, applies them, and (for `Payment`) mints, or (for `Redeem`/`Burn`) burns.
4. It re‑snapshots supply and backing and checks the **invariant**: backing per token must
   not decrease for any asset (or, while circulating supply is zero, each asset must satisfy
   its bootstrap floor).
5. It validates Vault solvency for all assets.

If any check fails, the whole settlement reverts. This is the safety net that lets arbitrary
capabilities compose: no matter what a module does, it cannot leave the system diluted or
insolvent.

### Permissions

Two gates protect settlement:

- A module's functions are `permissioned`: callable only by an **active policy** that the
  Controller has granted the specific function selector on that module's keycode.
- Minting additionally requires the module to hold **mint permission** (granted via the
  `MINT_PERMISSION_ROLE`).

So a successful mint requires: an active policy → calling a permitted module function → on a
module that holds mint permission → producing a settlement that preserves the invariant.

## Supporting contracts

- **ProtocolCollector** — receives the protocol fee from payments and can push collected
  assets into a system's backing or treasury via the Controller's creditor role.
- **TeamLocker** — holds reserved team tokens and releases them on a burn‑to‑vest schedule:
  the claimable amount grows as the Kernel's locked‑token counter is decremented by burns.
- **ControllerFactory** + **CreationCodeStore** — deploy a complete, pre‑wired system
  deterministically. See [Launching Your Own System](launching-your-own-token.md).

## Design properties to keep in mind

- **One writer.** Only the Controller writes arbitrary state and only it (plus the Vault for
  arithmetic) touches the Kernel. Everything else goes through settlement.
- **Trusted extensions.** Modules and policies are trusted. Installing one grants real
  authority, so review and timelocks matter (see
  [Building Modules & Policies](building-modules-and-policies.md)).
- **Shared storage discipline.** Because storage is unified, new components must use
  collision‑resistant named slots and must not overwrite slots owned by other components.
