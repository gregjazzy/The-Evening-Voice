import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy pour fetcher des médias R2 côté serveur (contourne le CORS de pub-*.r2.dev).
 * Utilisé uniquement pour la capture de frame vidéo lors du pause (1 appel ponctuel).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  try {
    const response = await fetch(url)
    if (!response.ok) {
      return NextResponse.json({ error: 'Fetch failed' }, { status: response.status })
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': response.headers.get('content-type') || 'video/mp4',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 })
  }
}
