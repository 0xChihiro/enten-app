# Built Modules & Policies

This page catalogues the capabilities Enten ships. Each capability is a **module** (the
bounded power against the core) paired with one or more **policies** (the logic that uses it).
A system installs only what it needs. For how these fit together, see
[The Enten Model](protocol-model.md); for how to write your own, see
[Building Modules & Policies](building-modules-and-policies.md).

## Modules

| Keycode | Module | Capability |
|---|---|---|
| `MINTR` | Minter | Mint tokens for a payment (a `Payment` settlement, nothing more) |
| `BRRWR` | Borrower | Open and adjust collateralized borrow positions |
| `BRNER` | Burner | Burn tokens (deflation) and redeem tokens for backing |
| `TRSRY` | Treasury | Deploy treasury assets to a destination and recall them |
| `CAPTR` | Capture | Mint‑and‑capture: mint tokens and run external calls in one settlement |
| `ADMIN` | Admin | Write Kernel state and execute system upgrades on behalf of an admin policy |

### MINTR — Minter

Performs a single `Payment` settlement: mints the requested amount to a buyer and routes
their payment into backing, team, and treasury. It intentionally accepts no caller‑supplied
state updates, so a policy holding mint permission can mint but cannot touch other system
state. Used by every distribution policy.

### BRRWR — Borrower

Manages per‑user positions stored in the Kernel: collateral plus a list of per‑asset debts.
It supports deposit, withdraw, borrow, repay, and the combined deposit‑and‑borrow /
repay‑and‑withdraw flows, and it checks that each position stays collateralized (debt ≤
collateral × backing per token) before settling.

### BRNER — Burner

Two deflationary actions. **Burn** removes tokens from supply with no asset movement (raising
backing per token), and decrements the team‑locked counter when applicable (driving
burn‑to‑vest). **Redeem** burns tokens and returns the holder's pro‑rata backing.

### TRSRY — Treasury

Moves treasury‑bucket assets out to a destination (deploy) and back (recall). It only touches
treasury funds — never backing.

### CAPTR — Capture

Mints tokens and executes external calls within one settlement, so proceeds from selling
those tokens can be turned into backing atomically. Used by the capture AMO.

### ADMIN — Admin

The privileged write path. It can apply Kernel state updates (used to register assets and set
fees) and execute Controller upgrade actions, but only when called by a permitted admin
policy. This is what lets a governance policy like the Gateway administer the system without
holding raw write access itself.

## Policies

| Policy | Uses | Purpose |
|---|---|---|
| Auction | `MINTR` | Continuous Dutch auction selling new tokens above NAV |
| PresaleAuction | `MINTR` | One‑time, single‑asset launch sale with a decaying premium |
| BorrowPolicy | `BRRWR` | User entry points for borrowing against tokens |
| BurnerPolicy | `BRNER` | User entry points for burning and redeeming |
| CaptureAMO | `CAPTR` | Operator AMO that mints, sells, and routes proceeds to backing |
| EntenDeflationHook | `BRNER` | Uniswap v4 hook that taxes and burns the token on trades |
| Gateway | `ADMIN` | Administration: register assets, set fees, run upgrades |
| TreasuryHandler | `TRSRY` | Manage strategies and deploy/recall treasury assets |

### Auction

A continuous Dutch auction. Each epoch opens at a multiple of NAV (up to 3×) and decays
linearly to a 1.1× floor; pricing is grossed up for fees so the backing portion always keeps
NAV non‑decreasing. Buyers take any amount, lots roll over automatically on sellout, and the
next epoch can be started by anyone after the current one ends. Multi‑asset aware. See
[Auctions & Presales](auction-system.md).

### PresaleAuction

A bounded launch sale against exactly one backing asset. Price is the fee‑grossed backing
floor plus a virtual‑reserve premium that decays over the duration. The admin calls `open()`
after backing is seeded to start the clock; buys clear a minimum size.

### BorrowPolicy

The user‑facing surface over the Borrower module: deposit, withdraw, borrow, repay, borrow‑max,
repay‑all, and the combined flows, plus views for limits and positions.

### BurnerPolicy

Simple user entry points to `burn(amount)` and `redeem(amount)` through the Burner module.

### CaptureAMO

An operator policy (role‑gated) that drives the Capture module to mint tokens, sell them on
the market, and place **100% of the proceeds into backing**. It enforces **per‑transaction
and daily limits** so the AMO can't disrupt the market's natural flow.

### EntenDeflationHook

A Uniswap v4 hook (also a policy) that applies a small fee (0.8%) on trades involving the
token and burns it via the Burner module, making every trade accretive to NAV. It must be
deployed to a hook address that encodes its permission flags, and only acts while burning is
enabled and the system isn't paused. See
[Borrowing & Redemption](borrowing-and-redemption.md).

### Gateway

The standard administrative policy. Through it an admin registers backing assets (with their
bootstrap floors), sets the one‑time fee split (bounded to keep backing ≥ 50% of payments),
and executes system upgrades via the Admin module. In production its admin/upgrade roles
should sit behind the **SystemUpgradeTimelock** (a delay‑and‑grace timelock for
`updateSystem` calls).

### TreasuryHandler

Manages the treasury's **strategies**: an allow‑list of approved strategy contracts and which
assets each may receive, with role‑gated deploy and recall. It refuses to remove a strategy
that still holds deployed funds. Strategies themselves live in the
[strategies repository](contracts.md) — including the Uniswap LP auction for protocol‑owned
liquidity, covered in [Treasury & Liquidity](treasury-and-liquidity.md).
