import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter'

type Row = { type: string; title: string; result: string; hashes: string[]; note: string }

const OUTPUT = 'test-results/live-keplr.md'

function describe(test: TestCase, result: TestResult): Row {
  const fixme = test.annotations.find((annotation) => annotation.type === 'fixme-reason')
  const type = test.title.match(/\/[a-z.0-9]+\.Msg\w+/)?.[0] ?? test.title.split(' ')[0]
  const hashes = [
    ...new Set(
      [...test.annotations, ...result.annotations]
        .filter((entry) => entry.type === 'tx')
        .map((entry) => entry.description ?? '')
    ),
  ]
  if (fixme) return { type, title: test.title, result: 'fixme', hashes, note: fixme.description ?? '' }
  if (result.status === 'skipped') return { type, title: test.title, result: 'skipped', hashes, note: '' }
  const note = result.status === 'passed' ? '' : (result.error?.message ?? result.status).split('\n')[0].slice(0, 160)
  return { type, title: test.title, result: result.status === 'passed' ? 'passed' : 'failed', hashes, note }
}

export default class MarkdownReporter implements Reporter {
  private readonly rows: Row[] = []

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!test.title.includes('/')) return
    this.rows.push(describe(test, result))
  }

  onEnd(result: FullResult): void {
    const cell = (value: string) => value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
    const lines = [
      '# Live Keplr run',
      '',
      `Status: ${this.rows.length === 0 ? 'no tests ran' : result.status}`,
      '',
      '| Message type | Test | Result | Tx hash | Note |',
      '| --- | --- | --- | --- | --- |',
      ...this.rows.map(
        (row) =>
          `| ${cell(row.type)} | ${cell(row.title)} | ${row.result} | ${row.hashes.map((hash) => `\`${hash}\``).join('<br>') || '-'} | ${cell(row.note)} |`
      ),
      '',
    ]
    mkdirSync(dirname(OUTPUT), { recursive: true })
    writeFileSync(OUTPUT, lines.join('\n'))
  }
}
