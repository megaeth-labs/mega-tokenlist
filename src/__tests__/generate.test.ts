import { CHAINS, CHAIN_IDS, L2_TO_L1, TOKENLIST_TARGET_CHAINS } from '../chains';
import { generate } from '../generate';

describe('Chain Configuration', () => {
  test('Ethereum chain ID is 1', () => {
    expect(CHAIN_IDS.ethereum).toBe(1);
    expect(CHAINS.ethereum.id).toBe(1);
  });

  test('MegaETH chain ID is 4326', () => {
    expect(CHAIN_IDS.megaeth).toBe(4326);
    expect(CHAINS.megaeth.id).toBe(4326);
  });

  test('MegaETH L2 maps to Ethereum L1', () => {
    expect(L2_TO_L1.megaeth).toBe('ethereum');
  });

  test('MegaETH testnet chain ID is 6343', () => {
    expect(CHAIN_IDS.megaeth_testnet).toBe(6343);
    expect(CHAINS.megaeth_testnet.id).toBe(6343);
  });

  test('tokenlist targets separate mainnet and testnet chains', () => {
    expect(TOKENLIST_TARGET_CHAINS.mainnet).toEqual(['ethereum', 'megaeth']);
    expect(TOKENLIST_TARGET_CHAINS.testnet).toEqual(['megaeth_testnet']);
  });
});

describe('Token List Generation', () => {
  const tokenList = generate();
  const testnetTokenList = generate('testnet');

  test('generates valid token list structure', () => {
    expect(tokenList).toHaveProperty('name', 'MegaETH Token List');
    expect(tokenList).toHaveProperty('timestamp');
    expect(tokenList).toHaveProperty('version');
    expect(tokenList).toHaveProperty('tokens');
    expect(Array.isArray(tokenList.tokens)).toBe(true);
  });

  test('generates separate testnet token list structure', () => {
    expect(testnetTokenList).toHaveProperty('name', 'MegaETH Testnet Token List');
    expect(testnetTokenList).toHaveProperty('timestamp');
    expect(testnetTokenList).toHaveProperty('version');
    expect(testnetTokenList).toHaveProperty('tokens');
    expect(Array.isArray(testnetTokenList.tokens)).toBe(true);
  });

  test('version has correct structure', () => {
    expect(tokenList.version).toHaveProperty('major');
    expect(tokenList.version).toHaveProperty('minor');
    expect(tokenList.version).toHaveProperty('patch');
  });

  test('tokens have required fields', () => {
    for (const token of tokenList.tokens) {
      expect(token).toHaveProperty('chainId');
      expect(token).toHaveProperty('address');
      expect(token).toHaveProperty('name');
      expect(token).toHaveProperty('symbol');
      expect(token).toHaveProperty('decimals');
      expect(token).toHaveProperty('extensions');
    }
  });

  test('tokens are sorted by chainId then symbol', () => {
    for (let i = 1; i < tokenList.tokens.length; i++) {
      const prev = tokenList.tokens[i - 1];
      const curr = tokenList.tokens[i];

      if (prev.chainId === curr.chainId) {
        expect(prev.symbol.localeCompare(curr.symbol)).toBeLessThanOrEqual(0);
      } else {
        expect(prev.chainId).toBeLessThan(curr.chainId);
      }
    }
  });

  test('origin tokens have isOrigin: true', () => {
    const originTokens = tokenList.tokens.filter((t) => t.extensions.isOrigin);
    expect(originTokens.length).toBeGreaterThan(0);

    for (const token of originTokens) {
      expect(token.extensions.isOrigin).toBe(true);
    }
  });

  test('logo URIs are correctly formatted', () => {
    const tokensWithLogos = tokenList.tokens.filter((t) => t.logoURI);

    for (const token of tokensWithLogos) {
      expect(token.logoURI).toMatch(
        /^https:\/\/raw\.githubusercontent\.com\/megaeth-labs\/mega-tokenlist\/main\/data\/.+\/logo\.(svg|png)$/
      );
    }
  });

  test('ETH token exists on both chains', () => {
    const ethTokens = tokenList.tokens.filter((t) => t.symbol === 'ETH');
    expect(ethTokens.length).toBe(2);

    const chainIds = ethTokens.map((t) => t.chainId).sort();
    expect(chainIds).toEqual([1, 4326]);
  });

  test('WETH token includes a MegaETH mainnet entry', () => {
    const wethTokens = tokenList.tokens.filter((t) => t.symbol === 'WETH');
    expect(wethTokens.some((t) => t.chainId === 4326)).toBe(true);
  });

  test('mainnet token list excludes testnet chain ids', () => {
    expect(tokenList.tokens.every((t) => t.chainId !== 6343)).toBe(true);
  });

  test('testnet token list only contains testnet chain ids', () => {
    expect(testnetTokenList.tokens.every((t) => t.chainId === 6343)).toBe(true);
  });
});
