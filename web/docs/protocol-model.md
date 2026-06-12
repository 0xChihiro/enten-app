# The Enten Model

Enten systems are built around a small set of core contracts and a larger set of replaceable modules and policies. The goal is to give teams a complete launch and operations framework without forcing every system to share the same distribution, treasury, or market design.

## Core contracts

- **Token** is the ERC-20 asset representing the system.
- **Vault** holds accounting responsibility for backing, treasury assets, redemptions, borrows, and strategy movements.
- **Kernel** is the shared storage layer for the system.
- **Controller** coordinates module and policy activation, deactivation, replacement, and upgrade flow.

## Modules and policies

Modules expose bounded capabilities. Policies use those capabilities to implement higher-level system behavior. This separation keeps authority explicit and makes it easier to reason about which contracts can mint, burn, borrow, move treasury assets, or capture value.

Examples include:

- **MINTR** for controlled minting.
- **BURNR** for controlled burning.
- **TRSRY** for treasury movement.
- **BRRWR** for borrowing.
- **CAPTR** for capture and AMO-style behavior.

## Accounting model

The Vault is responsible for the accounting rules that define system backing. A key invariant is that backing per token should not decrease through system actions. Auction pricing, redemptions, borrowing, and strategy movement should be designed around that invariant.

## Extensibility

The Controller and Kernel allow a system to evolve without asking users to migrate to an entirely new token or storage layout. That extensibility is powerful, but it should be paired with clear permissions, public deployment addresses, and documented module behavior.
