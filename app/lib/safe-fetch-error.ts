export class SafeFetchError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SafeFetchError'
    this.status = status
  }
}
