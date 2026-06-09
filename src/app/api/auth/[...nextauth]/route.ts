import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'

function getBaseUrl(req: NextRequest): string {
  // Prefer explicit env var if it's not localhost
  const envUrl = process.env.NEXTAUTH_URL
  if (envUrl && !envUrl.includes('localhost')) return envUrl

  // Derive from request: trust reverse-proxy headers (Render, Vercel, etc.)
  const proto =
    req.headers.get('x-forwarded-proto') ??
    (req.url.startsWith('https') ? 'https' : 'http')
  const host =
    req.headers.get('x-forwarded-host') ??
    req.headers.get('host') ??
    new URL(req.url).host

  return `${proto}://${host}`
}

function handler(req: NextRequest, ctx: any) {
  process.env.NEXTAUTH_URL = getBaseUrl(req)
  return NextAuth(authOptions)(req, ctx)
}

export { handler as GET, handler as POST }
