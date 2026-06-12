# System Integration

Enten integrations should start from contract boundaries: which system is being integrated, which contracts are called, which assets move, and which invariants must remain true after the call.

## Integration rules

- Use public deployment addresses for the selected network.
- Read system state directly from contracts where possible.
- Document the spender for every approval.
- Preserve the Vault's backing assumptions.
- Treat module and policy authority as part of the integration surface.

## Auction integrations

Auction integrations should read `getPrice()`, `remainingLot()`, `LOT_SIZE()`, `startTime()`, `epochPeriod()`, and `epochId()` before preparing a buy transaction.

If buying the remaining lot before `buyMax` is deployed, integrations can use `remainingLot()` as the mint amount and call `buy(...)` with payment amounts calculated from `getPrice()`.

## Router integrations

Router integrations should make the execution contract explicit. If the route depends on an external router, custom router, or future Enten routing system, document the approved spender, input asset, output asset, and minimum output assumptions.

## Developer expectations

Integrators should not rely on product copy as a source of truth. The source of truth is the deployed contract interface, verified address, and documented system invariant.
