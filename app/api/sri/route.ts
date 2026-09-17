import { calculateSRI } from '@/lib/calculateSRI'
import { failure, json, requestedUrl, throttle } from '@/lib/document-route'

export async function GET(request: Request) {
  const limited = throttle(request)
  if (limited) return limited
  const url = requestedUrl(request)
  if (!url) return json({ error: 'Missing or invalid url parameter' }, 400)
  try {
    return json({ sri: await calculateSRI(url) }, 200)
  } catch (error) {
    return failure(error)
  }
}
