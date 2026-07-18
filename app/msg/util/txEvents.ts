export type TxEvent = {
  type: string
  attributes: readonly {
    key: string
    value: string
  }[]
}

export function findEventAttribute(
  events: readonly TxEvent[],
  eventType: string,
  attributeKey: string
): string | undefined {
  return events
    .find((event) => event.type === eventType)
    ?.attributes.find((attribute) => attribute.key === attributeKey)?.value
}
