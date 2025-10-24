import { NextRequest } from 'next/server';
import { calculateSRI } from '@/lib/calculateSRI';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
    });
  }

  try {
    const sri = await calculateSRI(url);
    return new Response(JSON.stringify({ sri }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
    });
  }
}
