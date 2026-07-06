import { Buffer } from 'node:buffer'
import { toBase64, toHex } from '@cosmjs/encoding'
import type { Page, Route } from '@playwright/test'
import { BaseAccount } from 'cosmjs-types/cosmos/auth/v1beta1/auth'
import { QueryAccountResponse } from 'cosmjs-types/cosmos/auth/v1beta1/query'
import { GasInfo } from 'cosmjs-types/cosmos/base/abci/v1beta1/abci'
import { SimulateResponse } from 'cosmjs-types/cosmos/tx/v1beta1/service'
import { Any } from 'cosmjs-types/google/protobuf/any'

type JsonRpcRequest = {
  jsonrpc: '2.0'
  id: number | string
  method: string
  params?: Record<string, unknown>
}

export type MockChainOptions = {
  rpcEndpoint?: string
  chainId?: string
  address: string
  accountNumber?: number
  sequence?: number
  gasUsed?: number
  trustRegistryId?: string
  stubSri?: boolean
}

const NOW = '2026-01-01T00:00:00.000000000Z'
const ZERO_HASH_HEX = '0'.repeat(64)
const ZERO_HASH_B64 = toBase64(new Uint8Array(32))
const FAKE_TX_HASH_HEX = 'A'.repeat(64)
const FAKE_TX_HASH_B64 = Buffer.from(FAKE_TX_HASH_HEX, 'hex').toString('base64')

const jsonRpcResult = (id: number | string, result: unknown) => ({
  jsonrpc: '2.0',
  id,
  result,
})

// CometBFT 0.38 status; version must start with "0.38." or CosmJS connectComet rejects it
const statusResult = (chainId: string) => ({
  node_info: {
    protocol_version: { p2p: '8', block: '11', app: '0' },
    id: '0000000000000000000000000000000000000000',
    listen_addr: 'tcp://0.0.0.0:26656',
    network: chainId,
    version: '0.38.0',
    channels: '40202122233038606100',
    moniker: 'e2e-mock',
    other: { tx_index: 'on', rpc_address: 'tcp://0.0.0.0:26657' },
  },
  sync_info: {
    latest_block_hash: ZERO_HASH_HEX,
    latest_app_hash: ZERO_HASH_HEX,
    latest_block_height: '1000',
    latest_block_time: NOW,
    catching_up: false,
  },
  validator_info: {
    address: ZERO_HASH_HEX.slice(0, 40),
    pub_key: { type: 'tendermint/PubKeyEd25519', value: ZERO_HASH_B64 },
    voting_power: '0',
  },
})

// height must be a non-zero string or CosmJS queryAbci throws
const accountQueryResult = (address: string, accountNumber: number, sequence: number) => {
  const baseAccount = BaseAccount.fromPartial({
    address,
    accountNumber: BigInt(accountNumber),
    sequence: BigInt(sequence),
  })
  const accountAny = Any.fromPartial({
    typeUrl: '/cosmos.auth.v1beta1.BaseAccount',
    value: BaseAccount.encode(baseAccount).finish(),
  })
  const value = QueryAccountResponse.encode(QueryAccountResponse.fromPartial({ account: accountAny })).finish()
  return {
    response: {
      code: 0,
      log: '',
      info: '',
      index: '0',
      key: null,
      value: toBase64(value),
      height: '1000',
      codespace: '',
    },
  }
}

const simulateQueryResult = (gasUsed: number) => {
  const value = SimulateResponse.encode(
    SimulateResponse.fromPartial({
      gasInfo: GasInfo.fromPartial({ gasWanted: BigInt(gasUsed), gasUsed: BigInt(gasUsed) }),
    })
  ).finish()
  return {
    response: {
      code: 0,
      log: '',
      info: '',
      index: '0',
      key: null,
      value: toBase64(value),
      height: '1000',
      codespace: '',
    },
  }
}

const broadcastSyncResult = () => ({
  code: 0,
  data: '',
  log: '',
  codespace: '',
  hash: FAKE_TX_HASH_HEX,
})

// the create_trust_registry event is what the app reads to build the /tr/<id> redirect
const txSearchResult = (trustRegistryId: string) => ({
  txs: [
    {
      hash: FAKE_TX_HASH_HEX,
      height: '1001',
      index: 0,
      tx_result: {
        code: 0,
        codespace: '',
        log: '',
        data: '',
        gas_wanted: '300000',
        gas_used: '200000',
        events: [
          {
            type: 'create_trust_registry',
            attributes: [
              { key: 'trust_registry_id', value: trustRegistryId, index: true },
              { key: 'creator', value: 'e2e', index: true },
            ],
          },
        ],
      },
      tx: FAKE_TX_HASH_B64,
    },
  ],
  total_count: '1',
})

function parseRequest(route: Route): JsonRpcRequest | null {
  const raw = route.request().postData()
  if (!raw) return null
  try {
    return JSON.parse(raw) as JsonRpcRequest
  } catch {
    return null
  }
}

// Intercepts the Tendermint RPC so client-side signing runs end-to-end but nothing broadcasts.
export async function installMockChain(page: Page, opts: MockChainOptions) {
  const {
    rpcEndpoint = process.env.NEXT_PUBLIC_VERANA_RPC_ENDPOINT ?? 'https://rpc.testnet.verana.network',
    chainId = process.env.NEXT_PUBLIC_VERANA_CHAIN_ID ?? 'vna-testnet-1',
    address,
    accountNumber = 12,
    sequence = 7,
    gasUsed = 200_000,
    trustRegistryId = '4242',
    stubSri = true,
  } = opts

  const seen: string[] = []

  const rpcPattern = new RegExp(`^${escapeRegExp(rpcEndpoint.replace(/\/+$/, ''))}/?(\\?.*)?$`)

  await page.route(rpcPattern, async (route) => {
    if (route.request().method() !== 'POST') return route.continue()

    const req = parseRequest(route)
    if (!req) return route.continue()

    seen.push(req.method)
    const path = typeof req.params?.path === 'string' ? (req.params.path as string) : ''

    const fulfill = (result: unknown) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(jsonRpcResult(req.id, result)),
      })

    switch (req.method) {
      case 'status':
        return fulfill(statusResult(chainId))
      case 'abci_query': {
        if (path.includes('Service/Simulate')) return fulfill(simulateQueryResult(gasUsed))
        if (path.includes('Query/Account')) return fulfill(accountQueryResult(address, accountNumber, sequence))
        return fulfill(accountQueryResult(address, accountNumber, sequence))
      }
      case 'broadcast_tx_sync':
      case 'broadcast_tx_async':
        return fulfill(broadcastSyncResult())
      case 'tx_search':
        return fulfill(txSearchResult(trustRegistryId))
      case 'health':
        return fulfill({})
      default:
        return route.continue()
    }
  })

  if (stubSri) {
    await page.route('**/api/sri**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ sri: `sha256-${toHex(new Uint8Array(32))}` }),
      })
    )
  }

  return {
    seenMethods: () => [...seen],
    teardown: async () => {
      await page.unroute(rpcPattern)
      if (stubSri) await page.unroute('**/api/sri**')
    },
  }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
