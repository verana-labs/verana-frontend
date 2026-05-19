/**
 * biome-ignore-all lint/suspicious/noConsole: this module is the single
 * permitted console-call site; all app code routes through `logger`.
 */

type Level = 'error' | 'warn' | 'info' | 'debug' | 'log'

const isProduction = process.env.NODE_ENV === 'production'

function emit(level: Level, ...args: unknown[]): void {
  if (level === 'debug' && isProduction) return
  console[level](...args)
}

export const logger = {
  error: (...args: unknown[]) => emit('error', ...args),
  warn: (...args: unknown[]) => emit('warn', ...args),
  info: (...args: unknown[]) => emit('info', ...args),
  debug: (...args: unknown[]) => emit('debug', ...args),
  log: (...args: unknown[]) => emit('log', ...args),
}
