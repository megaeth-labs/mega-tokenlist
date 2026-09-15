import * as fs from 'fs'
import * as path from 'path'
import { generate } from '../generate'

jest.mock('fs', () => ({
  __esModule: true,
  ...jest.requireActual('fs'),
  readFileSync: jest.fn(jest.requireActual('fs').readFileSync),
}))
const actualRead = jest.requireActual<typeof fs>('fs').readFileSync
const ethPath = path.resolve(__dirname, '../../data/ETH/data.json')

afterEach(() => {
  ;(fs.readFileSync as jest.Mock).mockImplementation(actualRead)
})

test.each([
  ['0x7f82f57f0dd546519324392e408b01fcc7d709e8', 'canonical'],
  ['0x7f82f57F0Dd546519324392e408b01fcC7D709e8', 'canonical'],
  ['0x0CA3A2FBC3D770b578223FBB6b062fa875a2eE75', 'canonical'],
  ['0x0ca3a2fbc3d770b578223fbb6b062fa875a2ee75', 'canonical'],
  ['0x4200000000000000000000000000000000000010', 'canonical'],
  ['0x1111111111111111111111111111111111111111', 'others'],
  [undefined, undefined],
])(
  'classifies bridge %s without changing the stored address',
  (bridge, expected) => {
    ;(fs.readFileSync as jest.Mock).mockImplementation((file, options) => {
      const content = actualRead(file, options)
      if (file !== ethPath) return content
      const data = JSON.parse(content.toString())
      data.tokens.ethereum.bridge = bridge
      return JSON.stringify(data)
    })
    const eth = generate().tokens.find(
      (token) => token.symbol === 'ETH' && token.chainId === 1
    )!
    expect(eth.extensions.bridgeType).toBe(expected)
    expect(eth.extensions.bridgeAddress).toBe(bridge)
  }
)
