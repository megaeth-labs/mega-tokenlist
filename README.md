# MegaETH Token List

The official token registry for the MegaETH ecosystem. This repository maintains a curated list of ERC-20 tokens deployed on MegaETH and their corresponding Ethereum mainnet addresses for bridging.

## Supported Chains

| Chain    | Chain ID | Type |
| -------- | -------- | ---- |
| Ethereum | 1        | L1   |
| MegaETH  | 4326     | L2   |

## Adding a Token

1. Create a folder under `data/` with your token symbol (e.g., `data/WETH/`)
2. Add a `data.json` file with token information
3. Add a `logo.svg` or `logo.png` file (256x256 recommended)

### data.json Schema

```json
{
  "name": "Token Name",
  "symbol": "TKN",
  "decimals": 18,
  "tokens": {
    "ethereum": {
      "address": "0x..."
    },
    "megaeth": {
      "address": "0x...",
      "bridge": "0x..."
    }
  }
}
```

### Native vs Bridged Tokens

- **Native token**: No `bridge` field - token is native to that chain
- **Bridged token**: Has `bridge` field with the bridge contract address

Example for a bridged token on MegaETH:

```json
{
  "megaeth": {
    "address": "0xTokenAddress...",
    "bridge": "0xBridgeAddress..."
  }
}
```

### Optional Fields

- `description` - Token description (max 1000 characters)
- `website` - Project website URL
- `bridge` - Bridge contract address (per-chain, indicates token is bridged)

### Requirements

- Token must be deployed on at least one supported chain
- Logo must be SVG or PNG format, minimum 200x200px
- Addresses must be checksummed (EIP-55)

## Development

### Prerequisites

- Node.js >= 18
- pnpm

### Setup

```bash
pnpm install
```

### Generate Token List

```bash
pnpm generate
```

This creates `megaeth.tokenlist.json` in the project root.

## Output Format

The generated token list follows the [Uniswap Token List](https://github.com/Uniswap/token-lists) schema with extensions:

```json
{
  "name": "MegaETH Token List",
  "timestamp": "2025-01-05T00:00:00.000Z",
  "version": {
    "major": 1,
    "minor": 0,
    "patch": 0
  },
  "tokens": [
    {
      "chainId": 1,
      "address": "0x...",
      "name": "Token Name",
      "symbol": "TKN",
      "decimals": 18,
      "logoURI": "https://...",
      "extensions": {
        "isNative": true
      }
    },
    {
      "chainId": 4326,
      "address": "0x...",
      "name": "Token Name",
      "symbol": "TKN",
      "decimals": 18,
      "logoURI": "https://...",
      "extensions": {
        "isNative": false,
        "bridgeAddress": "0x...",
        "bridgeType": "canonical"
      }
    }
  ]
}
```

## License

MIT
# Test PR - Slack notification check
