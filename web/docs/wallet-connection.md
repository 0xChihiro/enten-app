# Accounts & Permissions

Enten systems are best understood through **who is allowed to call what**. For any function,
the useful question is which account or contract may call it, and what system authority that
call exercises. This page maps the permission boundaries you'll encounter as a user.

## Public functions

Some functions are intentionally open to anyone. For example, starting the next auction round
once the current epoch has ended or sold out is permissionless — any caller can do it, and it
requires no purchase.

Public does not mean unbounded. Open functions are still constrained by contract state and
the system's invariants (a public rollover still can't run mid‑epoch, and a public buy still
can't decrease backing per token).

## Policy‑controlled functions

Most user actions go through a **policy**, which in turn calls a **module** that holds a
specific, narrow permission against the core. Minting, borrowing, burning, redeeming, and
treasury movement all work this way. The chain of authority is explicit: a policy can only do
what its module permits, and a module can only do what the Controller granted it. This is why
you can always trace which contract is allowed to mint, borrow, or move funds.

## Administrative roles

A live system has a small number of privileged roles — for example, an executor that can
upgrade the system, a guardian that can pause settlements in an emergency, and asset/fee
administrators. In a mature system these are held by governance, ideally behind a timelock,
not by an anonymous key. When evaluating a system, it's worth checking who holds these roles
and whether upgrades are timelocked.

## Approvals and signing

ERC‑20 approvals are part of most user flows. For each approval, know:

- the **token** being approved,
- the **spender** contract (usually the Vault or a policy),
- the **action** that requires it,
- and whether it's exact, bounded, or reusable.

Your wallet — an externally owned account or a smart‑contract wallet — is always responsible
for signing. The Enten contracts enforce permissions and invariants after your transaction is
submitted. See [Routing & Swaps](portal-swaps.md) for how authority is granted per action.
