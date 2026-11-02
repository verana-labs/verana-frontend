import { describe, expect, it } from 'vitest'
import { indexerHealthFromResponse, parseGraphHealth, parseIndexerStatus, parseRpcStatus } from './component-health'

const NOW = Date.parse('2026-10-02T13:52:00Z')

describe('parseRpcStatus', () => {
  it('reads whether the node is still catching up', () => {
    const syncInfo = { catching_up: false, latest_block_height: '60735', latest_block_time: '2026-10-02T13:51:49Z' }
    expect(parseRpcStatus({ result: { sync_info: syncInfo } }, NOW)).toBe('synced')
    expect(parseRpcStatus({ result: { sync_info: { catching_up: true } } }, NOW)).toBe('syncing')
  })

  it('flags a chain whose last block is more than two minutes old', () => {
    expect(
      parseRpcStatus({ result: { sync_info: { catching_up: false, latest_block_time: '2026-10-02T13:40:00Z' } } }, NOW)
    ).toBe('stalled')
  })

  it('rejects a payload without the sync flag', () => {
    expect(() => parseRpcStatus({ result: {} })).toThrow('catching_up')
  })
})

describe('indexerHealthFromResponse', () => {
  it('reads a stopped indexer from the 503 its status route answers with', () => {
    expect(indexerHealthFromResponse(503, { error: 'Indexer is not responding. RPC unavailable ', code: 503 })).toEqual(
      { state: 'down', reason: 'Indexer is not responding. RPC unavailable' }
    )
  })

  it('throws on any other error status', () => {
    expect(() => indexerHealthFromResponse(500, null)).toThrow('500')
  })

  it('reads the status body on a 200', () => {
    expect(indexerHealthFromResponse(200, { is_running: true, is_crawling: false })).toEqual({
      state: 'stalled',
      reason: null,
    })
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

describe('parseGraphHealth', () => {
  it('reads a graph that keeps up with the indexer', () => {
    expect(parseGraphHealth({ status: 'ok', lastAppliedBlock: 13459 }, 13479)).toBe('synced')
  })

  it('flags a graph more than twenty blocks behind the indexer', () => {
    expect(parseGraphHealth({ status: 'ok', lastAppliedBlock: 13459 }, 13480)).toBe('stalled')
  })

  it('reads the graph as synced until the indexer height is known', () => {
    expect(parseGraphHealth({ status: 'ok', lastAppliedBlock: 0 }, null)).toBe('synced')
  })

  it('rejects a payload without the applied block', () => {
    expect(() => parseGraphHealth({ status: 'ok' }, 13459)).toThrow('lastAppliedBlock')
  })
})
