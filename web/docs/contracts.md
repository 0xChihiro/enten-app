# Contracts & Repositories

The Enten codebase is split across a few repositories. Deployed addresses for each network
live in [Deployment](deployment.md).

## Repositories

- **Enten Core** — [github.com/0xChihiro/v1-core](https://github.com/0xChihiro/v1-core)
  The four core contracts (Kernel, Controller, Vault, Token), the settlement engine
  (Dispatch), supporting contracts (ProtocolCollector, TeamLocker), and the CREATE3
  ControllerFactory used to launch a system.
- **Enten Periphery** — [github.com/0xChihiro/enten-v1-periphery](https://github.com/0xChihiro/enten-v1-periphery)
  The optional capabilities: modules (`MINTR`, `TRSRY`, `BRRWR`, `CAPTR`, `BRNER`, `ADMIN`)
  and policies (Auction, PresaleAuction, BorrowPolicy, BurnerPolicy, CaptureAMO,
  EntenDeflationHook, Gateway, TreasuryHandler) plus the SystemUpgradeTimelock.
- **Enten Strategies (SPM)** — [github.com/0xChihiro/SPM](https://github.com/0xChihiro/SPM)
  Treasury strategies, including the Uniswap LP auction for protocol‑owned liquidity.
- **Enten Frontend** — [github.com/0xChihiro/enten-app](https://github.com/0xChihiro/enten-app)
  The web app and these docs.

## How the repositories relate

The **core** is self‑contained; it knows nothing about any specific capability.
The **periphery** depends on the core's interfaces and implements capabilities as modules and
policies that the core installs. **Strategies** are independent contracts the treasury
deploys into; they depend only on a treasury interface, not on the core internals.

A real system is: one core deployment (via the factory) + whichever periphery modules and
policies the team installs + whichever strategies the team approves.

## Where to read what

| If you want to understand… | Read |
|---|---|
| The big picture | [Overview](overview.md), [The Enten Model](protocol-model.md) |
| Core internals & settlement | [Architecture](architecture.md) |
| Launching a system | [Launching Your Own System](launching-your-own-token.md) |
| Writing a capability | [Building Modules & Policies](building-modules-and-policies.md) |
| The shipped capabilities | [Built Modules & Policies](enten-built-modules-and-policies.md) |

> The verified, deployed contract is always the source of truth for exact signatures and
> behavior. These docs describe intent and flow, not line‑by‑line ABI.
