import { readFileSync } from 'node:fs'
import { Secp256k1HdWallet } from '@cosmjs/amino'
import { fromBech32, toHex } from '@cosmjs/encoding'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import type { Page } from '@playwright/test'

type KeyWire = { name: string; algo: string; pubKeyHex: string; addressHex: string; bech32Address: string }

/**
 * Drives @keplr-wallet/provider-extension's postMessage proxy protocol (not a window.keplr shim,
 * which that provider version ignores). Signing is delegated to a CosmJS wallet in the Node process.
 */
async function resolveMnemonic(prefix: string): Promise<string> {
  if (process.env.E2E_MNEMONIC) return process.env.E2E_MNEMONIC.trim()
  try {
    return readFileSync('.test-mnemonic', 'utf8').trim()
  } catch {
    // Ring A never broadcasts, so an unfunded throwaway is fine when no wallet is provided (e.g. CI).
    const generated = await DirectSecp256k1HdWallet.generate(24, { prefix })
    return generated.mnemonic
  }
}

export async function installKeplrMock(page: Page, opts: { prefix?: string }) {
  const prefix = opts.prefix ?? 'verana'
  const mnemonic = await resolveMnemonic(prefix)
  const direct = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix })
  const amino = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix })
  const [acct] = await direct.getAccounts()

  const keyWire: KeyWire = {
    name: 'e2e-test',
    algo: acct.algo,
    pubKeyHex: toHex(acct.pubkey),
    addressHex: toHex(fromBech32(acct.address).data),
    bech32Address: acct.address,
  }

  await page.exposeFunction('__keplrGetKey', () => keyWire)
  await page.exposeFunction('__keplrSignAmino', (signer: string, signDoc: unknown) =>
    amino.signAmino(signer, signDoc as Parameters<typeof amino.signAmino>[1])
  )
  await page.exposeFunction(
    '__keplrSignDirect',
    async (
      signer: string,
      sd: { bodyBytesHex: string; authInfoBytesHex: string; chainId: string; accountNumber: string }
    ) => {
      const hexToBytes = (h: string) => Uint8Array.from(h.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [])
      const res = await direct.signDirect(signer, {
        bodyBytes: hexToBytes(sd.bodyBytesHex),
        authInfoBytes: hexToBytes(sd.authInfoBytesHex),
        chainId: sd.chainId,
        accountNumber: BigInt(sd.accountNumber),
      })
      return {
        signed: {
          bodyBytesHex: toHex(res.signed.bodyBytes),
          authInfoBytesHex: toHex(res.signed.authInfoBytes),
          chainId: res.signed.chainId,
          accountNumber: res.signed.accountNumber.toString(),
        },
        signature: res.signature,
      }
    }
  )

  await page.addInitScript(() => {
    const U8 = '__uint8array__'
    const toHexStr = (bytes: Uint8Array) => {
      let s = ''
      for (const b of bytes) s += b.toString(16).padStart(2, '0')
      return s
    }
    const fromHexStr = (hex: string) => {
      const out = new Uint8Array(hex.length / 2)
      for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
      return out
    }
    // biome-ignore lint/suspicious/noExplicitAny: JSON reviver/replacer
    const wrap = (obj: any) =>
      JSON.parse(
        JSON.stringify(obj, (_k, v) => {
          if (v instanceof Uint8Array) return U8 + toHexStr(v)
          if (typeof v === 'bigint') return `__bigint__${v.toString()}`
          return v
        })
      )
    // biome-ignore lint/suspicious/noExplicitAny: JSON reviver/replacer
    const unwrap = (obj: any) =>
      JSON.parse(JSON.stringify(obj), (_k, v) => {
        if (typeof v === 'string' && v.startsWith(U8)) return fromHexStr(v.slice(U8.length))
        if (typeof v === 'string' && v.startsWith('__bigint__')) return BigInt(v.slice('__bigint__'.length))
        return v
      })

    // biome-ignore lint/suspicious/noExplicitAny: page globals
    const w = window as any
    w.keplrRequestMetaIdSupport = true
    w.keplr = { mode: 'extension', version: '0.12.999' }

    // biome-ignore lint/suspicious/noExplicitAny: proxy dispatch
    const handle = async (method: string, args: any[]): Promise<any> => {
      switch (method) {
        case 'ping':
        case 'enable':
        case 'disable':
        case 'experimentalSuggestChain':
          return {}
        case 'getKey':
        case 'getKeyInfo': {
          const k = await w.__keplrGetKey()
          return {
            name: k.name,
            algo: k.algo,
            pubKey: fromHexStr(k.pubKeyHex),
            address: fromHexStr(k.addressHex),
            bech32Address: k.bech32Address,
            isNanoLedger: false,
            isKeystone: false,
          }
        }
        case 'signAmino':
          return w.__keplrSignAmino(args[1], args[2])
        case 'signDirect': {
          const signDoc = args[2]
          const res = await w.__keplrSignDirect(args[1], {
            bodyBytesHex: toHexStr(signDoc.bodyBytes),
            authInfoBytesHex: toHexStr(signDoc.authInfoBytes),
            chainId: signDoc.chainId,
            accountNumber: signDoc.accountNumber.toString(),
          })
          return {
            signed: {
              bodyBytes: fromHexStr(res.signed.bodyBytesHex),
              authInfoBytes: fromHexStr(res.signed.authInfoBytesHex),
              chainId: res.signed.chainId,
              accountNumber: res.signed.accountNumber,
            },
            signature: res.signature,
          }
        }
        default:
          console.warn('[keplr-mock] unhandled method:', method)
          return null
      }
    }

    window.addEventListener('message', async (e: MessageEvent) => {
      const data = e.data
      if (!data || typeof data.type !== 'string') return
      if (data.type.indexOf('proxy-request') !== 0 || data.type.indexOf('response') !== -1) return
      const { id, method, args } = data
      let result: unknown
      try {
        result = { return: await handle(method, unwrap(args)) }
      } catch (err) {
        result = { error: err instanceof Error ? err.message : String(err) }
      }
      window.postMessage({ type: 'proxy-request-response', id, result: wrap(result) }, window.location.origin)
    })
  })
}
