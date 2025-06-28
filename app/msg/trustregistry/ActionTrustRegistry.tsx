
interface ActionDIDProps {
  action: string
  didUpdate: string | undefined
}

export default function ActionTrustRegistry({ action, didUpdate }: ActionDIDProps) {

  return (
    <span>Under Construction {action} {didUpdate}</span>
  )
}
