# Accounts & Permissions

Enten contracts should be documented by caller authority and permission boundaries. The important question is which account or contract is allowed to call a function and what system authority that function exercises.

## Public functions

Some functions are intentionally public. For example, auction rollover can be public when any caller is allowed to start the next auction once the current epoch has ended or sold out.

Public does not mean unbounded. Public functions should still be protected by contract state checks and system invariants.

## Policy-controlled functions

Policy-controlled functions should document which policy can call them and why that policy needs the capability. This matters for modules such as minting, burning, treasury movement, borrowing, and capture.

## ERC-20 approvals

Approvals are not Enten-specific, but they are part of most user-facing flows. Contract docs should identify:

- The token being approved.
- The spender contract.
- The action that requires spending authority.
- Whether the approval is exact, bounded, or reusable.

## Signer responsibility

Externally owned accounts and contract wallets remain responsible for signing transactions. Enten contracts enforce permissions and invariants after a transaction is submitted.
