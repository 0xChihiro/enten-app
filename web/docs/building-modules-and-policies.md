# Building Modules & Policies

Enten systems are extended by writing **modules** and **policies**. This guide explains the
two roles, how they're installed and permissioned, and the patterns to follow so a new
capability composes safely with the core. It assumes you've read [Architecture](architecture.md).

## Modules vs. policies

- A **module** wraps one bounded capability against the core. It is the only kind of contract
  allowed to call `Controller.settle()` for its capability, and it translates a request into
  one or more settlements. Modules are identified by a five‑letter **keycode** (A–Z), expose
  a semantic **version**, and have an `INIT` hook the Controller calls on install/upgrade.
- A **policy** is the logic that *uses* modules. It holds no settlement power of its own;
  instead, at activation it declares which modules it depends on and which module functions it
  needs permission to call. Policies are where user‑facing entry points, access control, and
  business rules live.

A useful rule of thumb: **modules are verbs against the core** (mint, borrow, move treasury),
**policies are the rules around those verbs** (who, when, how much, at what price).

## How installation and permissions work

The Controller's executor drives four actions: install module, upgrade module, activate
policy, deactivate policy.

- **Installing a module** registers it under its keycode and runs its `INIT`.
- **Activating a policy** calls `configureDependencies()` (which returns the keycodes it
  needs and caches their module addresses) and `requestPermissions()` (which returns the
  exact `keycode + function selector` pairs it needs). The Controller validates that every
  dependency is installed and every requested permission maps to a declared dependency, then
  grants those permissions. Deactivation revokes them deterministically.

Two gates then protect a module's functions at call time:

1. The function carries the `permissioned` modifier — it only runs if the caller is an
   **active policy** that holds that exact selector on this module's keycode.
2. Minting additionally requires the module to hold **mint permission**, granted separately
   via the `MINT_PERMISSION_ROLE`.

This is least privilege by construction: a policy can do nothing a module didn't expose, and
a module can do nothing the Controller didn't permit.

## Writing a module

A module extends the core `Module` base, sets its `KEYCODE` and `VERSION`, and exposes
capability functions guarded by `permissioned`. Inside those functions it constructs
`Settlement` structs and calls `Controller.settle()`.

Guidelines:

- **Keep the surface minimal.** Expose only the specific settlement your capability needs.
  For example, the shipped minter performs *only* a `Payment` settlement and deliberately
  refuses caller‑supplied state updates — otherwise any policy holding its function could
  write arbitrary Kernel slots. Don't hand out more power than the capability requires.
- **Own your storage carefully.** If your module keeps per‑user or per‑asset state in the
  Kernel (as the borrower module does for positions), define a collision‑resistant namespace
  and document the layout. Never write slots owned by the core or other modules.
- **Validate before you settle.** Compute and check your own invariants (collateralization,
  limits, etc.) before submitting the settlement. The core will still enforce the backing
  invariant, but it won't enforce *your* rules.
- **Let the core do the accounting.** Express asset movement as receipts and let the
  settlement engine route transfers and bucket credits; don't move funds yourself.

## Writing a policy

A policy extends the core `Policy` base and implements `configureDependencies()` and
`requestPermissions()`. It then offers external entry points that call into its modules.

Guidelines:

- **Declare exactly what you need.** Request only the selectors you call. The Controller
  rejects permission requests for undeclared dependencies.
- **Add your own access control.** The core only knows "is this an active, permitted policy."
  Any finer access control (admin‑only operations, rate limits, role separation) belongs in
  the policy. Several shipped policies layer `AccessControl` on top for this reason.
- **Hold roles you grant, then hand them off.** Admin policies like the Gateway hold a
  Controller role (e.g. `EXECUTOR_ROLE`) to perform upgrades; production systems move that
  authority behind a timelock once setup is done.
- **Stay re‑entrancy safe.** Policies that take user funds and call modules should guard
  against re‑entrancy, as the shipped auctions do.

## Upgrading and replacing

Because storage lives in the Kernel, you can **upgrade a module** (swap the implementation
behind a keycode) without migrating user state — the Controller re‑points dependent policies
automatically. You can **add or remove policies** as the system's needs change. This is the
core's main extensibility benefit, and the reason upgrades must be tightly controlled:
installing a component grants real authority over a live, backed system.

## Safety checklist

- New components are **trusted**. Review them as you would the core.
- Use **named, collision‑resistant slots**; never overwrite another component's storage.
- Keep module surfaces **narrow**; grant the **minimum permissions**.
- Enforce your capability's own invariants **before** settling.
- Put live‑system upgrades behind a **timelock**, and simulate every change first (see
  [Deployment](deployment.md)).
- Don't rely on the backing invariant to catch logic bugs — it catches *dilution and
  insolvency*, not incorrect business logic.
