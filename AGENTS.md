# AGENTS.md — mega-tokenlist

This file tells coding agents how to contribute to this repository safely.

## Purpose

This repository stores token metadata under `data/` and generates tokenlists automatically.

For routine token submissions, agents should only edit token metadata and logos.
Generated tokenlists and repo logic are maintained separately.

---

## Default rule: edit only `data/`

For normal token submission PRs, you may only change files under:

- `data/<SYMBOL>/data.json`
- `data/<SYMBOL>/logo.svg`
- `data/<SYMBOL>/logo.png`

If your diff contains files outside `data/`, stop and reassess.

External contributor PRs that modify files outside `data/` will fail CI.

---

## Never edit generated outputs manually

Do not manually edit:

- `megaeth.tokenlist.json`
- `megaeth.testnet.tokenlist.json`

These files are generated automatically after merge.

If your PR includes changes to generated tokenlists for a routine token submission, remove them before submitting.

---

## Allowed PR types

### 1. Routine token submission
Examples:
- add a new token
- update token metadata
- add or replace a token logo
- add a testnet token entry in `data/`

For these PRs:
- modify only `data/**`
- do not change repo code
- do not change docs
- do not regenerate outputs manually

### 2. Maintainer-level repo change
Examples:
- add new supported chain keys
- change generation logic
- change output file structure
- change CI/workflows
- update README/AGENTS/docs for contributor policy

These are not routine token submissions.
If asked to do this, explicitly state that the PR is a repo-level change and may be blocked by external contributor rules.

---

## Supported token keys

Inside `data/<SYMBOL>/data.json`, use the `tokens` object with supported keys:

- `ethereum`
- `megaeth`
- `megaeth_testnet`
- `solana` (source tracking only)

Example:

```json
{
  "name": "Example Token",
  "symbol": "EXAMPLE",
  "decimals": 18,
  "tokens": {
    "megaeth": {
      "address": "0x1234567890abcdef1234567890abcdef12345678",
      "isOrigin": true,
      "mechanism": "native"
    }
  }
}
```
---

## Testnet policy

Testnet tokens belong in data/ just like mainnet tokens.

To add a MegaETH testnet token, use:

• tokens.megaeth_testnet

Do not create or edit generated testnet tokenlist files manually.

Example:
```json
{
  "name": "Project Blue",
  "symbol": "BLU",
  "decimals": 18,
  "tokens": {
    "megaeth_testnet": {
      "address": "0x1234567890abcdef1234567890abcdef12345678",
      "isOrigin": true,
      "mechanism": "native"
    }
  }
}
```
---

## Per-chain fields

Each chain entry may include:

- address (required)
- isOrigin
- mechanism
- bridge
- isOFT

## Mechanism meanings:

- native: originated on this chain
- lock: locked on this chain when bridging out
- mint: minted on this chain from another chain
- burn: burned on this chain when bridging out

If mechanism/origin/bridge data is uncertain, do not guess. Ask or leave the PR narrower.

---

## Address and metadata rules

Addresses

- Use checksummed EVM addresses (EIP-55)
- Verify addresses on the target chain before submitting
- Only use 0x0000000000000000000000000000000000000000 when the repo convention explicitly uses it for the native gas token representation

Decimals

- Must match on-chain decimals
- Do not infer blindly

Logos

- Use logo.svg or logo.png
- Prefer clean, production-safe assets
- Keep filenames exactly logo.svg or logo.png

Folder naming

Use data/<SYMBOL>/ following existing repo conventions.

If a symbol collision or naming ambiguity exists, inspect existing folders first and follow precedent.

---

## Required pre-PR check

Before submitting a routine token PR, confirm the diff only touches data/**.

Example:

git diff --name-only origin/main...HEAD

If any file outside data/ appears, remove it unless this is explicitly a maintainer-level repo change.

---

## PR scope rules

Keep PRs narrow.

Good:

- one token addition
- one metadata correction
- one logo replacement

Bad:

- multiple unrelated token edits
- mixed repo logic + token data
- generated output noise
- opportunistic cleanup unrelated to the request

---

## PR writing rules

PR title should be direct, for example:

- Add BLU token on MegaETH testnet
- Update CUSD bridge metadata
- Add logo for USDM

PR body should include:

- token name
- token symbol
- decimals
- chain(s)
- contract address(es)
- whether native / bridged / OFT
- bridge address if applicable

---

## What agents must not do

### Do not:

- manually regenerate tokenlists for routine token PRs
- commit changes outside data/ in a normal token PR
- modify workflows, README, or generator code unless explicitly asked
- invent bridge metadata
- guess origin/mechanism when uncertain
- rename folders casually
- bundle unrelated cleanup with a token submission

When uncertain, prefer a smaller PR and state the uncertainty clearly.
