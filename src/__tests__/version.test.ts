import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { versionTokenList } from '../version'
import type { TokenList, TokenListToken } from '../types'

const token: TokenListToken = {
  chainId: 1,
  address: '0xabc',
  name: 'Token',
  symbol: 'TOK',
  decimals: 18,
  extensions: { isOrigin: true, mechanism: 'native', isOFT: false },
}
const previous: TokenList = {
  name: 'List',
  timestamp: '2026-01-01T00:00:00.000Z',
  version: { major: 2, minor: 3, patch: 4 },
  tokens: [token],
}
let directory: string
let output: string
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tokenlist-version-'))
  output = path.join(directory, 'list.json')
  fs.writeFileSync(output, JSON.stringify(previous))
})
afterEach(() => fs.rmSync(directory, { recursive: true, force: true }))
const current = (tokens = previous.tokens): TokenList => ({
  ...previous,
  tokens,
  timestamp: '2026-02-01T00:00:00.000Z',
})

test('initial generation starts at 1.0.0, including an empty list', () => {
  fs.unlinkSync(output)
  for (const tokens of [[], [token]]) {
    expect(versionTokenList(current(tokens), output).version).toEqual({
      major: 1,
      minor: 0,
      patch: 0,
    })
  }
})
test('unchanged content preserves version and timestamp across repeated runs', () => {
  const result = versionTokenList(current(), output)
  expect(result).toEqual(previous)
  fs.writeFileSync(output, JSON.stringify(result))
  expect(versionTokenList(current(), output)).toEqual(previous)
})
test('token and object property order do not create updates', () => {
  const second = { ...token, address: '0xdef' }
  fs.writeFileSync(
    output,
    JSON.stringify({ ...previous, tokens: [token, second] })
  )
  expect(
    versionTokenList(
      current([
        second,
        {
          ...token,
          extensions: { isOFT: false, mechanism: 'native', isOrigin: true },
        },
      ]),
      output
    ).version
  ).toEqual(previous.version)
})
test.each([
  [
    'addition',
    [token, { ...token, address: '0xdef' }],
    { major: 2, minor: 4, patch: 0 },
  ],
  ['removal', [], { major: 3, minor: 0, patch: 0 }],
  [
    'replacement',
    [{ ...token, address: '0xdef' }],
    { major: 3, minor: 0, patch: 0 },
  ],
  [
    'chain change',
    [{ ...token, chainId: 4326 }],
    { major: 3, minor: 0, patch: 0 },
  ],
  ['metadata', [{ ...token, symbol: 'NEW' }], { major: 2, minor: 3, patch: 5 }],
  [
    'bridge classification',
    [
      {
        ...token,
        extensions: { ...token.extensions, bridgeType: 'canonical' as const },
      },
    ],
    { major: 2, minor: 3, patch: 5 },
  ],
  [
    'address case',
    [{ ...token, address: '0xABC' }],
    { major: 2, minor: 3, patch: 5 },
  ],
])('%s uses the appropriate bump', (_name, tokens, version) => {
  expect(versionTokenList(current(tokens), output).version).toEqual(version)
})
test.each([
  '{',
  '{}',
  JSON.stringify({ ...previous, version: { major: -1, minor: 0, patch: 0 } }),
  JSON.stringify({ ...previous, tokens: [null] }),
])('rejects corrupt history: %s', (content) => {
  fs.writeFileSync(output, content)
  expect(() => versionTokenList(current(), output)).toThrow(
    'Cannot version token list'
  )
  expect(fs.readFileSync(output, 'utf-8')).toBe(content)
})
test('propagates read errors instead of treating them as a first run', () => {
  expect(() => versionTokenList(current(), directory)).toThrow()
})
test('mainnet and testnet histories advance independently', () => {
  const testnet = path.join(directory, 'testnet.json')
  fs.writeFileSync(testnet, JSON.stringify(previous))
  expect(
    versionTokenList(current([{ ...token, symbol: 'NEW' }]), output).version
      .patch
  ).toBe(5)
  expect(versionTokenList(current(), testnet)).toEqual(previous)
})
