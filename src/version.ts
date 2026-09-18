import * as fs from 'fs'
import { isDeepStrictEqual } from 'util'
import type { TokenList, TokenListToken } from './types'

const tokenKey = (token: TokenListToken) =>
  `${token.chainId}:${token.address.toLowerCase()}`

// An existing output is the release history. Never silently reset it.
export function versionTokenList(
  current: TokenList,
  outputFile: string
): TokenList {
  let content: string
  try {
    content = fs.readFileSync(outputFile, 'utf-8')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { ...current, version: { major: 1, minor: 0, patch: 0 } }
    }
    throw error
  }

  let previous: TokenList
  try {
    previous = JSON.parse(content) as TokenList
    if (
      !previous ||
      !previous.version ||
      !['major', 'minor', 'patch'].every((part) => {
        const value = previous.version[part as keyof TokenList['version']]
        return Number.isSafeInteger(value) && value >= 0
      }) ||
      typeof previous.name !== 'string' ||
      typeof previous.timestamp !== 'string' ||
      !Number.isFinite(Date.parse(previous.timestamp)) ||
      !Array.isArray(previous.tokens) ||
      !previous.tokens.every(
        (token) =>
          token &&
          Number.isSafeInteger(token.chainId) &&
          typeof token.address === 'string' &&
          typeof token.name === 'string' &&
          typeof token.symbol === 'string' &&
          Number.isInteger(token.decimals)
      )
    ) {
      throw new Error('Invalid token list history')
    }
  } catch (error) {
    throw new Error(`Cannot version token list from ${outputFile}: ${error}`)
  }

  const before = new Map(
    previous.tokens.map((token) => [tokenKey(token), token])
  )
  const after = new Map(current.tokens.map((token) => [tokenKey(token), token]))
  if (
    before.size !== previous.tokens.length ||
    after.size !== current.tokens.length
  ) {
    throw new Error(`Duplicate token identities in ${outputFile}`)
  }
  const removed = [...before.keys()].some((key) => !after.has(key))
  const added = [...after.keys()].some((key) => !before.has(key))
  const changed =
    previous.name !== current.name || !isDeepStrictEqual(before, after)
  if (!changed) return previous

  const { major, minor, patch } = previous.version
  const version = removed
    ? { major: major + 1, minor: 0, patch: 0 }
    : added
      ? { major, minor: minor + 1, patch: 0 }
      : { major, minor, patch: patch + 1 }
  if (!Object.values(version).every(Number.isSafeInteger)) {
    throw new Error(`Token list version overflow in ${outputFile}`)
  }
  return { ...current, version }
}
