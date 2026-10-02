import { describe, expect, it } from 'vitest'
import { parseIndexerStatus, parseRpcStatus } from './component-health'

describe('parseRpcStatus', () => {
  it('reads whether the node is still catching up', () => {
    expect(parseRpcStatus({ result: { sync_info: { catching_up: false, latest_block_height: '60735' } } })).toBe(
      'synced'
    )
    expect(parseRpcStatus({ result: { sync_info: { catching_up: true } } })).toBe('syncing')
  })

  it('rejects a payload without the sync flag', () => {
    expect(() => parseRpcStatus({ result: {} })).toThrow('catching_up')
  })
})

describe('parseIndexerStatus', () => {
  it('reads a crawling indexer', () => {
    expect(parseIndexerStatus({ is_running: true, is_crawling: true })).toEqual({ state: 'crawling', reason: null })
  })

  it('flags a stalled indexer with the reason it stopped', () => {
    expect(parseIndexerStatus({ is_running: true, is_crawling: false, stopped_reason: 'RPC unavailable' })).toEqual({
      state: 'stalled',
      reason: 'RPC unavailable',
    })
  })

  it('flags an indexer that is not running', () => {
    expect(parseIndexerStatus({ is_running: false, is_crawling: false })).toEqual({ state: 'down', reason: null })
  })

  it('rejects a payload without the status flags', () => {
    expect(() => parseIndexerStatus({ is_running: true })).toThrow('is_crawling')
  })
})
