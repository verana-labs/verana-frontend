import { randomUUID } from 'node:crypto'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { StargateClient } from '@cosmjs/stargate'
import { test } from '@playwright/test'
import { VERANA_DEVNET_CHAIN_INFO } from './mocks/chainInfo'
import { connectWallet } from './support/connect'
import { createEcosystem } from './support/flows'
import { requireFundedMnemonic } from './support/mnemonic'

const MIN_BALANCE_UVNA = BigInt(11_000_000)

test('connect mocked Keplr and create an ecosystem (real devnet broadcast)', async ({ page }) => {
  test.setTimeout(300_000)
  const mnemonic = requireFundedMnemonic()
  const prefix = VERANA_DEVNET_CHAIN_INFO.bech32Config.bech32PrefixAccAddr
  const [account] = await (await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix })).getAccounts()

  const rpc = await StargateClient.connect(VERANA_DEVNET_CHAIN_INFO.rpc)
  const balance = BigInt((await rpc.getBalance(account.address, 'uvna')).amount)
  rpc.disconnect()
  if (balance < MIN_BALANCE_UVNA) {
    throw new Error(
      `Test wallet ${account.address} has ${Number(balance) / 1e6} VNA, needs >= ${Number(MIN_BALANCE_UVNA) / 1e6} (10 deposit + ~1 gas).`
    )
  }

  await connectWallet(page, { mnemonic })

  const did = `did:web:e2e-${randomUUID().replace(/-/g, '').slice(0, 8)}.devnet.verana.network`
  const ecosystemId = await createEcosystem(page, { did })
  console.log(`created ecosystem ${did} (ecosystem ${ecosystemId})`)
})
