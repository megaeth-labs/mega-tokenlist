import { CHAINS, CHAIN_IDS, L2_TO_L1 } from '../chains';
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
});

describe('Token List Generation', () => {
  const tokenList = generate();

  test('generates valid token list structure', () => {
    expect(tokenList).toHaveProperty('name', 'MegaETH Token List');
    expect(tokenList).toHaveProperty('timestamp');
    expect(tokenList).toHaveProperty('version');
    expect(tokenList).toHaveProperty('tokens');
    expect(Array.isArray(tokenList.tokens)).toBe(true);
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

  test('native tokens have isOrigin: true', () => {
    const nativeTokens = tokenList.tokens.filter((t) => t.extensions.isOrigin);
    expect(nativeTokens.length).toBeGreaterThan(0);

    for (const token of nativeTokens) {
      expect(token.extensions.isOrigin).toBe(true);
      expect(token.extensions.bridgeAddress).toBeUndefined();
      expect(token.extensions.bridgeType).toBeUndefined();
    }
  });

  test('logo URIs are correctly formatted', () => {
    const tokensWithLogos = tokenList.tokens.filter((t) => t.logoURI);

    for (const token of tokensWithLogos) {
      expect(token.logoURI).toMatch(
        /^https:\/\/raw\.githubusercontent\.com\/megaeth-labs\/mega-tokenlist\/main\/data\/\w+\/logo\.(svg|png)$/
      );
    }
  });

  test('ETH token exists on both chains', () => {
    const ethTokens = tokenList.tokens.filter((t) => t.symbol === 'ETH');
    expect(ethTokens.length).toBe(2);

    const chainIds = ethTokens.map((t) => t.chainId).sort();
    expect(chainIds).toEqual([1, 4326]);
  });

  test('WETH token exists only on MegaETH', () => {
    const wethTokens = tokenList.tokens.filter((t) => t.symbol === 'WETH');
    expect(wethTokens.length).toBe(1);
    expect(wethTokens[0].chainId).toBe(4326);
    expect(wethTokens[0].extensions.isOrigin).toBe(true);
  });
});
