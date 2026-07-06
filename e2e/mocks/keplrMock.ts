/** biome-ignore-all lint/suspicious/noExplicitAny: Keplr provider-extension proxy payloads and window globals are dynamically shaped */
import { Secp256k1HdWallet } from '@cosmjs/amino'
import { fromBech32, toHex } from '@cosmjs/encoding'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import type { Page } from '@playwright/test'
import { VERANA_TESTNET_CHAIN_INFO, type VeranaChainInfo } from './chainInfo'

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
  const chainInfo = opts.chainInfo ?? VERANA_TESTNET_CHAIN_INFO
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
        bodyBytes: hexToU8(wireDoc.bodyBytesHex),
        authInfoBytes: hexToU8(wireDoc.authInfoBytesHex),
        chainId: wireDoc.chainId,
        accountNumber: BigInt(wireDoc.accountNumber ?? '0'),
      } as any)
      return resp.signature
    }
  )

  await page.exposeFunction(
    '__mock_signAmino',
    async (_chainId: string, signerAddress: string, signDoc: any): Promise<WireStdSignature> => {
      const resp = await aminoWallet.signAmino(signerAddress, signDoc)
      return resp.signature
    }
  )

  await page.addInitScript(() => {
    const w = window as any
    const fromHex = (hex: string): Uint8Array => {
      const u8 = new Uint8Array(hex.length / 2)
      for (let i = 0; i < u8.length; i++) u8[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
      return u8
    }
    const toHexStr = (u8: Uint8Array): string => {
      let s = ''
      for (let i = 0; i < u8.length; i++) s += u8[i].toString(16).padStart(2, '0')
      return s
    }
    const jsonStringify = (obj: unknown): string =>
      JSON.stringify(obj, (k, v) => {
        if (k === '__proto__') throw new Error('__proto__ disallowed')
        if (v instanceof Uint8Array) return `__uint8array__${toHexStr(v)}`
        if (typeof v === 'bigint') return `__bigint__${v.toString()}`
        return v
      })
    const jsonParse = (text: string): any =>
      JSON.parse(text, (k, v) => {
        if (k === '__proto__') throw new Error('__proto__ disallowed')
        if (typeof v === 'string' && v.startsWith('__uint8array__')) return fromHex(v.slice('__uint8array__'.length))
        if (typeof v === 'string' && v.startsWith('__bigint__')) return BigInt(v.slice('__bigint__'.length))
        return v
      })
    const wrap = (x: any): any => (x === undefined ? undefined : jsonParse(jsonStringify(x)))
    const log = (...parts: unknown[]) => {
      if (w.__keplrMockVerbose) console.log('[keplrMock]', ...parts)
    }

    const handle = async (method: string, a: any[]): Promise<any> => {
      switch (method) {
        case 'ping':
        case 'enable':
        case 'disable':
        case 'experimentalSuggestChain':
        case 'suggestToken':
          return
        case 'getKey':
        case 'getKeyOld': {
          const k = await w.__mock_getKey()
          return {
            name: k.name,
            algo: k.algo,
            pubKey: fromHex(k.pubKeyHex),
            address: fromHex(k.addressHex),
            bech32Address: k.bech32Address,
            isNanoLedger: k.isNanoLedger,
            isKeystone: k.isKeystone,
          }
        }
        case 'getKeysSettled': {
          const [chainIds] = a as [string[]]
          const k = await w.__mock_getKey()
          return chainIds.map(() => ({
            status: 'fulfilled',
            value: {
              name: k.name,
              algo: k.algo,
              pubKey: fromHex(k.pubKeyHex),
              address: fromHex(k.addressHex),
              bech32Address: k.bech32Address,
              isNanoLedger: k.isNanoLedger,
              isKeystone: k.isKeystone,
            },
          }))
        }
        case 'signDirect': {
          const [chainId, signer, signDoc] = a as [string, string, any]
          const sig = await w.__mock_signDirect(chainId, signer, {
            bodyBytesHex: toHexStr(signDoc.bodyBytes),
            authInfoBytesHex: toHexStr(signDoc.authInfoBytes),
            chainId: signDoc.chainId,
            accountNumber: signDoc.accountNumber == null ? null : String(signDoc.accountNumber),
          })
          return {
            signed: {
              bodyBytes: signDoc.bodyBytes,
              authInfoBytes: signDoc.authInfoBytes,
              chainId: signDoc.chainId,
              accountNumber: signDoc.accountNumber == null ? null : String(signDoc.accountNumber),
            },
            signature: sig,
          }
        }
        case 'signAmino': {
          const [chainId, signer, signDoc] = a as [string, string, any]
          const sig = await w.__mock_signAmino(chainId, signer, signDoc)
          return { signed: signDoc, signature: sig }
        }
        default:
          throw new Error(`method "${method}" not implemented in mock`)
      }
    }

    // getKeplr() short-circuits to undefined on Chrome unless this flag is truthy
    w.keplrRequestMetaIdSupport = true

    window.addEventListener('message', async (e: MessageEvent) => {
      const data = e.data
      if (!data || typeof data !== 'object') return
      if (typeof data.type !== 'string' || !data.type.startsWith('proxy-request')) return
      if (data.type.startsWith('proxy-request-response')) return
      const { id, method, args: rawArgs } = data
      try {
        const value = await handle(method, Array.isArray(rawArgs) ? rawArgs : [])
        window.postMessage(
          { type: 'proxy-request-response', id, result: wrap({ return: value }) },
          window.location.origin
        )
      } catch (err: any) {
        log('error', method, err?.message ?? err)
        const result = wrap({ return: undefined, error: err?.message ?? String(err) })
        window.postMessage({ type: 'proxy-request-response', id, result }, window.location.origin)
      }
    })
  })

  return { bech32Address: account.address, pubkey: account.pubkey }
}
