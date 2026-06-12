# Routing & Swaps

Routing inside Enten systems should be understood as contract-mediated asset movement. Swaps, treasury deployments, auctions, borrows, bids, and other actions can all depend on routing assets through approved contracts while preserving the system's accounting rules.

## Routing boundaries

Routing contracts should make clear which assets enter the system, which assets leave the system, and which contract receives authority through approval or direct transfer.

For swaps, the important boundary is not whether the path is direct or multi-hop. The important boundary is whether the route preserves the expected asset accounting and sends the final output to the intended receiver.

## Approval flow

ERC-20 approvals grant spending authority to a router, vault, or policy contract. Integrations should document the spender contract and the reason the approval is required.

Approvals should be scoped to the action whenever possible. If a system uses Permit2, Universal Router, or a custom routing contract, that authority should be documented as part of the system integration.

## Slippage and minimum output

Slippage controls protect against receiving less than expected. Contract integrations should pass minimum output values into the execution path when the routing contract supports them.

## System actions beyond swaps

The same routing principles can apply to auctions, borrows, bids, treasury deployment, and other Enten actions. The system should make asset movement explicit and preserve the Vault's backing assumptions.
