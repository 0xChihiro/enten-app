# Launching Your Own System

This is the developer guide to launching an Enten system. It covers the canonical launch
path, what you configure, and how to wire up capabilities afterwards. For the contracts
involved, see [Architecture](architecture.md).

## The canonical path: the ControllerFactory

**A true, Enten‑supported system must be launched through the ControllerFactory.** The
factory uses `CREATE3` to deploy the entire core — Kernel, Vault, Token, optional TeamLocker,
and Controller — in a single transaction, at deterministic addresses, fully wired together,
and then validates the result before it returns. This guarantees every Enten system shares
the same trusted core and the same internal wiring.

The Foundry scripts in the repositories are **convenience tooling**, not an alternative core:
they help you set up admin and periphery, and let you simulate and test configurations before
you run them. The system itself is still the factory‑deployed core.

### What the factory does

In one call, `launchController` will:

1. Predict the deterministic addresses for each contract from your deployer address and a
   salt.
2. Deploy the Kernel, Vault, and Token, each pre‑wired to the predicted Controller.
3. If a team allocation is configured, deploy the TeamLocker and record the locked amount in
   the Kernel.
4. Distribute the pre‑mine (unlocked supply to your chosen address, locked supply to the
   TeamLocker).
5. Deploy the Controller with the launch admin and the shared ProtocolCollector.
6. **Validate everything** — that each contract points at the others correctly, that the
   admin holds the expected roles, that locked/pre‑mined balances match the config — and
   revert if any wiring is wrong.

Because addresses are deterministic, you can know your system's addresses before you deploy
by predicting them from your deployer and salt.

### Launch configuration

You provide a launch config and an admin. The config captures the token's identity and
initial distribution:

| Field | Meaning |
|---|---|
| `tokenName`, `tokenSymbol` | ERC‑20 identity |
| `maxSupply` | The hard cap on total supply |
| `preMineAmount` | Total tokens minted at launch (team + non‑team) |
| `teamTokenAmount` | Portion of the pre‑mine locked in the TeamLocker (burn‑to‑vest) |
| `preMineAddress` | Recipient of the non‑team (unlocked) pre‑mine |

`teamTokenAmount` must not exceed `preMineAmount`, which must not exceed `maxSupply`. A launch
can have no pre‑mine at all (distribution entirely via auctions), an unlocked pre‑mine, a
team‑locked pre‑mine, or a mix.

The **admin** you pass receives the Controller's `DEFAULT_ADMIN`, `EXECUTOR`,
`MINT_PERMISSION`, and `GUARDIAN` roles (and the TeamLocker's admin/claimer roles if a team
allocation exists). This is your starting point for setup — and what you'll later hand to
governance.

## After launch: wiring capabilities

A freshly launched system is just the core: it can hold state and enforce invariants, but it
has no capabilities yet. You add them through an **administrative policy** — Enten's
**Gateway** is the standard one.

### 1. Stand up an admin policy

Install the `ADMIN` module and activate the **Gateway** policy. The Gateway is how you'll
register backing assets, set the fee split, and execute further upgrades. To let it act, your
launch admin grants the Gateway `EXECUTOR_ROLE` on the Controller. (Enten provides this
Gateway; you can also use your own admin policy with the same shape.)

### 2. Set the fee split (once)

Through the Gateway, set how each payment is divided after the protocol fee, across
**backing**, **team**, and **treasury**. The split is one‑time and bounded so that at least
half of every payment reaches backing. This must be set before any priced sale.

### 3. Register backing assets (for a backed token)

For a backed token, register each backing asset through the Gateway. Registration records the
asset and its **bootstrap floor** — a minimum backing‑per‑token enforced on the first mint.

A few hazards to respect:

- **The floor is decimals‑explicit.** It is expressed as `asset_wei * 1e27 / token_wei`. For
  a 1:1 floor of a 6‑decimal asset (like USDC) backing an 18‑decimal token, that's `1e15`,
  *not* `1e27`. The wrong scale either bricks the first seed mint or sets a near‑zero floor.
- **One backing asset during a presale.** The presale requires exactly one backing asset and
  auction pricing requires every registered asset to be seeded; adding a second backing asset
  while a sale is live will halt pricing. Add more assets only after the sale concludes, and
  seed them with backing in the same operation.

### 4. Install distribution and other capabilities

Install the modules and activate the policies your system needs — for example the `MINTR`
module with the Auction or PresaleAuction policy, the `BRRWR` module with BorrowPolicy, the
`BRNER` module with BurnerPolicy and the deflation hook, the `TRSRY` module with
TreasuryHandler, and the `CAPTR` module with CaptureAMO. Each policy declares its module
dependencies and the exact function permissions it needs; the Controller grants those at
activation.

For any **minting** policy (auctions, presales, the AMO), remember the second gate: the
backing module that mints must be granted **mint permission** via the `MINT_PERMISSION_ROLE`,
in addition to the policy holding the module's function permission.

### 5. Seed backing and bootstrap supply

For a backed launch you generally want a small genesis seed so pricing works:

- Seed backing by transferring the asset to the Vault and syncing it into the backing bucket
  (requires the `CREDITOR_ROLE`), or by using the ProtocolCollector.
- Mind the **bootstrap relationship**: the on‑chain floor only binds while *circulating*
  supply (total minus team‑locked) is zero. There are two clean shapes:
  - **(A) Small unlocked genesis + seeded backing.** Pre‑mine a small unlocked amount and
    team‑lock the rest, then seed backing at the correct ratio. Circulating supply is
    positive from genesis, so the floor becomes documentation rather than on‑chain
    enforcement — you must seed the right ratio yourself. (This is the common pattern.)
  - **(B) Fully team‑locked genesis + a dedicated bootstrap mint.** Keep circulating supply
    at zero so the floor binds on the first seed mint, performed by a one‑shot bootstrap
    path. This enforces the floor on‑chain at the cost of an extra component.

A presale cannot be its own bootstrap mint, because it needs positive circulating supply to
price — so seed first, then `open()` the sale.

### 6. Hand control to governance

While setting up, control sits with your launch admin (an EOA is fine for setup and testing).
Before going live with real funds you should move administrative control — the Gateway's
admin and upgrade roles — to a **timelock** (Enten ships a `SystemUpgradeTimelock` with a
delay and grace period) and renounce the EOA. Upgrades on a live system should always be
delayed and cancellable.

## Backed vs. unbacked launches

- **Unbacked:** skip backing‑asset registration. The bootstrap floor is for backed launches;
  unbacked tokens distribute without a backing ratio to preserve.
- **Backed:** register backing assets, set the fee split with a healthy backing share, seed
  genesis backing, and use distribution policies whose payments accrue to backing.

## Things to get right

- **Use the factory.** It is the only way to a genuine Enten core, and its post‑deploy checks
  catch wiring mistakes for you.
- **Only non‑standard‑free assets as backing.** Fee‑on‑transfer and rebasing tokens break the
  Vault's accounting and must not be used as backing assets.
- **Trusted code only.** Modules and policies are trusted; a malicious or buggy one can
  damage the system. Review everything you install and timelock upgrades.
- **Avoid storage collisions.** Storage is unified in the Kernel. New components must use
  collision‑resistant named slots and must not overwrite slots owned by others. The core's
  slots library is the pattern to follow.
- **Simulate first.** Use the Foundry scripts to dry‑run your asset registration, fee setup,
  permissions, and seed mint before executing on mainnet. See [Deployment](deployment.md).
