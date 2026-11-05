import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ParticipantsRedirect({ params, searchParams }: Props) {
  const { id } = await params
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    const values = Array.isArray(value) ? value : value === undefined ? [] : [value]
    for (const item of values) query.append(key, item)
  }
  query.set('tab', 'participants')
  redirect(`/credential-schemas/${id}?${query.toString()}`)
}
