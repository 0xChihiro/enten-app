# Glossary

Key terms used throughout the Enten documentation.

**Backing** — Assets held in the Vault that stand behind circulating tokens. Reserved for
holders; never spent except through redemption or fully collateralized borrows.

**Backing per token (NAV)** — The net asset value of one token: redeemable plus borrowed
backing divided by circulating supply. The core invariant is that this can never decrease as
a result of a system action.

**Bootstrap floor** — A per‑asset minimum backing‑per‑token enforced on the very first mint,
before any circulating supply exists and a ratio can be preserved.

**Bucket** — A category the Vault uses to organize assets: backing (redeemable), treasury,
team, borrow, and collateral.

**Capability** — A unit of system behavior, implemented as a module plus the policies that
use it.

**Capture AMO** — An operator capability that mints tokens, sells them on the market, and
routes 100% of proceeds into backing, bounded by per‑transaction and daily limits.

**Circulating supply** — Total token supply minus tokens still locked for the team. Used in
the NAV calculation.

**Controller** — The system's coordination and settlement hub; the only contract that can
write state or move funds, and the manager of all upgrades.

**Deflation hook** — A Uniswap v4 hook that taxes trades involving the token and burns the
tax, raising backing per token.

**Gateway** — The administrative policy used to register backing assets, set the fee split,
and execute system upgrades.

**Kernel** — The system's unified storage layer. State lives here as named slots so
capabilities can be upgraded without user migrations.

**Keycode** — A five‑letter identifier (A–Z) for a module or policy, e.g. `MINTR`, `TRSRY`,
`BRRWR`.

**Module** — A component that exposes one bounded capability against the core and is the only
thing allowed to perform its kind of settlement.

**Policy** — User‑ or operator‑facing logic that decides when and how a capability is used,
calling into modules to act.

**Protocol collector** — The shared contract that receives the protocol fee taken from
primary sales.

**Redemption** — Burning tokens to receive a pro‑rata share of backing assets. Preserves
backing per token for remaining holders.

**Settlement** — The unit of state change the Controller validates and applies (mint,
redeem, borrow, repay, deploy, recall, burn, and more). The backing invariant is checked on
every settlement.

**Strategy** — A contract the treasury deploys assets into to earn yield or build
protocol‑owned liquidity.

**Team locker / burn‑to‑vest** — The mechanism by which reserved team tokens vest: each token
the system burns unlocks an equal amount of the team's locked allocation.

**Token** — The system's capped ERC‑20, mintable and burnable only by the Controller.

**Treasury** — Protocol‑controlled working capital, separate from backing, that can be
deployed into strategies.

**Vault** — The accounting layer that holds assets and tracks backing.
