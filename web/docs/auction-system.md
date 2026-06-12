# Auction System

The auction page is built around a descending-price allocation flow. As the auction continue price gradually decays until 1 of 2 outcomes occur. Either the auction sells out and the next round is immediately started, or the auction concludes without selling out, at which point the next auction has to be manually started again. Anyone is allowed to start the next auction it does not require a specific admin privilege to do so.

## What Makes Enten Auctions Different?

 Enten auctions are not winner take all. Bidders are not required to buy all of the remaining tokens, allowing users to get in at whichever price they desire to. The auction does not naturally decay towards zero either. As one of the system invariants in Enten is that backing per token can not decrease, auction last price will also be slightly above nav to satisfy this invariant. If this was not the case the auctions would fail and not users would be able to participate towards the end of the auction. 

Auctions are also allowed to be multi asset. Due to the invariant stated above auctions automatically adjust when tokens become multi-backed assets. Easily adapting for ideas such as indexes or other types of tokens. The same theory applies as with as single backed token auction. 

## Auction Types

While Enten's current distribution model currently uses a dutch auction, this is not required. Teams launching with Enten can use any distribution model they choose, whether it be one of ours, or a custom model that they create themselves. Other models like bonding curves, standard auctions, or a 'fair launch' in which all tokens are added to liquidity are all viable inside our system. 

## Visible metrics

- **Current price** comes from the auction price read and is displayed with the payment asset unit.
- **Epoch allocation** comes from `LOT_SIZE()` on the auction contract.
- **Tokens available** comes from the remaining lot read for the active epoch.
- **Total backing** comes from the configured vault read when a vault address is available.
- **Epoch time** combines the active epoch start time and period into a countdown.

## Purchase flow

1. Integrations read active epoch and price data.
2. The buyer enters the amount of ENTEN to acquire.
3. Maximum payment amounts are calculated from the current price.
4. If an ERC-20 allowance is required, the buyer approves the required payment asset first.
5. The buy transaction calls `buy(...)` with the active epoch, deadline, mint amount, and max payment array.
6. The signer submits the transaction.
7. Transaction is submitted and the bidder receives their tokens.

## Max purchase

Until the dedicated `buyMax` contract function is deployed, integrations can read `remainingLot()` and use that value as the mint amount for `buy(...)`.

The estimated payment requirement is calculated from the current `getPrice()` result and the requested ENTEN amount.

## Starting the next auction

When the current auction has ended or the active lot is sold out, any caller can start the next round through the public auction contract function. This action does not require a purchase amount.

```solidity
function startNextAuction() external;
```

Integrations should simulate the call before submitting it.

## Lot size

The epoch allocation should use the immutable getter exposed as `LOT_SIZE()`. If the call succeeds, integrations should treat that value as the source of truth for the current allocation.

```solidity
function LOT_SIZE() external view returns (uint256);
```
