import { readFileSync } from 'node:fs'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'

const fromEnv = () => (process.env.E2E_MNEMONIC ?? process.env.SECRET_WORDS)?.trim()
const fromFile = () => {
  try {
    return readFileSync('.test-mnemonic', 'utf8').trim()
  } catch {
    return undefined
  }
}

export async function resolveMnemonic(prefix = 'verana'): Promise<string> {
  const provided = fromEnv() ?? fromFile()
  if (provided) return provided
  const generated = await DirectSecp256k1HdWallet.generate(24, { prefix })
  return generated.mnemonic
}

export function requireFundedMnemonic(): string {
  const provided = fromEnv() ?? fromFile()
  if (!provided) {
    throw new Error(
      'No funded test wallet found. Set E2E_MNEMONIC (or SECRET_WORDS), or put a funded devnet mnemonic in .test-mnemonic.'
    )
  }
  return provided
}
