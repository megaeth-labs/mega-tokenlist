import * as fs from 'fs'
import * as path from 'path'
import {
  CHAIN_IDS,
  SOURCE_CHAINS,
  TOKENLIST_TARGET_CHAINS,
  type EvmChain,
  type SourceChain,
  type TokenListTarget,
} from './chains'
import type {
  Mechanism,
  Token,
  TokenData,
  TokenList,
  TokenListToken,
} from './types'

const DATA_DIR = path.join(__dirname, '..', 'data')
const OUTPUT_FILES: Record<TokenListTarget, string> = {
  mainnet: path.join(__dirname, '..', 'megaeth.tokenlist.json'),
  testnet: path.join(__dirname, '..', 'megaeth.testnet.tokenlist.json'),
}
const LOGO_BASE_URL =
  'https://raw.githubusercontent.com/megaeth-labs/mega-tokenlist/main/data'

const CANONICAL_BRIDGES = new Set([
  '0x4200000000000000000000000000000000000010',
  '0x0CA3A2FBC3D770b578223FBB6b062fa875a2eE75',
  '0x7f82f57F0Dd546519324392e408b01fcC7D709e8',
])

function getLogoExtension(tokenDir: string): string | null {
  const svgPath = path.join(tokenDir, 'logo.svg')
  const pngPath = path.join(tokenDir, 'logo.png')

  if (fs.existsSync(svgPath)) return 'svg'
  if (fs.existsSync(pngPath)) return 'png'
  return null
}

function readTokenData(symbol: string): TokenData {
  const dataPath = path.join(DATA_DIR, symbol, 'data.json')
  const content = fs.readFileSync(dataPath, 'utf-8')
  return JSON.parse(content) as TokenData
}

// Find the origin chain info (chain name, bridge address, mechanism)
function findOriginInfo(tokenData: TokenData): {
  chain: string
  bridge?: string
  mechanism?: Mechanism
} | null {
  // First check EVM chains for explicit isOrigin
  for (const [chain, chainToken] of Object.entries(tokenData.tokens)) {
    if (chainToken?.isOrigin === true) {
      return {
        chain,
        bridge: chainToken.bridge,
        mechanism: chainToken.mechanism,
      }
    }
  }
  // Check non-EVM source chains
  for (const [chain, chainToken] of Object.entries(tokenData.tokens)) {
    if (SOURCE_CHAINS.includes(chain as SourceChain) && chainToken?.address) {
      return {
        chain,
        bridge: undefined,
        mechanism: undefined,
      }
    }
  }
  return null
}

// Find source chain info (non-EVM chains like Solana) for a token
function findSourceChain(
  tokenData: TokenData
): { chain: string; address: string } | null {
  for (const [chain, chainToken] of Object.entries(tokenData.tokens)) {
    if (SOURCE_CHAINS.includes(chain as SourceChain) && chainToken?.address) {
      return {
        chain,
        address: chainToken.address,
      }
    }
  }
  return null
}

// Infer mechanism if not explicitly set
function inferMechanism(
  chainToken: Token,
  isOrigin: boolean
): Mechanism | 'unknown' {
  // Explicit mechanism takes precedence
  if (chainToken.mechanism) {
    return chainToken.mechanism
  }
  // Infer from other fields
  if (isOrigin) {
    return chainToken.bridge ? 'lock' : 'native'
  }
  // Non-origin chain
  if (chainToken.isOFT) return 'burn'
  if (chainToken.bridge) return 'mint'
  return 'unknown'
}

export function generate(target: TokenListTarget = 'mainnet'): TokenList {
  // Read all token directories
  const tokenDirs = fs
    .readdirSync(DATA_DIR)
    .filter((name) => {
      const stat = fs.statSync(path.join(DATA_DIR, name))
      return stat.isDirectory()
    })
    .sort()

  const tokens: TokenListToken[] = []
  const includedChains = new Set<EvmChain>(TOKENLIST_TARGET_CHAINS[target])

  for (const symbol of tokenDirs) {
    const tokenDir = path.join(DATA_DIR, symbol)
    const tokenData = readTokenData(symbol)
    const logoExt = getLogoExtension(tokenDir)
    const sourceChain = findSourceChain(tokenData)
    const originInfo = findOriginInfo(tokenData)

    // Create token entries for each EVM chain
    for (const [chain, chainToken] of Object.entries(tokenData.tokens)) {
      if (!chainToken?.address) continue

      const evmChain = chain as EvmChain
      const chainId = CHAIN_IDS[evmChain]
      if (!chainId || !includedChains.has(evmChain)) continue

      const isOrigin = chainToken.isOrigin === true
      const mechanism = inferMechanism(chainToken, isOrigin)

      // Build extensions object
      const extensions: TokenListToken['extensions'] = {
        isOrigin: chainToken.isOrigin ?? 'unknown',
        mechanism,
        isOFT: chainToken.isOFT ?? 'unknown',
      }

      // Add origin chain info for non-origin tokens
      if (!isOrigin && originInfo) {
        extensions.originChain = originInfo.chain
        // Include origin bridge info so trackers know where backing is
        if (originInfo.bridge) {
          extensions.originBridgeAddress = originInfo.bridge
        }
        if (originInfo.mechanism) {
          extensions.originMechanism = originInfo.mechanism
        }
      }

      // Add bridge address for this chain
      if (chainToken.bridge) {
        extensions.bridgeAddress = chainToken.bridge
        extensions.bridgeType = CANONICAL_BRIDGES.has(chainToken.bridge)
          ? 'canonical'
          : 'others'
      }

      // Add source chain info if bridged from non-EVM chain
      if (sourceChain) {
        extensions.sourceChain = sourceChain.chain
        extensions.sourceAddress = sourceChain.address
      }

      const token: TokenListToken = {
        chainId,
        address: chainToken.address,
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        extensions,
      }

      if (logoExt) {
        token.logoURI = `${LOGO_BASE_URL}/${symbol}/logo.${logoExt}`
      }

      tokens.push(token)
    }
  }

  // Sort tokens by chainId, then symbol
  tokens.sort((a, b) => {
    if (a.chainId !== b.chainId) return a.chainId - b.chainId
    return a.symbol.localeCompare(b.symbol)
  })

  const tokenList: TokenList = {
    name:
      target === 'mainnet' ? 'MegaETH Token List' : 'MegaETH Testnet Token List',
    timestamp: new Date().toISOString(),
    version: {
      major: 1,
      minor: 0,
      patch: 0,
    },
    tokens,
  }

  return tokenList
}

// Main execution
if (require.main === module) {
  for (const target of ['mainnet', 'testnet'] as const) {
    const tokenList = generate(target)
    const outputFile = OUTPUT_FILES[target]
    fs.writeFileSync(outputFile, JSON.stringify(tokenList, null, 2))
    console.log(`Generated ${outputFile} with ${tokenList.tokens.length} tokens`)
  }
}
