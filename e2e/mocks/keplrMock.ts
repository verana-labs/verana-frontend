import { Secp256k1HdWallet, type StdSignDoc } from '@cosmjs/amino'
import { fromBech32, toHex } from '@cosmjs/encoding'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import type { Page } from '@playwright/test'
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { VERANA_DEVNET_CHAIN_INFO, type VeranaChainInfo } from './chainInfo'

export interface InstallKeplrMockOptions {
  mnemonic: string
  chainInfo?: VeranaChainInfo
  walletName?: string
}

export interface InstalledKeplrMock {
  bech32Address: string
  pubkey: Uint8Array
}

interface WireDirectSignDoc {
  bodyBytesHex: string
  authInfoBytesHex: string
  chainId: string
  accountNumber: string | null
}

interface WireStdSignature {
  pub_key: { type: string; value: string }
  signature: string
}

const hexToU8 = (hex: string): Uint8Array => {
  const u8 = new Uint8Array(hex.length / 2)
  for (let i = 0; i < u8.length; i++) u8[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return u8
}

export async function installKeplrMock(page: Page, opts: InstallKeplrMockOptions): Promise<InstalledKeplrMock> {
  const chainInfo = opts.chainInfo ?? VERANA_DEVNET_CHAIN_INFO
  const prefix = chainInfo.bech32Config.bech32PrefixAccAddr
  const walletName = opts.walletName ?? 'Verana Test Wallet'

  const directWallet = await DirectSecp256k1HdWallet.fromMnemonic(opts.mnemonic, { prefix })
  const aminoWallet = await Secp256k1HdWallet.fromMnemonic(opts.mnemonic, { prefix })
  const [account] = await directWallet.getAccounts()

  const wireKey = {
    name: walletName,
    algo: 'secp256k1' as const,
    pubKeyHex: toHex(account.pubkey),
    addressHex: toHex(fromBech32(account.address).data),
    bech32Address: account.address,
    isNanoLedger: false,
    isKeystone: false,
  }

  await page.exposeFunction('__mock_getKey', () => wireKey)

  await page.exposeFunction(
    '__mock_signDirect',
    async (_chainId: string, signerAddress: string, wireDoc: WireDirectSignDoc): Promise<WireStdSignature> => {
      const resp = await directWallet.signDirect(signerAddress, {
        ...SignDoc.fromPartial({
          bodyBytes: hexToU8(wireDoc.bodyBytesHex),
          authInfoBytes: hexToU8(wireDoc.authInfoBytesHex),
          chainId: wireDoc.chainId,
          accountNumber: BigInt(wireDoc.accountNumber ?? '0'),
        }),
      })
      return resp.signature
    }
  )

  await page.exposeFunction(
    '__mock_signAmino',
    async (_chainId: string, signerAddress: string, signDoc: StdSignDoc): Promise<WireStdSignature> => {
      const resp = await aminoWallet.signAmino(signerAddress, signDoc)
      return resp.signature
    }
  )

  await page.addInitScript(() => {
    type MockKey = {
      name: string
      algo: 'secp256k1'
      pubKeyHex: string
      addressHex: string
      bech32Address: string
      isNanoLedger: boolean
      isKeystone: boolean
    }
    type MockBridge = Window & {
      __mock_getKey: () => Promise<MockKey>
      __mock_signDirect: (
        chainId: string,
        signer: string,
        signDoc: {
          bodyBytesHex: string
          authInfoBytesHex: string
          chainId: string
          accountNumber: string | null
        }
      ) => Promise<{ pub_key: { type: string; value: string }; signature: string }>
      __mock_signAmino: (
        chainId: string,
        signer: string,
        signDoc: Record<string, unknown>
      ) => Promise<{ pub_key: { type: string; value: string }; signature: string }>
      keplrRequestMetaIdSupport?: boolean
    }

    const bridge = window as unknown as MockBridge
    const record = (value: unknown, name: string): Record<string, unknown> => {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new Error(`${name} must be an object`)
      }
      return value as Record<string, unknown>
    }
    const string = (value: unknown, name: string): string => {
      if (typeof value !== 'string') throw new Error(`${name} must be a string`)
      return value
    }
    const bytes = (value: unknown, name: string): Uint8Array => {
      if (!(value instanceof Uint8Array)) throw new Error(`${name} must be a Uint8Array`)
      return value
    }
    const fromHex = (hex: string): Uint8Array => {
      const u8 = new Uint8Array(hex.length / 2)
      for (let i = 0; i < u8.length; i++) u8[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
      return u8
    }
    const toHexStr = (u8: Uint8Array): string => {
      let result = ''
      for (let i = 0; i < u8.length; i++) result += u8[i].toString(16).padStart(2, '0')
      return result
    }
    const jsonStringify = (value: unknown): string => {
      const serialized = JSON.stringify(value, (key: string, entry: unknown) => {
        if (key === '__proto__') throw new Error('__proto__ disallowed')
        if (entry instanceof Uint8Array) return `__uint8array__${toHexStr(entry)}`
        if (typeof entry === 'bigint') return `__bigint__${entry.toString()}`
        return entry
      })
      if (serialized === undefined) throw new Error('Unable to serialize bridge value')
      return serialized
    }
    const jsonParse = (text: string): unknown =>
      JSON.parse(text, (key: string, entry: unknown) => {
        if (key === '__proto__') throw new Error('__proto__ disallowed')
        if (typeof entry === 'string' && entry.startsWith('__uint8array__')) {
          return fromHex(entry.slice('__uint8array__'.length))
        }
        if (typeof entry === 'string' && entry.startsWith('__bigint__')) {
          return BigInt(entry.slice('__bigint__'.length))
        }
        return entry
      })
    const wrap = (value: unknown): unknown => (value === undefined ? undefined : jsonParse(jsonStringify(value)))
    const keyResponse = async () => {
      const key = await bridge.__mock_getKey()
      return {
        name: key.name,
        algo: key.algo,
        pubKey: fromHex(key.pubKeyHex),
        address: fromHex(key.addressHex),
        bech32Address: key.bech32Address,
        isNanoLedger: key.isNanoLedger,
        isKeystone: key.isKeystone,
      }
    }

    const handle = async (method: string, args: unknown[]): Promise<unknown> => {
      switch (method) {
        case 'ping':
        case 'enable':
        case 'disable':
        case 'ethereum':
        case 'experimentalSuggestChain':
        case 'suggestToken':
          return undefined
        case 'getKey':
        case 'getKeyOld':
          return keyResponse()
        case 'getKeysSettled': {
          const chainIds = args[0]
          if (!Array.isArray(chainIds) || !chainIds.every((chainId) => typeof chainId === 'string')) {
            throw new Error('getKeysSettled chain IDs must be strings')
          }
          const key = await keyResponse()
          return chainIds.map(() => ({ status: 'fulfilled', value: key }))
        }
        case 'signDirect': {
          const chainId = string(args[0], 'signDirect chainId')
          const signer = string(args[1], 'signDirect signer')
          const signDoc = record(args[2], 'signDirect signDoc')
          const bodyBytes = bytes(signDoc.bodyBytes, 'signDirect bodyBytes')
          const authInfoBytes = bytes(signDoc.authInfoBytes, 'signDirect authInfoBytes')
          const documentChainId = string(signDoc.chainId, 'signDirect signDoc.chainId')
          const accountNumber = signDoc.accountNumber == null ? null : String(signDoc.accountNumber)
          const signature = await bridge.__mock_signDirect(chainId, signer, {
            bodyBytesHex: toHexStr(bodyBytes),
            authInfoBytesHex: toHexStr(authInfoBytes),
            chainId: documentChainId,
            accountNumber,
          })
          return {
            signed: { bodyBytes, authInfoBytes, chainId: documentChainId, accountNumber },
            signature,
          }
        }
        case 'signAmino': {
          const chainId = string(args[0], 'signAmino chainId')
          const signer = string(args[1], 'signAmino signer')
          const signDoc = record(args[2], 'signAmino signDoc')
          const signature = await bridge.__mock_signAmino(chainId, signer, signDoc)
          return { signed: signDoc, signature }
        }
        default:
          throw new Error(`method "${method}" not implemented in mock`)
      }
    }

    bridge.keplrRequestMetaIdSupport = true
    window.addEventListener('message', async (event: MessageEvent<unknown>) => {
      if (typeof event.data !== 'object' || event.data === null || Array.isArray(event.data)) return
      const data = event.data as Record<string, unknown>
      if (typeof data.type !== 'string' || !data.type.startsWith('proxy-request')) return
      if (data.type.startsWith('proxy-request-response')) return
      if (typeof data.method !== 'string') return
      if (typeof data.id !== 'string' && typeof data.id !== 'number') return
      const unwrappedArgs = wrap(data.args)
      const args = Array.isArray(unwrappedArgs) ? unwrappedArgs : []
      try {
        const value = await handle(data.method, args)
        window.postMessage(
          { type: 'proxy-request-response', id: data.id, result: wrap({ return: value }) },
          window.location.origin
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const result = wrap({ return: undefined, error: message })
        window.postMessage({ type: 'proxy-request-response', id: data.id, result }, window.location.origin)
      }
    })
  })

  return { bech32Address: account.address, pubkey: account.pubkey }
}
