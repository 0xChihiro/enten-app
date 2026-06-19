# Routing & Swaps

Most actions in an Enten system come down to **asset movement through approved contracts**
while the system's accounting rules stay intact. Buying at auction, redeeming, borrowing,
deploying treasury funds, and swapping all share the same shape: assets enter the system,
assets leave, and a specific contract is granted authority to move them. Understanding that
shape makes every flow in the app easier to read.

## Routing boundaries

For any action, three things should be clear:

- **What enters** the system (the asset and amount you provide).
- **What leaves** the system (the asset and amount you receive).
- **Which contract** receives authority — through an approval or a direct transfer — to move
  your assets.

For swaps specifically, what matters is not whether the path is direct or multi‑hop. What
matters is that the route preserves the expected accounting and sends the final output to the
intended receiver.

## Approvals

ERC‑20 approvals grant spending authority to a specific contract. In Enten flows the spender
is usually the system's **Vault** (for payments and redemptions) or a **policy** contract
(for actions it mediates). The app makes the spender explicit for each action.

Good practice:

- Approve the contract the action actually requires, and know why.
- Prefer approvals scoped to the action when possible.
- If a flow uses Permit2, a universal router, or a custom routing contract, treat that
  contract's authority as part of the action you're approving.

## Slippage and minimum output

Slippage protection guards against receiving less than expected. Enten's primary‑market
actions express this as a **maximum payment** (auctions and presales) or a **minimum output**
(swaps and the LP auction). Always set these values so a moving price can't fill your action
on worse terms than you intended.

## Beyond swaps

The same routing principles apply to auctions, presales, borrows, redemptions, and treasury
deployment. In every case the system makes asset movement explicit and preserves the Vault's
backing assumptions — so once you can read one flow, you can read them all.
