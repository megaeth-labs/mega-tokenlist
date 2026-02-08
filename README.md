# MegaETH Token List

The official token registry for the MegaETH ecosystem. This repository maintains a curated list of tokens deployed on MegaETH and their corresponding addresses on other chains for bridging and cross-chain tracking.

The generated tokenlist follows the [Uniswap Token List](https://github.com/Uniswap/token-lists) standard with MegaETH-specific extensions for tracking bridge mechanics and token origins.

## Supported Chains

| Chain    | Chain ID | Type   | Description                              |
| -------- | -------- | ------ | ---------------------------------------- |
| Ethereum | 1        | L1     | Ethereum mainnet                         |
| MegaETH  | 4326     | L2     | MegaETH mainnet                          |
| Solana   | -        | Source | Non-EVM source chain for bridged assets  |

> **Note:** Only EVM chains (Ethereum, MegaETH) appear in the generated tokenlist. Non-EVM chains like Solana are tracked as source chains — their addresses appear in the `extensions` field.

---

## Quick Start

### Adding a Token

1. Create a folder: `data/YOUR_TOKEN/`
2. Add `data.json` with token info
3. Add `logo.svg` or `logo.png` (256×256 recommended)
4. Submit a PR

---

## Token Data Schema

### Root Fields

| Field         | Type   | Required | Description                        |
| ------------- | ------ | -------- | ---------------------------------- |
| `name`        | string | ✓        | Full token name                    |
| `symbol`      | string | ✓        | Token ticker symbol                |
| `decimals`    | number | ✓        | Token decimal places               |
| `description` | string |          | Token description (max 1000 chars) |
| `website`     | string |          | Project website URL                |

### Per-Chain Fields

Each chain entry in `tokens` supports:

| Field       | Type    | Description                                           |
| ----------- | ------- | ----------------------------------------------------- |
| `address`   | string  | Token contract address (required)                     |
| `isOrigin`  | boolean | `true` if token was originally created on this chain  |
| `mechanism` | string  | How tokens move: `"native"` `"lock"` `"mint"` `"burn"` |
| `bridge`    | string  | Bridge contract address (lockbox if lock, endpoint if mint/burn) |
| `isOFT`     | boolean | `true` if token is a LayerZero OFT                    |

### Mechanism Types

| Mechanism  | Description                                      | `bridge` field contains     |
| ---------- | ------------------------------------------------ | --------------------------- |
| `native`   | Token originated here, no bridge involved        | (not needed)                |
| `lock`     | Tokens are locked here when bridging out         | Lockbox contract address    |
| `mint`     | Tokens are minted here from another chain        | Mint/bridge endpoint        |
| `burn`     | Tokens are burned here when bridging out         | Burn/bridge endpoint        |

---

## Examples

### 1. Native Token (Single Chain)

A token that only exists on MegaETH:

```json
{
  "name": "MEGA Token",
  "symbol": "MEGA",
  "decimals": 18,
  "tokens": {
    "megaeth": {
      "address": "0x28B7E77f82B25B95953825F1E3eA0E36c1c29861",
      "isOrigin": true,
      "mechanism": "native"
    }
  }
}
```

**Output:**
```json
{
  "chainId": 4326,
  "symbol": "MEGA",
  "extensions": {
    "isOrigin": true,
    "mechanism": "native",
    "isOFT": "unknown"
  }
}
```

---

### 2. Canonical Bridge (ETH)

Native ETH bridged via the official MegaETH bridge:

```json
{
  "name": "Ether",
  "symbol": "ETH",
  "decimals": 18,
  "tokens": {
    "ethereum": {
      "address": "0x0000000000000000000000000000000000000000",
      "isOrigin": true,
      "mechanism": "lock",
      "bridge": "0x0CA3A2FBC3D770b578223FBB6b062fa875a2eE75"
    },
    "megaeth": {
      "address": "0x0000000000000000000000000000000000000000",
      "isOrigin": false,
      "mechanism": "mint",
      "bridge": "0x4200000000000000000000000000000000000010"
    }
  }
}
```

**Output (MegaETH):**
```json
{
  "chainId": 4326,
  "symbol": "ETH",
  "extensions": {
    "isOrigin": false,
    "mechanism": "mint",
    "isOFT": "unknown",
    "originChain": "ethereum",
    "originBridgeAddress": "0x0CA3A2FBC3D770b578223FBB6b062fa875a2eE75",
    "originMechanism": "lock",
    "bridgeAddress": "0x4200000000000000000000000000000000000010",
    "bridgeType": "canonical"
  }
}
```

---

### 3. OFT with Lockbox (CUSD)

CUSD is an OFT that uses a lockbox on Ethereum. Tokens are locked on Ethereum, minted on MegaETH:

```json
{
  "name": "Cap USD",
  "symbol": "CUSD",
  "decimals": 18,
  "tokens": {
    "ethereum": {
      "address": "0xcCcc62962d17b8914c62D74FfB843d73B2a3cccC",
      "isOrigin": true,
      "mechanism": "lock",
      "bridge": "0xA62571EbdFfAbC3051a2e5B9e1f57b23D830c8Fd",
      "isOFT": true
    },
    "megaeth": {
      "address": "0xcCcc62962d17b8914c62D74FfB843d73B2a3cccC",
      "isOrigin": false,
      "mechanism": "mint",
      "bridge": "0xOFTEndpoint...",
      "isOFT": true
    }
  }
}
```

**Output (Ethereum - Origin):**
```json
{
  "chainId": 1,
  "symbol": "CUSD",
  "extensions": {
    "isOrigin": true,
    "mechanism": "lock",
    "isOFT": true,
    "bridgeAddress": "0xA62571EbdFfAbC3051a2e5B9e1f57b23D830c8Fd",
    "bridgeType": "others"
  }
}
```

**Output (MegaETH - Minted):**
```json
{
  "chainId": 4326,
  "symbol": "CUSD",
  "extensions": {
    "isOrigin": false,
    "mechanism": "mint",
    "isOFT": true,
    "originChain": "ethereum",
    "originBridgeAddress": "0xA62571EbdFfAbC3051a2e5B9e1f57b23D830c8Fd",
    "originMechanism": "lock",
    "bridgeAddress": "0xOFTEndpoint...",
    "bridgeType": "others"
  }
}
```

> **For data trackers:** `originBridgeAddress` + `originMechanism: "lock"` tells you where backing tokens are locked. Don't double-count — tokens in the lockbox back the minted supply.

---

### 4. Pure OFT (Burn & Mint)

An OFT that burns on source and mints on destination (no lockbox):

```json
{
  "name": "USDe",
  "symbol": "USDe",
  "decimals": 18,
  "tokens": {
    "ethereum": {
      "address": "0x4c9edd5852cd905f086c759e8383e09bff1e68b3",
      "isOrigin": true,
      "mechanism": "burn",
      "bridge": "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
      "isOFT": true
    },
    "megaeth": {
      "address": "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
      "isOrigin": false,
      "mechanism": "mint",
      "bridge": "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
      "isOFT": true
    }
  }
}
```

**Output (Ethereum):**
```json
{
  "chainId": 1,
  "symbol": "USDe",
  "extensions": {
    "isOrigin": true,
    "mechanism": "burn",
    "isOFT": true,
    "bridgeAddress": "0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34",
    "bridgeType": "others"
  }
}
```

> **For data trackers:** `mechanism: "burn"` means total supply is conserved across chains. When tokens burn on Ethereum, they mint on MegaETH.

---

### 5. Bridged from Non-EVM Chain (Solana)

A token bridged from Solana via Wormhole:

```json
{
  "name": "Wrapped SOL",
  "symbol": "WSOL",
  "decimals": 9,
  "tokens": {
    "solana": {
      "address": "So11111111111111111111111111111111111111112"
    },
    "megaeth": {
      "address": "0x9a96E366F6b2ED5850A38B58D355a80aFD998411",
      "isOrigin": false,
      "mechanism": "mint",
      "bridge": "0xWormholeBridge..."
    }
  }
}
```

**Output:**
```json
{
  "chainId": 4326,
  "symbol": "WSOL",
  "extensions": {
    "isOrigin": false,
    "mechanism": "mint",
    "isOFT": "unknown",
    "originChain": "solana",
    "bridgeAddress": "0xWormholeBridge...",
    "bridgeType": "others",
    "sourceChain": "solana",
    "sourceAddress": "So11111111111111111111111111111111111111112"
  }
}
```

---

## Extensions Reference

The `extensions` object in the generated tokenlist:

### Origin & Mechanism

| Field              | Type                    | Description                                |
| ------------------ | ----------------------- | ------------------------------------------ |
| `isOrigin`         | `boolean \| "unknown"`  | Is this the canonical origin chain?        |
| `originChain`      | `string`                | Which chain has the origin supply          |
| `mechanism`        | `string \| "unknown"`   | `"native"` `"lock"` `"mint"` `"burn"`      |
| `originMechanism`  | `string`                | Mechanism on origin chain                  |

### Bridge Info

| Field                 | Type     | Description                                     |
| --------------------- | -------- | ----------------------------------------------- |
| `bridgeAddress`       | `string` | Bridge contract on this chain                   |
| `bridgeType`          | `string` | `"canonical"` (official) or `"others"`          |
| `originBridgeAddress` | `string` | Bridge contract on origin chain (lockbox if lock) |

### Token Flags

| Field   | Type                   | Description                        |
| ------- | ---------------------- | ---------------------------------- |
| `isOFT` | `boolean \| "unknown"` | LayerZero Omnichain Fungible Token |

### Non-EVM Source

| Field           | Type     | Description                          |
| --------------- | -------- | ------------------------------------ |
| `sourceChain`   | `string` | Source chain name (e.g., `"solana"`) |
| `sourceAddress` | `string` | Token address on source chain        |

---

## For Data Trackers

This tokenlist helps track token movement across chains without double-counting:

| Check | What it tells you |
| ----- | ----------------- |
| `isOrigin: true` | This chain holds the canonical supply |
| `mechanism: "lock"` | Tokens here are locked, backing supply elsewhere |
| `mechanism: "mint"` | Tokens here are minted, backed by locked/burned tokens elsewhere |
| `mechanism: "burn"` | Tokens burned here are minted elsewhere (supply conserved) |
| `originBridgeAddress` | Where to watch for locked/backing tokens |

### Example: CUSD Supply Tracking

```
Ethereum (isOrigin: true, mechanism: lock)
├── Circulating: tokens held by users
└── Locked: tokens in bridgeAddress (backs MegaETH supply)

MegaETH (isOrigin: false, mechanism: mint)
└── Minted: backed 1:1 by Ethereum locked tokens

Total Supply = Ethereum Circulating + Ethereum Locked
             = Ethereum Circulating + MegaETH Minted
```

---

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

### Run Tests

```bash
pnpm test
```

---

## Requirements

- Token must be deployed on at least one supported chain
- Logo must be SVG or PNG, minimum 200×200px
- EVM addresses must be checksummed ([EIP-55](https://eips.ethereum.org/EIPS/eip-55))

---

## License

MIT
