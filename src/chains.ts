// Chain configuration for MegaETH ecosystem

export const CHAINS = {
  ethereum: {
    id: 1,
    name: 'Ethereum',
    layer: 1,
    evmCompatible: true,
    environment: 'mainnet',
  },
  megaeth: {
    id: 4326,
    name: 'MegaETH',
    layer: 2,
    evmCompatible: true,
    environment: 'mainnet',
  },
  megaeth_testnet: {
    id: 6343,
    name: 'MegaETH Testnet',
    layer: 2,
    evmCompatible: true,
    environment: 'testnet',
  },
  solana: {
    id: null, // Non-EVM chain, uses string identifier
    name: 'Solana',
    layer: 1,
    evmCompatible: false,
    environment: 'mainnet',
  },
} as const

export type Chain = keyof typeof CHAINS
export type EvmChain = 'ethereum' | 'megaeth' | 'megaeth_testnet'
export type SourceChain = 'solana' // Non-EVM chains used only for source tracking
export type L1Chain = 'ethereum'
export type L2Chain = 'megaeth' | 'megaeth_testnet'

// Chain ID lookup (EVM chains only - used for tokenlist generation)
export const CHAIN_IDS: Record<EvmChain, number> = {
  ethereum: 1,
  megaeth: 4326,
  megaeth_testnet: 6343,
}

// Source chains (non-EVM) - used for tracking bridged asset origins
export const SOURCE_CHAINS: readonly SourceChain[] = ['solana'] as const

// L2 to L1 mapping (for bridge relationships)
export const L2_TO_L1: Record<L2Chain, L1Chain> = {
  megaeth: 'ethereum',
  megaeth_testnet: 'ethereum',
}

export type TokenListTarget = 'mainnet' | 'testnet'

export const TOKENLIST_TARGET_CHAINS: Record<
  TokenListTarget,
  readonly EvmChain[]
> = {
  mainnet: ['ethereum', 'megaeth'],
  testnet: ['megaeth_testnet'],
}
