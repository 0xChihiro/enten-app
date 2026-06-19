# Treasury & Liquidity

Backing assets stand behind the token and are never spent. But systems also accumulate a
**treasury** — a separate pool of protocol‑controlled assets — that can be put to work. This
page explains how the treasury operates and how Enten systems build protocol‑owned
liquidity.

## Treasury vs. backing

It's important to keep two pools distinct:

- **Backing** is reserved for holders. It can only leave the system through redemption (which
  burns a proportional amount of tokens) or be lent out as fully collateralized borrows. It
  is never deployed at risk.
- **Treasury** is the protocol's working capital. A configurable share of every primary sale
  accrues to the treasury, and it can be deployed into strategies, used for operations, or
  recalled — none of which touches backing.

This separation means a system can pursue yield or liquidity strategies with its treasury
without ever putting holders' backing at risk.

## Strategies

The treasury is put to work through **strategies**. A strategy is a contract the system
deploys treasury assets into and later recalls them from. The system's treasury handler:

- maintains an allow‑list of approved strategies and which assets each may receive;
- deploys specific assets into a strategy and recalls them on demand;
- prevents removing a strategy while it still holds deployed funds.

Strategies are managed by privileged roles (a strategy manager that adds and removes
strategies, and a funds manager that moves assets in and out), so treasury deployment is a
deliberate, permissioned action.

## Protocol‑owned liquidity via the LP auction

A common goal is **protocol‑owned liquidity (POL)** — liquidity that the protocol controls
rather than renting from mercenary providers. Enten ships a strategy for acquiring it
fairly: the **Uniswap LP auction**.

The LP auction is a reverse Dutch auction for liquidity:

- The protocol funds the auction with a **rewards token**.
- Each epoch makes a target amount of liquidity available to buy, priced in rewards. As the
  epoch progresses, the price **decays** — liquidity becomes cheaper relative to the reward,
  so the protocol pays progressively more reward per unit of liquidity over time.
- A participant supplies liquidity (the two tokens of a Uniswap v4 pool) into a
  **protocol‑owned position** and receives rewards in return. Any unused input is refunded.
- The position stays owned by the protocol, and the **trading fees it earns are routed to the
  treasury**.

The result is liquidity that the protocol owns outright, acquired through transparent,
market‑priced auctions rather than ongoing incentive emissions. Pools that pair against the
native gas token are supported; the reward token itself cannot be one of the pool's tokens.

## How it fits together

Putting the pieces in sequence:

1. Primary sales (auctions/presale) split incoming assets into backing, team, and treasury.
2. The treasury accumulates its share.
3. Treasury assets are deployed into strategies — including the LP auction — to earn yield or
   build protocol‑owned liquidity.
4. Strategy returns (such as LP trading fees) flow back to the treasury.

Throughout, backing is untouched and backing per token only rises.
