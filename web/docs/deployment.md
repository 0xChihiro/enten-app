# Deployment

This page covers the deployment process, the tooling around it, and the public addresses for
each network. For the launch flow itself, see
[Launching Your Own System](launching-your-own-token.md).

## Process

A deployment has two stages:

1. **Launch the core** through the ControllerFactory. This deterministically deploys and
   wires the Kernel, Vault, Token, optional TeamLocker, and Controller, and validates the
   result. This is the only way to a genuine Enten core.
2. **Deploy and wire the periphery** — install the modules and activate the policies the
   system needs, register backing assets, set fees, seed backing, and grant the necessary
   permissions.

A typical first periphery round installs the `MINTR`, `ADMIN`, and `BRNER` modules with the
Gateway, a distribution policy (presale and/or auction), and the deflation hook; more
capabilities (borrowing, treasury strategies, the AMO) are added as needed.

## Tooling

The Foundry scripts in the repositories are convenience tooling for setup, administration,
and testing — not a substitute for the factory. Use them to:

- launch the core and the periphery in a repeatable way;
- register assets, set fees, and grant permissions with the correct decimal scaling;
- **simulate** every transaction before broadcasting, so you can verify configuration
  (permissions, fee split, backing floor scaling, seed mint) before touching mainnet.

A few deployment‑time details worth flagging:

- **Hook address mining.** The deflation hook must deploy to a `CREATE2` address that encodes
  its permission flags; the deploy mines a salt and the constructor reverts on a wrong
  address.
- **Decimal scaling.** Presale price parameters are in "backing‑asset wei per 1e18 token"
  scale, and the bootstrap floor is `asset_wei * 1e27 / token_wei`. For a 6‑decimal asset
  backing an 18‑decimal token, a 1:1 floor is `1e15`.
- **Supply headroom.** Distribution policies don't all check the token cap; ensure genesis
  plus the sale size fits under `maxSupply`.
- **Order of operations.** Activate a distribution policy and seed backing *before* opening a
  sale; grant mint permission to the minting module; hand admin/upgrade roles to a timelock
  before going live.

## Public addresses

Addresses are listed only when intended to be public and stable for the network, and should
be taken from verified deployment output or block‑explorer records. Do not treat temporary
test deployments as final infrastructure.

### MegaETH Mainnet

**Core**

| Contract | Address |
|---|---|
| Controller Factory | `0x8a611673c6d7faB8C24b10cDEC62902241B06751` |
| Controller | `0x6CD36EE52E83F88201B97914A8f574b922b69360` |
| Token | `0x0234059A118E0B7953252189e028ea7E780BbeE1` |
| Kernel | `0x198ce3DA5a8F9Cd79c474887A7318Ca42919E687` |
| Vault | `0x0E30e29e064f22fF434E3617C9EcB9A7a09EC189` |
| Protocol Collector | `0x6586Fd6a8C62f618E93DfD8a66f191355dc9fADb` |
| Team Locker | `0xCa5712a3bf52AC56A2E5Cb259047E88Ea2f41BEE` |

**Modules**

| Keycode | Address |
|---|---|
| `ADMIN` | `0x0b9673D7cE9fea7Bb32350a5FDe6bAbBb0319Ce1` |
| `MINTR` | `0xBeC582375c26aaE41f8E7D344472627B46780dea` |
| `BRNER` | `0xB2ba16b576a54C0cC16313b5DB08075C6d13188D` |
| `BRRWR` | TBA |
| `TRSRY` | TBA |
| `CAPTR` | TBA |

**Policies**

| Policy | Address |
|---|---|
| Gateway | `0x33A061E66ed1FD5c056b4cABf6aEDD77015A8ae0` |
| Auction | TBA |
| PresaleAuction | `0x1c54Fd960b761960A4265AE49603a338995e19e6` |
| BorrowPolicy | TBA |
| BurnerPolicy | TBA |
| TreasuryHandler | TBA |
| CaptureAMO | TBA |
| EntenDeflationHook | `0xaFEBFf625C72f9C67AF8D720449d7138176920cC` |

### MegaETH Testnet

**Core**

| Contract | Address |
|---|---|
| Controller Factory | TBA |
| Controller | TBA |
| Token | `0x71DD8C7B45234E7D57B69b79e1F2D1E604434eC0` |
| Kernel | TBA |
| Vault | `0x34d500707F2f9Dd825c71bbeEEFBd209B3511A45` |

**Policies**

| Policy | Address |
|---|---|
| Auction | `0xAd16d09D1e748b0344E16FfE09Fe1d1485d29543` |

Core contracts are available on testnet so on‑chain activity and frontend integration can be
exercised before a mainnet launch.
