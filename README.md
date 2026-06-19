# Enten Static Site

Static HTML, CSS, and vanilla JavaScript for the Enten interface on MegaETH.

The protocol contracts live in a separate repo. This repo is the lightweight web
surface that can be served normally during development and later packed into an
onchain site/resource contract.

## Pages

- `web/index.html`
- `web/presale.html`
- `web/launch.html`
- `web/auction.html`
- `web/borrow.html`
- `web/swap.html`

Shared styling and browser-wallet behavior live in:

- `web/styles.css`
- `src/app.js`

`web/app.js`, the `web/app-*.js` page modules, and the runtime files are
production build outputs. The loader selects only the current interactive page,
viem stays in a shared cached runtime, and MOSS remains a self-hosted lazy chunk
that is loaded only for MOSS users.

The same build copies the pinned Inter, JetBrains Mono, and Playfair Display
variable fonts into `web/fonts/`. Pages load the shared chrome from
`web/styles.css`; no runtime Google Fonts request is required.

## Build

```shell
npm install
npm run check
```

Run the build before publishing `web/` through Cloudflare.

## Local Preview

Open `web/index.html` directly in a browser for static visual checks.

For wallet connection testing, serve the folder over localhost so injected
browser wallets can reliably attach:

```shell
python3 -m http.server 4173 --bind 127.0.0.1 -d web
```

Then open `http://127.0.0.1:4173/presale.html`,
`http://127.0.0.1:4173/launch.html`, `http://127.0.0.1:4173/auction.html`,
`http://127.0.0.1:4173/borrow.html`, or `http://127.0.0.1:4173/swap.html`.

## Install as a Progressive Web App

The production HTTPS site is an installable Progressive Web App (PWA). It uses
the same responsive Enten interface and MOSS integration across installed and
browser sessions, without maintaining a separate native application.

On iPhone, open the site in Safari, use **Share > Add to Home Screen**, enable
**Open as Web App**, and tap **Add**. On supported Android and desktop browsers,
use the browser's **Install app** action.

Use `web/moss-example.html` over valid HTTPS to isolate MOSS connection testing
from the rest of the Enten transaction UI.

## Contract Wiring

Contract addresses and ABIs are intentionally empty in `web/app.js` until the
auction and swap contracts are finalized in the protocol repo.

The borrow page is currently a preview surface. It does not submit a transaction
until the deployed borrow-market address and ABI are added to `src/app.js`.

## Swap Routing

The swap page is wired around Uniswap Universal Router. The static UI builds a
route request from the selected token pair, amount, chain, slippage, and allowed
protocols (`V2`, `V3`, `V4`). A routing endpoint then needs to return the final
Universal Router transaction object (`to`, `data`, `value`) plus any approval
transaction required before the swap.

MegaETH mainnet is configured to use USDm as the quote-side asset. MegaETH
testnet is supported for wallet connection and contract testing with testnet
ETH, MEGA, and USDm; its Universal Router address is intentionally blank until
the target testnet router is confirmed or deployed.

MegaETH testnet currently has the ENTEN token, vault, and auction configured.

## MegaETH Testnet Deployment Wiring

For the current testnet path, the public site only needs the user-facing auction
policy and the already-deployed token/vault. The gateway can be deployed for
admin operations, but it does not need public UI wiring unless we add a separate
admin page.

Deploy/configure in this order:

1. Deploy the gateway for admin-specific operations.
2. Deploy the auction policy.
3. Register/activate the needed policies in the kernel/controller system.
4. Confirm the auction has permission to call the controller/vault/token paths it
   needs for `buy(...)`.
5. Confirm the auction exposes:
   - `epochId()`
   - `getPrice()`
   - `remainingLot()`
   - `startTime()`
   - `epochPeriod()`
   - `buy(uint256,uint256,uint256,(address,uint256)[])`
6. Add the deployed auction address to the MegaETH testnet config in
   `web/app.js`.

MegaETH testnet swap execution is intentionally not required right now because
Uniswap v4 routing is not available there. The swap page can still be used to
check wallet and token balances.

Auction buys derive `maxPayments` from `getPrice()` and then check/submit ERC-20
approvals for the configured vault before calling `buy(...)`, because the vault
pulls payment assets with `transferFrom`.

Do not hardcode a Uniswap API key into the static site. Use `routeApiUrl` in
`web/app.js`, or set `window.ENTEN_ROUTE_API`, to point at a small proxy that
calls Uniswap's quote/swap API and returns wallet-ready calldata.
