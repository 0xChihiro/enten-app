# Overview

Enten is a new type of launch pad that focuses on create both fair and modular systems. Focusing on helping teams launch entire systems on day one rather than having to spend time and resources of their own on development costs when they could be focusing on important business tasks. Keeping the same values that this space was originally built on, while allowing for the flexibility required by protocols in todays fast moving world. No one knows what the future holds, which is why we give you the tools to adapt with it. 

It has several key core components that hold specific invariants and allow for this to be possible. At the core there is the Token, Controller, Kernel, and Vault. Every Enten system is launched with these 4 core components. These components hold the specific accounting and upgrade invariants that are required for the system to function properly. 

1. **Controller**: The Controller is in charge of module / policy upgrade, activation, deactivation, and replacement. It is also the key center point which all data of the system flows through. It also allows for new token mints (when backing is increased through such actions). 
2. **Token**: The standard ERC20 token that accompanies each system
3. **Vault**: The accounting aspect of the system that calculates backing per token, holds treasury and team funds, and moves funds during redemptions, borrows, and treasury strategy deployment / recall.
4. **Kernel**: Storage for the entire system, allowing for upgradable modules and policies without requiring migrations from users. The Kernel is a unified storage space that functions similarly to standard upgradable smart contract patterns. 

## System invariants

- **Backing per token cannot decrease.** System actions that mint, borrow, redeem, route treasury funds, or settle auctions must preserve the accounting assumptions held by the Vault.
- **Modules hold bounded authority.** Capabilities such as minting, burning, borrowing, treasury movement, and capture are separated into modules and policies instead of being concentrated in one contract.
- **The Controller coordinates upgrades.** Systems can adapt over time through controlled activation, deactivation, and replacement of system components.
- **The Kernel keeps state unified.** Storage remains in a shared system layer so modules and policies can evolve without requiring user migrations.

## Launch model

An Enten launch is intended to start with the core token, accounting, upgrade, and policy structure already in place. Teams can then choose the distribution model, treasury strategy, and market mechanics that fit their system.

The default auction model is one distribution path, not the only valid path. Enten systems are designed to support modular launch patterns while preserving the same core accounting and permission rules.

## Documentation scope

These docs should describe the public smart contracts, system components, invariants, and integration rules. Frontend implementation details should only appear when they clarify how a contract function is meant to be used.

> Public docs should favor clarity over roadmap detail. If a system is not public yet, document the surrounding principle instead of the hidden implementation.
